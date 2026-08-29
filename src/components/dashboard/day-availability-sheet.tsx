import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, spacing } from "../../constants/theme";
import type { DailyAvailabilityPayload } from "../../services/availability";
import {
  addBlockedSlots,
  getBlockedSlotsForDate,
  removeBlockedSlots,
  subscribeBlockedSlots,
} from "../../services/blocked-time-slots";
import type { Lesson } from "../../types/dashboard";
import { getLessonsForDate } from "../../utils/lesson-dates";

type DayAvailabilitySheetProps = {
  visible: boolean;
  date: Date | null;
  availability: DailyAvailabilityPayload[] | null;
  lessons?: Lesson[];
  onClose: () => void;
};

const SHEET_SLIDE_DISTANCE = 720;
const FADE_DURATION = 220;
const SLIDE_DURATION = 320;
const DEFAULT_START = "08:00";
const DEFAULT_END = "17:00";
const DEFAULT_INTERVAL = 15;
/** Block selected slot through +1 hour (e.g. 8:00 → 9:00), so next open is +1h15m. */
const BLOCK_DURATION_MINUTES = 60;

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(220, 38, 38, 0.12)" } : undefined;

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

function parseLessonTimeToMinutes(time: string) {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toLowerCase();

  if (period === "pm" && hours !== 12) {
    hours += 12;
  }
  if (period === "am" && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

function parseDurationMinutes(duration: string) {
  const hoursMatch = duration.match(/([\d.]+)\s*hours?/i);
  if (hoursMatch) {
    return Math.round(Number(hoursMatch[1]) * 60);
  }

  const minutesMatch = duration.match(/(\d+)\s*min/i);
  if (minutesMatch) {
    return Number(minutesMatch[1]);
  }

  return 60;
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

function findDayAvailability(
  availability: DailyAvailabilityPayload[] | null,
  date: Date,
): DailyAvailabilityPayload | null {
  if (!availability) {
    return null;
  }

  return availability.find((day) => day.dayOfWeek === date.getDay()) ?? null;
}

function getSlotsForDate(
  date: Date,
  availability: DailyAvailabilityPayload[] | null,
) {
  const dayData = findDayAvailability(availability, date);

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

function getBookedSlotsForDate(lessons: Lesson[], date: Date) {
  const booked = new Set<string>();
  const dayLessons = getLessonsForDate(lessons, date).filter(
    (lesson) => lesson.status !== "cancelled",
  );

  dayLessons.forEach((lesson) => {
    const start = parseLessonTimeToMinutes(lesson.time);
    if (start === null) {
      return;
    }

    const end = start + parseDurationMinutes(lesson.duration);
    for (let minutes = start; minutes < end; minutes += DEFAULT_INTERVAL) {
      booked.add(formatSlotLabel(minutesToTime24(minutes)));
    }
  });

  return booked;
}

export function DayAvailabilitySheet({
  visible,
  date,
  availability,
  lessons = [],
  onClose,
}: Readonly<DayAvailabilitySheetProps>) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const [blockedSlots, setBlockedSlots] = useState<string[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SHEET_SLIDE_DISTANCE)).current;

  const slots = useMemo(() => {
    if (!date) {
      return [];
    }
    return getSlotsForDate(date, availability);
  }, [availability, date]);

  const bookedSlots = useMemo(() => {
    if (!date) {
      return new Set<string>();
    }
    return getBookedSlotsForDate(lessons, date);
  }, [date, lessons]);

  const openCount = slots.filter(
    (slot) => !blockedSlots.includes(slot) && !bookedSlots.has(slot),
  ).length;

  useEffect(() => {
    return subscribeBlockedSlots(() => {
      if (date) {
        setBlockedSlots(getBlockedSlotsForDate(date));
      }
    });
  }, [date]);

  useEffect(() => {
    if (visible && date) {
      setBlockedSlots(getBlockedSlotsForDate(date));
    }
  }, [date, visible]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      fadeAnim.setValue(0);
      slideAnim.setValue(SHEET_SLIDE_DISTANCE);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: FADE_DURATION,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: SLIDE_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!mounted) {
      return;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: FADE_DURATION,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SHEET_SLIDE_DISTANCE,
        duration: SLIDE_DURATION,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setMounted(false);
      }
    });
  }, [fadeAnim, mounted, slideAnim, visible]);

  if (!mounted || !date) {
    return null;
  }

  function handleToggle(time: string) {
    if (!date || bookedSlots.has(time)) {
      return;
    }

    const startIndex = slots.indexOf(time);
    if (startIndex === -1) {
      return;
    }

    const slotsInHour = BLOCK_DURATION_MINUTES / DEFAULT_INTERVAL;
    const hourBlock: string[] = [];

    for (let offset = 0; offset <= slotsInHour; offset += 1) {
      const slot = slots[startIndex + offset];
      if (!slot) {
        break;
      }
      if (!bookedSlots.has(slot)) {
        hourBlock.push(slot);
      }
    }

    if (blockedSlots.includes(time)) {
      setBlockedSlots(removeBlockedSlots(date, hourBlock));
      return;
    }

    setBlockedSlots(addBlockedSlots(date, hourBlock));
  }

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent
    >
      <View style={styles.overlay} pointerEvents="box-none">
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable
            style={styles.backdropPressable}
            onPress={onClose}
            accessibilityLabel="Close"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>Block time</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Available times</Text>
            <Text style={styles.metaCount}>{openCount} open</Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {slots.length > 0 ? (
              <View style={styles.timeGrid}>
                {slots.map((slot) => {
                  const booked = bookedSlots.has(slot);
                  const blocked = !booked && blockedSlots.includes(slot);

                  return (
                    <Pressable
                      key={slot}
                      onPress={() => handleToggle(slot)}
                      disabled={booked}
                      android_ripple={booked ? undefined : ANDROID_RIPPLE}
                      accessibilityLabel={
                        booked
                          ? `${slot} booked`
                          : blocked
                            ? `Unblock ${slot}`
                            : `Block ${slot}`
                      }
                      style={({ pressed }) => [
                        styles.timeSlot,
                        booked && styles.timeSlotBooked,
                        blocked && styles.timeSlotBlocked,
                        pressed && !booked && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.timeSlotText,
                          booked && styles.timeSlotTextBooked,
                          blocked && styles.timeSlotTextBlocked,
                        ]}
                      >
                        {booked ? "Booked" : blocked ? "Blocked" : slot}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No open times</Text>
                <Text style={styles.emptyBody}>
                  There are no available slots on this day.
                </Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  backdropPressable: {
    flex: 1,
  },
  sheet: {
    width: "100%",
    maxHeight: "85%",
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    zIndex: 2,
    elevation: 8,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d1d5db",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.error,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  metaLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  metaCount: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textMuted,
  },
  scrollContent: {
    paddingBottom: spacing.md,
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  timeSlot: {
    width: "23.5%",
    minHeight: 32,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.inputBackground,
  },
  timeSlotBooked: {
    backgroundColor: colors.primary,
  },
  timeSlotBlocked: {
    backgroundColor: colors.error,
  },
  timeSlotText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  timeSlotTextBooked: {
    color: colors.white,
  },
  timeSlotTextBlocked: {
    color: colors.white,
  },
  emptyState: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  emptyBody: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.9,
  },
});
