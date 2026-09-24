import { useAuth } from "@clerk/clerk-expo";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DayAvailabilitySheet } from "../../../components/dashboard/day-availability-sheet";
import { MonthCalendar } from "../../../components/dashboard/month-calendar";
import { CloseIcon } from "../../../components/icons/lesson-detail-icons";
import { colors, spacing } from "../../../constants/theme";
import { useInstructorBookings } from "../../../hooks/use-instructor-bookings";
import {
  getInstructorAvailability,
  type DailyAvailabilityPayload,
} from "../../../services/availability";
import {
  addBlockedSlots,
  removeBlockedSlots,
} from "../../../services/blocked-time-slots";
import type { Lesson } from "../../../types/dashboard";
import type { InstructorBooking } from "../../../types/instructor-bookings";
import {
  eachDayInclusive,
  isSameDateRange,
  normalizeDateRange,
  shiftMonth,
  startOfDay,
  type DateRange,
} from "../../../utils/lesson-dates";
import { goBackOr } from "../../../utils/navigation";

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 94, 255, 0.08)" } : undefined;
const ANDROID_UNBLOCK_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(220, 38, 38, 0.12)" } : undefined;
const RANGE_ACTION_DELAY_MS = 2500;

function formatInTimeZone(
  date: Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      ...options,
      timeZone,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-US", options).format(date);
  }
}

function formatDuration(startDatetime: string, endDatetime: string): string {
  const start = new Date(startDatetime).getTime();
  const end = new Date(endDatetime).getTime();
  const minutes = Math.max(0, Math.round((end - start) / 60_000));

  if (minutes < 60) {
    return `${minutes} min`;
  }

  if (minutes % 60 === 0) {
    const hours = minutes / 60;

    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  const hours = minutes / 60;

  return `${Number(hours.toFixed(2))} hours`;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getPickupLocation(booking: InstructorBooking): string {
  const address = booking.pickupAddress?.trim();

  if (address) {
    return address;
  }

  const suburb = booking.pickupSuburb?.trim();
  const postcode = booking.pickupPostcode?.trim();

  const location = [suburb, postcode].filter(Boolean).join(" ");

  return location || "Pickup location unavailable";
}

function mapInstructorBookingToLesson(booking: InstructorBooking): Lesson {
  const start = new Date(booking.startDatetime);

  const timeZone = booking.school.timezone;

  const dayOfWeek = formatInTimeZone(start, timeZone, {
    weekday: "short",
  }).toUpperCase();

  const day = formatInTimeZone(start, timeZone, {
    day: "numeric",
  });

  const month = formatInTimeZone(start, timeZone, {
    month: "short",
  }).toUpperCase();

  const year = formatInTimeZone(start, timeZone, {
    year: "numeric",
  });

  const time = formatInTimeZone(start, timeZone, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).toUpperCase();

  return {
    id: booking.id,
    dayOfWeek,
    day,
    month,
    year,
    time,
    title: booking.school.name,
    duration: formatDuration(booking.startDatetime, booking.endDatetime),
    status: booking.status === "confirmed" ? "upcoming" : booking.status,
    locationName: booking.school.name,
    locationAddress: getPickupLocation(booking),
    latitude: 0,
    longitude: 0,
    schoolLogoUrl: booking.school.logoUrl ?? undefined,
    studentInitials: getInitials(booking.student.name),
    studentName: booking.student.name,
    studentEmail: booking.student.email ?? "",
    studentPhone: booking.student.phone ?? "",
    studentSubtitle: "",
    studentAvatarUrl: undefined,
  };
}

const DEFAULT_START = "08:00";
const DEFAULT_END = "17:00";
const DEFAULT_INTERVAL = 15;

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

function minutesToTime24(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatSlotLabel(time24: string) {
  const [hoursRaw, minutes] = time24.split(":");
  let hours = Number(hoursRaw);

  if (!Number.isFinite(hours)) {
    return time24;
  }

  hours = hours % 12 || 12;

  return `${hours}:${minutes}`;
}

function buildTimeSlots(
  startTime: string,
  endTime: string,
  intervalMinutes: number,
) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const interval =
    Number.isFinite(intervalMinutes) && intervalMinutes > 0
      ? intervalMinutes
      : DEFAULT_INTERVAL;

  if (start === null || end === null || end < start) {
    return [];
  }

  const slots: string[] = [];

  for (let minutes = start; minutes <= end; minutes += interval) {
    slots.push(formatSlotLabel(minutesToTime24(minutes)));
  }

  return slots;
}

function getSlotsForDate(
  date: Date,
  availability: DailyAvailabilityPayload[] | null,
) {
  const dayData = availability?.find((day) => day.dayOfWeek === date.getDay());

  if (dayData) {
    if (!dayData.isWorking || !dayData.startTime || !dayData.endTime) {
      return [];
    }

    return buildTimeSlots(
      dayData.startTime,
      dayData.endTime,
      DEFAULT_INTERVAL,
    );
  }

  return buildTimeSlots(DEFAULT_START, DEFAULT_END, DEFAULT_INTERVAL);
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function applyRangeSlots(
  start: Date,
  end: Date,
  availability: DailyAvailabilityPayload[] | null,
  action: "block" | "unblock",
) {
  eachDayInclusive(start, end).forEach((date) => {
    const slots = getSlotsForDate(date, availability);

    if (slots.length === 0) {
      return;
    }

    if (action === "unblock") {
      removeBlockedSlots(date, slots);
      return;
    }

    addBlockedSlots(date, slots);
  });
}

export default function CalendarScreen() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const getTokenRef = useRef(getToken);

  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();

    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [rangeStart, setRangeStart] = useState<Date | null>(null);

  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);

  const [availabilityDate, setAvailabilityDate] = useState<Date | null>(null);

  const [availabilityVisible, setAvailabilityVisible] = useState(false);

  const [calendarPressActive, setCalendarPressActive] = useState(false);

  const [rangeAction, setRangeAction] = useState<
    "ready" | "blocking" | "unblocking"
  >("ready");

  const [blockedRanges, setBlockedRanges] = useState<DateRange[]>([]);

  const rangeActionIdRef = useRef(0);

  const [availability, setAvailability] = useState<
    DailyAvailabilityPayload[] | null
  >(null);

  const {
    bookings,
  } = useInstructorBookings();

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const lessons = useMemo(
    () => bookings.map(mapInstructorBookingToLesson),
    [bookings],
  );

  const rangeComplete = Boolean(rangeStart && rangeEnd);
  const isBusy = rangeAction === "blocking" || rangeAction === "unblocking";
  const isCurrentRangeBlocked = Boolean(
    rangeStart &&
      rangeEnd &&
      blockedRanges.some((range) =>
        isSameDateRange(range, rangeStart, rangeEnd),
      ),
  );
  const isBlocked =
    rangeAction === "unblocking" ||
    (rangeAction !== "blocking" && isCurrentRangeBlocked);

  const loadAvailability = useCallback(async () => {
    try {
      const data = await getInstructorAvailability(getTokenRef.current);

      setAvailability(Array.isArray(data) ? data : []);
    } catch {
      setAvailability(null);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    void loadAvailability();
  }, [isLoaded, isSignedIn, loadAvailability]);

  function handlePreviousMonth() {
    setVisibleMonth(shiftMonth(visibleMonth, -1));
  }

  function handleNextMonth() {
    setVisibleMonth(shiftMonth(visibleMonth, 1));
  }

  function handleSelectDate(date: Date) {
    rangeActionIdRef.current += 1;
    setRangeAction("ready");

    if (
      date.getMonth() !== visibleMonth.getMonth() ||
      date.getFullYear() !== visibleMonth.getFullYear()
    ) {
      setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }

    if (!rangeStart || rangeEnd) {
      setRangeStart(date);
      setRangeEnd(null);
      return;
    }

    if (startOfDay(date).getTime() < startOfDay(rangeStart).getTime()) {
      setRangeEnd(rangeStart);
      setRangeStart(date);
      return;
    }

    setRangeEnd(date);
  }

  function handleLongPressDate(date: Date) {
    setCalendarPressActive(false);

    setAvailabilityDate(date);
    setAvailabilityVisible(true);

    if (!availability) {
      void loadAvailability();
    }
  }

  async function handleBlockRange() {
    if (!rangeStart || !rangeEnd || isBusy) {
      return;
    }

    const start = rangeStart;
    const end = rangeEnd;
    const actionId = rangeActionIdRef.current + 1;
    rangeActionIdRef.current = actionId;

    if (isCurrentRangeBlocked) {
      setRangeAction("unblocking");
      await wait(RANGE_ACTION_DELAY_MS);

      if (rangeActionIdRef.current !== actionId) {
        return;
      }

      applyRangeSlots(start, end, availability, "unblock");
      setBlockedRanges((current) =>
        current.filter((range) => !isSameDateRange(range, start, end)),
      );
      setRangeAction("ready");
      return;
    }

    setRangeAction("blocking");
    await wait(RANGE_ACTION_DELAY_MS);

    if (rangeActionIdRef.current !== actionId) {
      return;
    }

    applyRangeSlots(start, end, availability, "block");
    setBlockedRanges((current) => [...current, normalizeDateRange(start, end)]);
    setRangeAction("ready");
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            onPress={() => goBackOr("/dashboard/account/calendar-settings")}
            android_ripple={ANDROID_RIPPLE}
            hitSlop={8}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.pressed,
            ]}
          >
            <CloseIcon />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!calendarPressActive}
          keyboardShouldPersistTaps="handled"
        >
          <MonthCalendar
            visibleMonth={visibleMonth}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            lessonCounts={new Map()}
            compact
            blockedRanges={blockedRanges}
            onSelectDate={handleSelectDate}
            onLongPressDate={handleLongPressDate}
            onDayPressActiveChange={setCalendarPressActive}
            onPreviousMonth={handlePreviousMonth}
            onNextMonth={handleNextMonth}
          />

          <Pressable
            onPress={() => void handleBlockRange()}
            disabled={!rangeComplete || isBusy}
            android_ripple={
              !rangeComplete
                ? undefined
                : isBlocked
                  ? ANDROID_UNBLOCK_RIPPLE
                  : ANDROID_RIPPLE
            }
            accessibilityRole="button"
            accessibilityLabel={
              rangeAction === "blocking"
                ? "Blocking"
                : rangeAction === "unblocking"
                  ? "Unblocking"
                  : isBlocked
                    ? "Unblock"
                    : "Block"
            }
            style={({ pressed }) => [
              styles.blockButton,
              isBlocked && styles.unblockButton,
              !rangeComplete && !isBusy && styles.blockButtonDisabled,
              pressed && rangeComplete && !isBusy && styles.pressed,
            ]}
          >
            {isBusy ? (
              <View style={styles.blockButtonLoading}>
                <ActivityIndicator size="small" color={colors.white} />
                <Text style={styles.blockButtonText}>
                  {rangeAction === "unblocking" ? "Unblocking..." : "Blocking..."}
                </Text>
              </View>
            ) : (
              <Text
                style={[
                  styles.blockButtonText,
                  !rangeComplete && styles.blockButtonTextDisabled,
                ]}
              >
                {isBlocked ? "Unblock" : "Block"}
              </Text>
            )}
          </Pressable>
        </ScrollView>

        <DayAvailabilitySheet
          visible={availabilityVisible}
          date={availabilityDate}
          availability={availability}
          lessons={lessons}
          onClose={() => setAvailabilityVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  blockButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  unblockButton: {
    backgroundColor: colors.error,
  },
  blockButtonLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  blockButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
  },
  blockButtonDisabled: {
    backgroundColor: colors.inputBackground,
  },
  blockButtonTextDisabled: {
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.85,
  },
});
