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

import { ConfirmedPopup } from "../confirmed-popup";
import { CarIcon } from "../icons/dashboard-icons";
import { InfoIcon, SheetCloseIcon } from "../icons/cancel-lesson-icons";
import { MonthCalendar } from "./month-calendar";
import { colors, spacing } from "../../constants/theme";
import type { Lesson } from "../../types/dashboard";
import {
  formatSelectedDayLabel,
  lessonToDate,
  shiftMonth,
} from "../../utils/lesson-dates";

export type RescheduleSelection = {
  date: Date;
  time: string;
};

type RescheduleLessonSheetProps = {
  visible: boolean;
  lesson: Lesson;
  onClose: () => void;
  onConfirmedClose?: () => void;
  onConfirm: (selection: RescheduleSelection) => void | Promise<void>;
};

const TIME_SLOTS = [
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
];

const SHEET_SLIDE_DISTANCE = 720;
const FADE_DURATION = 220;
const SLIDE_DURATION = 320;
const RESCHEDULING_MS = 2000;

type SheetPhase = "form" | "submitting" | "confirmed";

type PressableState = {
  pressed: boolean;
};

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 94, 255, 0.08)" } : undefined;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatLessonSummary(lesson: Lesson) {
  return `${lesson.dayOfWeek} ${lesson.day} ${lesson.month} · ${lesson.time} · ${lesson.studentName}`;
}

function getDefaultDate(lesson: Lesson) {
  const lessonDate = startOfDay(lessonToDate(lesson));
  const today = startOfDay(new Date());
  return lessonDate >= today ? lessonDate : today;
}

function getUnavailableSlots(date: Date): Set<string> {
  const seed = date.getDate() + date.getMonth() * 3;
  return new Set(TIME_SLOTS.filter((_, index) => (seed + index) % 4 === 0));
}

export function RescheduleLessonSheet({
  visible,
  lesson,
  onClose,
  onConfirmedClose,
  onConfirm,
}: Readonly<RescheduleLessonSheetProps>) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    getDefaultDate(lesson),
  );
  const [selectedDate, setSelectedDate] = useState(() =>
    getDefaultDate(lesson),
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [phase, setPhase] = useState<SheetPhase>("form");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SHEET_SLIDE_DISTANCE)).current;

  const today = useMemo(() => startOfDay(new Date()), []);
  const unavailableSlots = useMemo(
    () => getUnavailableSlots(selectedDate),
    [selectedDate],
  );
  const canConfirm = selectedTime !== null && phase === "form";

  useEffect(() => {
    if (visible) {
      const defaultDate = getDefaultDate(lesson);
      setMounted(true);
      setVisibleMonth(
        new Date(defaultDate.getFullYear(), defaultDate.getMonth(), 1),
      );
      setSelectedDate(defaultDate);
      setSelectedTime(null);
      setPhase("form");
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
  }, [fadeAnim, lesson, mounted, slideAnim, visible]);

  if (!mounted) {
    return null;
  }

  function handleSelectDate(date: Date) {
    if (phase !== "form") {
      return;
    }

    setSelectedDate(date);
    setSelectedTime(null);
  }

  async function handleConfirmPress() {
    if (!selectedTime || phase !== "form") {
      return;
    }

    setPhase("submitting");
    const startedAt = Date.now();
    const selection = { date: selectedDate, time: selectedTime };

    try {
      await Promise.resolve(onConfirm(selection));

      const remaining = RESCHEDULING_MS - (Date.now() - startedAt);
      if (remaining > 0) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, remaining);
        });
      }

      setPhase("confirmed");
    } catch {
      setPhase("form");
    }
  }

  function handleConfirmedClose() {
    (onConfirmedClose ?? onClose)();
  }

  function handleClose() {
    if (phase === "submitting") {
      return;
    }

    onClose();
  }

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable
            style={styles.backdropPressable}
            onPress={handleClose}
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

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Reschedule lesson</Text>
            <Pressable
              onPress={handleClose}
              disabled={phase === "submitting"}
              hitSlop={12}
              android_ripple={ANDROID_RIPPLE}
              accessibilityLabel="Close"
              style={({ pressed }: PressableState) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <SheetCloseIcon />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            scrollEnabled={phase === "form"}
          >
            <View style={styles.lessonCard}>
              <View style={styles.lessonIconWrap}>
                <CarIcon size={18} color={colors.primary} />
              </View>
              <View style={styles.lessonText}>
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                <Text style={styles.lessonMeta}>
                  {formatLessonSummary(lesson)}
                </Text>
              </View>
            </View>

            <View style={styles.infoBanner}>
              <InfoIcon />
              <Text style={styles.infoText}>
                Your student will be notified once you confirm the new date and
                time.
              </Text>
            </View>

            <Text style={styles.sectionLabel}>Select new date</Text>
            <MonthCalendar
              visibleMonth={visibleMonth}
              selectedDate={selectedDate}
              lessonCounts={new Map()}
              minSelectableDate={today}
              onSelectDate={handleSelectDate}
              onPreviousMonth={() => {
                if (phase === "form") {
                  setVisibleMonth((current) => shiftMonth(current, -1));
                }
              }}
              onNextMonth={() => {
                if (phase === "form") {
                  setVisibleMonth((current) => shiftMonth(current, 1));
                }
              }}
            />

            <Text style={styles.sectionLabel}>
              Available times · {formatSelectedDayLabel(selectedDate)}
            </Text>
            <View style={styles.timeGrid}>
              {TIME_SLOTS.map((slot) => {
                const unavailable = unavailableSlots.has(slot);
                const selected = selectedTime === slot;

                return (
                  <Pressable
                    key={slot}
                    onPress={() => {
                      if (!unavailable && phase === "form") {
                        setSelectedTime(slot);
                      }
                    }}
                    disabled={unavailable || phase !== "form"}
                    android_ripple={unavailable ? undefined : ANDROID_RIPPLE}
                    style={[
                      styles.timeSlot,
                      unavailable && styles.timeSlotUnavailable,
                      selected && styles.timeSlotSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.timeSlotText,
                        unavailable && styles.timeSlotTextUnavailable,
                        selected && styles.timeSlotTextSelected,
                      ]}
                    >
                      {slot}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <Pressable
            onPress={handleConfirmPress}
            disabled={!selectedTime || phase !== "form"}
            android_ripple={canConfirm ? ANDROID_RIPPLE : undefined}
            style={({ pressed }: PressableState) => [
              styles.confirmButton,
              selectedTime
                ? styles.confirmButtonActive
                : styles.confirmButtonDisabled,
              canConfirm && pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.confirmButtonText,
                !selectedTime && styles.confirmButtonTextDisabled,
              ]}
            >
              {phase === "submitting"
                ? "Rescheduling......"
                : "Confirm reschedule"}
            </Text>
          </Pressable>
        </Animated.View>

        {phase === "confirmed" && selectedTime ? (
          <ConfirmedPopup
            title="Reschedule confirmed"
            message={`Your lesson is now scheduled for ${formatSelectedDayLabel(selectedDate)} at ${selectedTime}.`}
            onClose={handleConfirmedClose}
          />
        ) : null}
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
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  backdropPressable: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    maxHeight: "92%",
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#d1d5db",
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.2,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    gap: spacing.lg,
    paddingBottom: spacing.lg,
  },
  lessonCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    padding: spacing.lg,
  },
  lessonIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e8f1ff",
    alignItems: "center",
    justifyContent: "center",
  },
  lessonText: {
    flex: 1,
    gap: 4,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  lessonMeta: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    backgroundColor: "#eff6ff",
    borderRadius: 14,
    padding: spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#1d4ed8",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  timeSlot: {
    width: "31%",
    minWidth: 96,
    flexGrow: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    backgroundColor: colors.white,
  },
  timeSlotUnavailable: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBackground,
  },
  timeSlotSelected: {
    borderColor: colors.primary,
    backgroundColor: "#e8f1ff",
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  timeSlotTextUnavailable: {
    color: colors.textMuted,
  },
  timeSlotTextSelected: {
    color: colors.primary,
  },
  confirmButton: {
    borderRadius: 14,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.inputBackground,
  },
  confirmButtonActive: {
    backgroundColor: colors.primary,
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "700",
  },
  confirmButtonTextDisabled: {
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.85,
  },
});
