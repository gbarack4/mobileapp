import { useRef } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "../../constants/theme";
import {
  buildCalendarCells,
  formatMonthYear,
  isDateInInclusiveRange,
  isSameDay,
  startOfDay,
  type DateRange,
} from "../../utils/lesson-dates";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const LONG_PRESS_MS = 450;

type MonthCalendarProps = {
  visibleMonth: Date;
  selectedDate?: Date;
  rangeStart?: Date | null;
  rangeEnd?: Date | null;
  lessonCounts: Map<number, number>;
  compact?: boolean;
  blockedRanges?: DateRange[];
  onSelectDate: (date: Date) => void;
  onLongPressDate?: (date: Date) => void;
  /** Fired while a day cell is pressed — use to disable parent ScrollView on native. */
  onDayPressActiveChange?: (active: boolean) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  minSelectableDate?: Date;
};

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 94, 255, 0.08)" } : undefined;

function getBlockedRangeHighlight(date: Date, ranges: DateRange[]) {
  let inBlocked = false;
  let isStart = false;
  let isEnd = false;

  ranges.forEach((range) => {
    if (!isDateInInclusiveRange(date, range.start, range.end)) {
      return;
    }

    inBlocked = true;

    const from = startOfDay(range.start);
    const to = startOfDay(range.end);
    const start = from <= to ? from : to;
    const end = from <= to ? to : from;

    if (isSameDay(date, start)) {
      isStart = true;
    }

    if (isSameDay(date, end)) {
      isEnd = true;
    }
  });

  return { inBlocked, isStart, isEnd };
}

export function MonthCalendar({
  visibleMonth,
  selectedDate,
  rangeStart,
  rangeEnd,
  lessonCounts,
  compact = false,
  blockedRanges = [],
  onSelectDate,
  onLongPressDate,
  onDayPressActiveChange,
  onPreviousMonth,
  onNextMonth,
  minSelectableDate,
}: Readonly<MonthCalendarProps>) {
  const today = new Date();
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const cells = buildCalendarCells(year, month);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);
  const minDate = minSelectableDate
    ? new Date(
        minSelectableDate.getFullYear(),
        minSelectableDate.getMonth(),
        minSelectableDate.getDate(),
      )
    : null;

  function clearLongPressTimer() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function isBeforeMinDate(date: Date) {
    if (!minDate) {
      return false;
    }

    const candidate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    return candidate < minDate;
  }

  return (
    <View style={styles.container}>
      <View style={styles.monthHeader}>
        <Pressable
          onPress={onPreviousMonth}
          android_ripple={ANDROID_RIPPLE}
          style={({ pressed }) => [
            styles.monthNavButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.monthNavIcon}>‹</Text>
        </Pressable>

        <Text style={styles.monthTitle}>{formatMonthYear(visibleMonth)}</Text>

        <Pressable
          onPress={onNextMonth}
          android_ripple={ANDROID_RIPPLE}
          style={({ pressed }) => [
            styles.monthNavButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.monthNavIcon}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((weekday) => (
          <Text key={weekday} style={styles.weekdayLabel}>
            {weekday}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, index) => {
          if (day === null) {
            return (
              <View
                key={`empty-${index}`}
                style={compact ? styles.dayCellCompact : styles.dayCell}
              />
            );
          }

          const cellDate = new Date(year, month, day);
          const blocked = getBlockedRangeHighlight(cellDate, blockedRanges);
          const isRangeStart = Boolean(
            rangeStart && isSameDay(cellDate, rangeStart) && !blocked.inBlocked,
          );
          const isRangeEnd = Boolean(
            rangeEnd && isSameDay(cellDate, rangeEnd) && !blocked.inBlocked,
          );
          const inRange = Boolean(
            rangeStart &&
              rangeEnd &&
              !blocked.inBlocked &&
              isDateInInclusiveRange(cellDate, rangeStart, rangeEnd),
          );
          const selected =
            isRangeStart ||
            isRangeEnd ||
            blocked.isStart ||
            blocked.isEnd ||
            Boolean(
              selectedDate &&
                !rangeStart &&
                !rangeEnd &&
                isSameDay(cellDate, selectedDate),
            );
          const showRangeTrack = inRange && !(isRangeStart && isRangeEnd);
          const showBlockedTrack =
            blocked.inBlocked && !(blocked.isStart && blocked.isEnd);
          const isToday = isSameDay(cellDate, today);
          const disabled = isBeforeMinDate(cellDate);
          const lessonCount = lessonCounts.get(day) ?? 0;

          return (
            <Pressable
              key={`${year}-${month}-${day}`}
              onPress={() => {
                if (disabled || longPressFiredRef.current) {
                  longPressFiredRef.current = false;
                  return;
                }
                onSelectDate(cellDate);
              }}
              onPressIn={() => {
                if (disabled) {
                  return;
                }

                longPressFiredRef.current = false;
                onDayPressActiveChange?.(true);
                clearLongPressTimer();

                if (!onLongPressDate) {
                  return;
                }

                // Custom timer is more reliable than Pressable onLongPress inside ScrollView on native.
                longPressTimerRef.current = setTimeout(() => {
                  longPressTimerRef.current = null;
                  longPressFiredRef.current = true;
                  onLongPressDate(cellDate);
                }, LONG_PRESS_MS);
              }}
              onPressOut={() => {
                clearLongPressTimer();
                onDayPressActiveChange?.(false);
              }}
              disabled={disabled}
              android_ripple={disabled ? undefined : ANDROID_RIPPLE}
              style={compact ? styles.dayCellCompact : styles.dayCell}
            >
              {showBlockedTrack ? (
                <View
                  pointerEvents="none"
                  style={[
                    styles.rangeTrack,
                    styles.rangeTrackBlocked,
                    compact && styles.rangeTrackCompact,
                    blocked.isStart && styles.rangeTrackStart,
                    blocked.isEnd && styles.rangeTrackEnd,
                  ]}
                />
              ) : null}
              {showRangeTrack ? (
                <View
                  pointerEvents="none"
                  style={[
                    styles.rangeTrack,
                    compact && styles.rangeTrackCompact,
                    isRangeStart && styles.rangeTrackStart,
                    isRangeEnd && styles.rangeTrackEnd,
                  ]}
                />
              ) : null}
              <View
                style={[
                  compact ? styles.dayInnerCompact : styles.dayInner,
                  isToday &&
                    !selected &&
                    !inRange &&
                    !blocked.inBlocked &&
                    !disabled &&
                    styles.dayInnerToday,
                  inRange && !selected && styles.dayInnerInRange,
                  blocked.inBlocked &&
                    !blocked.isStart &&
                    !blocked.isEnd &&
                    styles.dayInnerInRangeBlocked,
                  selected && styles.dayInnerSelected,
                  (blocked.isStart || blocked.isEnd) &&
                    styles.dayInnerSelectedBlocked,
                  disabled && styles.dayInnerDisabled,
                ]}
              >
                <Text
                  style={[
                    compact ? styles.dayTextCompact : styles.dayText,
                    inRange && !selected && styles.dayTextInRange,
                    blocked.inBlocked &&
                      !blocked.isStart &&
                      !blocked.isEnd &&
                      styles.dayTextInRangeBlocked,
                    selected && styles.dayTextSelected,
                    disabled && styles.dayTextDisabled,
                  ]}
                >
                  {day}
                </Text>
                {!compact && lessonCount > 0 ? (
                  <View
                    style={[
                      styles.lessonCountBadge,
                      selected && styles.lessonCountBadgeSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.lessonCountText,
                        selected && styles.lessonCountTextSelected,
                      ]}
                    >
                      {lessonCount}
                    </Text>
                  </View>
                ) : !compact ? (
                  <View style={styles.lessonCountPlaceholder} />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  monthNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.inputBackground,
  },
  monthNavIcon: {
    fontSize: 24,
    lineHeight: 28,
    color: colors.text,
    fontWeight: "500",
  },
  weekdayRow: {
    flexDirection: "row",
  },
  weekdayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
  },
  dayCellCompact: {
    width: `${100 / 7}%`,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  rangeTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    height: 6,
    marginTop: -3,
    backgroundColor: colors.primary,
  },
  rangeTrackCompact: {
    height: 4,
    marginTop: -2,
  },
  rangeTrackBlocked: {
    backgroundColor: colors.error,
  },
  rangeTrackStart: {
    left: "50%",
  },
  rangeTrackEnd: {
    right: "50%",
  },
  dayInner: {
    minWidth: 40,
    minHeight: 48,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingHorizontal: 4,
    paddingVertical: 4,
    zIndex: 1,
  },
  dayInnerCompact: {
    minWidth: 32,
    minHeight: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  dayInnerToday: {
    backgroundColor: "#e8f1ff",
  },
  dayInnerInRange: {
    backgroundColor: "#e8f1ff",
  },
  dayInnerInRangeBlocked: {
    backgroundColor: "#fde8e8",
  },
  dayInnerSelected: {
    backgroundColor: colors.primary,
  },
  dayInnerSelectedBlocked: {
    backgroundColor: colors.error,
  },
  dayInnerDisabled: {
    opacity: 0.35,
  },
  dayText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  dayTextCompact: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  dayTextInRange: {
    color: colors.primary,
  },
  dayTextInRangeBlocked: {
    color: colors.error,
  },
  dayTextSelected: {
    color: colors.white,
  },
  dayTextDisabled: {
    color: colors.textMuted,
  },
  lessonCountBadge: {
    minWidth: 20,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 6,
    backgroundColor: colors.inputBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  lessonCountBadgeSelected: {
    backgroundColor: colors.white,
  },
  lessonCountText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
    lineHeight: 12,
  },
  lessonCountTextSelected: {
    color: colors.primary,
  },
  lessonCountPlaceholder: {
    height: 18,
  },
  pressed: {
    opacity: 0.8,
  },
});
