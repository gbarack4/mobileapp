import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "../../constants/theme";
import {
  buildCalendarCells,
  formatMonthYear,
  isSameDay,
} from "../../utils/lesson-dates";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type MonthCalendarProps = {
  visibleMonth: Date;
  selectedDate: Date;
  lessonCounts: Map<number, number>;
  onSelectDate: (date: Date) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  minSelectableDate?: Date;
};

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 94, 255, 0.08)" } : undefined;

export function MonthCalendar({
  visibleMonth,
  selectedDate,
  lessonCounts,
  onSelectDate,
  onPreviousMonth,
  onNextMonth,
  minSelectableDate,
}: Readonly<MonthCalendarProps>) {
  const today = new Date();
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const cells = buildCalendarCells(year, month);
  const minDate = minSelectableDate
    ? new Date(
        minSelectableDate.getFullYear(),
        minSelectableDate.getMonth(),
        minSelectableDate.getDate(),
      )
    : null;

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
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }

          const cellDate = new Date(year, month, day);
          const selected = isSameDay(cellDate, selectedDate);
          const isToday = isSameDay(cellDate, today);
          const disabled = isBeforeMinDate(cellDate);
          const lessonCount = lessonCounts.get(day) ?? 0;

          return (
            <Pressable
              key={`${year}-${month}-${day}`}
              onPress={() => {
                if (!disabled) {
                  onSelectDate(cellDate);
                }
              }}
              disabled={disabled}
              android_ripple={disabled ? undefined : ANDROID_RIPPLE}
              style={styles.dayCell}
            >
              <View
                style={[
                  styles.dayInner,
                  isToday && !selected && !disabled && styles.dayInnerToday,
                  selected && styles.dayInnerSelected,
                  disabled && styles.dayInnerDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    selected && styles.dayTextSelected,
                    disabled && styles.dayTextDisabled,
                  ]}
                >
                  {day}
                </Text>
                {lessonCount > 0 ? (
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
                ) : (
                  <View style={styles.lessonCountPlaceholder} />
                )}
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
    padding: 2,
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
  },
  dayInnerToday: {
    backgroundColor: "#e8f1ff",
  },
  dayInnerSelected: {
    backgroundColor: colors.primary,
  },
  dayInnerDisabled: {
    opacity: 0.35,
  },
  dayText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
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
