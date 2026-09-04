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

import { DayAvailabilitySheet } from "../../components/dashboard/day-availability-sheet";
import { LessonCard } from "../../components/dashboard/lesson-card";
import { MonthCalendar } from "../../components/dashboard/month-calendar";
import { CloseIcon } from "../../components/icons/lesson-detail-icons";
import { colors, spacing } from "../../constants/theme";
import { useInstructorBookings } from "../../hooks/use-instructor-bookings";
import {
  getInstructorAvailability,
  type DailyAvailabilityPayload,
} from "../../services/availability";
import type { Lesson } from "../../types/dashboard";
import type { InstructorBooking } from "../../types/instructor-bookings";
import {
  formatSelectedDayLabel,
  getLessonCountsInMonth,
  getLessonsForDate,
  shiftMonth,
} from "../../utils/lesson-dates";
import { goBackOr } from "../../utils/navigation";

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 94, 255, 0.08)" } : undefined;

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

export default function CalendarScreen() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const getTokenRef = useRef(getToken);

  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();

    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const [availabilityDate, setAvailabilityDate] = useState<Date | null>(null);

  const [availabilityVisible, setAvailabilityVisible] = useState(false);

  const [calendarPressActive, setCalendarPressActive] = useState(false);

  const [availability, setAvailability] = useState<
    DailyAvailabilityPayload[] | null
  >(null);

  const {
    bookings,
    loading: bookingsLoading,
    error: bookingsError,
    refetch: refetchBookings,
  } = useInstructorBookings();

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const lessons = useMemo(
    () => bookings.map(mapInstructorBookingToLesson),
    [bookings],
  );

  const lessonCounts = useMemo(
    () =>
      getLessonCountsInMonth(
        lessons,
        visibleMonth.getFullYear(),
        visibleMonth.getMonth(),
      ),
    [lessons, visibleMonth],
  );

  const selectedLessons = useMemo(
    () => getLessonsForDate(lessons, selectedDate),
    [lessons, selectedDate],
  );

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
    const nextMonth = shiftMonth(visibleMonth, -1);

    setVisibleMonth(nextMonth);

    setSelectedDate(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1));
  }

  function handleNextMonth() {
    const nextMonth = shiftMonth(visibleMonth, 1);

    setVisibleMonth(nextMonth);

    setSelectedDate(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1));
  }

  function handleSelectDate(date: Date) {
    setSelectedDate(date);

    if (
      date.getMonth() !== visibleMonth.getMonth() ||
      date.getFullYear() !== visibleMonth.getFullYear()
    ) {
      setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }

  function handleLongPressDate(date: Date) {
    setCalendarPressActive(false);

    handleSelectDate(date);

    setAvailabilityDate(date);
    setAvailabilityVisible(true);

    if (!availability) {
      void loadAvailability();
    }
  }

  function renderSelectedDayLessons() {
    if (bookingsLoading) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={colors.primary} />

          <Text style={styles.loadingText}>Loading lessons...</Text>
        </View>
      );
    }

    if (bookingsError) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.errorTitle}>Unable to load lessons</Text>

          <Text style={styles.emptySubtitle}>{bookingsError}</Text>

          <Pressable
            onPress={() => void refetchBookings()}
            android_ripple={ANDROID_RIPPLE}
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.retryButtonText}>Try again</Text>
          </Pressable>
        </View>
      );
    }

    if (selectedLessons.length > 0) {
      return selectedLessons.map((lesson) => (
        <LessonCard key={lesson.id} lesson={lesson} />
      ));
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No lessons scheduled</Text>

        <Text style={styles.emptySubtitle}>
          Pick another day to view lessons.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            onPress={() => goBackOr("/dashboard")}
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
            selectedDate={selectedDate}
            lessonCounts={lessonCounts}
            onSelectDate={handleSelectDate}
            onLongPressDate={handleLongPressDate}
            onDayPressActiveChange={setCalendarPressActive}
            onPreviousMonth={handlePreviousMonth}
            onNextMonth={handleNextMonth}
          />

          <View style={styles.divider} />

          <Text style={styles.dayLabel}>
            {formatSelectedDayLabel(selectedDate)}
          </Text>

          <View style={styles.lessonList}>{renderSelectedDayLessons()}</View>
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
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  lessonList: {
    gap: spacing.md,
  },
  loadingState: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyState: {
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.error,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  retryButton: {
    marginTop: spacing.sm,
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.white,
  },
  pressed: {
    opacity: 0.85,
  },
});
