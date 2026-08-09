import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

import {
  getSchoolWeeklyEarnings,
  getWeeklyEarnings,
} from "../../data/mock-earnings";
import { ACTIVE_SCHOOL_COUNT } from "../../data/mock-active-schools";
import { colors, spacing } from "../../constants/theme";
import type { WeeklyEarningDay, WeeklyEarningEntry } from "../../types/earnings";
import { formatCurrency, formatHours } from "../../utils/earnings";
import { EarningsBySchoolScreen } from "./earnings-by-school-screen";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeNavIcon,
} from "../icons/dashboard-icons";

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 94, 255, 0.08)" } : undefined;

const ENTRY_ROW_HEIGHT = 72;
const EXPAND_MS = 260;

type WeeklyEarningsScreenProps = {
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

type DayDropdownProps = Readonly<{
  day: WeeklyEarningDay;
  entries: WeeklyEarningEntry[];
  expanded: boolean;
  showDivider: boolean;
  onToggle: () => void;
}>;

function DayDropdown({
  day,
  entries,
  expanded,
  showDivider,
  onToggle,
}: DayDropdownProps) {
  const progress = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const contentHeight = Math.max(entries.length, 1) * ENTRY_ROW_HEIGHT;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: expanded ? 1 : 0,
      duration: EXPAND_MS,
      easing: expanded ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [expanded, progress]);

  const panelHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, contentHeight],
  });

  const panelOpacity = progress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0.45, 1],
  });

  const chevronRotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  return (
    <View>
      <Pressable
        onPress={onToggle}
        android_ripple={ANDROID_RIPPLE}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${day.dayLabel} ${day.dateLabel}, ${formatCurrency(day.amountCents)}, ${day.lessonCount} lessons`}
        style={({ pressed }) => [
          styles.breakdownRow,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.breakdownDay}>
          <Text style={styles.breakdownDayLabel}>{day.dayLabel}</Text>
          <Text style={styles.breakdownDate}>{day.dateLabel}</Text>
        </View>

        <View style={styles.breakdownAmountWrap}>
          <Text style={styles.breakdownAmount}>
            {formatCurrency(day.amountCents)}
          </Text>
          <Text style={styles.breakdownLessons}>
            {day.lessonCount} {day.lessonCount === 1 ? "lesson" : "lessons"}
          </Text>
        </View>

        <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
          <ChevronRightIcon size={16} color={colors.textMuted} />
        </Animated.View>
      </Pressable>

      <Animated.View
        pointerEvents={expanded ? "auto" : "none"}
        style={[
          styles.dayPanel,
          {
            height: panelHeight,
            opacity: panelOpacity,
          },
        ]}
      >
        <View style={styles.dayEntries}>
          {entries.map((entry) => (
            <View key={entry.id} style={styles.entryCard}>
              <View style={styles.entryLeft}>
                <View style={styles.entryAvatar}>
                  <Text style={styles.entryAvatarText}>
                    {entry.studentInitials}
                  </Text>
                </View>
                <View style={styles.entryText}>
                  <Text style={styles.entryName}>{entry.studentName}</Text>
                  <Text style={styles.entryMeta}>
                    {formatHours(entry.hours)}
                  </Text>
                </View>
              </View>

              <View style={styles.entryRight}>
                <Text style={styles.entryAmount}>
                  {formatCurrency(entry.amountCents)}
                </Text>
                <Text
                  style={[
                    styles.entryStatus,
                    entry.status === "pending" && styles.entryStatusPending,
                  ]}
                >
                  {entry.status === "paid" ? "Paid" : "Pending"}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Animated.View>

      {showDivider ? <View style={styles.breakdownRowDivider} /> : null}
    </View>
  );
}

export function WeeklyEarningsScreen({
  onScroll,
}: Readonly<WeeklyEarningsScreenProps>) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [schoolEarningsVisible, setSchoolEarningsVisible] = useState(false);
  const [expandedDayKey, setExpandedDayKey] = useState<string | null>(null);
  const earnings = useMemo(() => getWeeklyEarnings(weekOffset), [weekOffset]);
  const schoolEarnings = useMemo(
    () => getSchoolWeeklyEarnings(weekOffset),
    [weekOffset],
  );
  const avgPerLessonCents = Math.round(
    earnings.totalCents / Math.max(earnings.lessonCount, 1),
  );

  const entriesByDay = useMemo(() => {
    const map = new Map<string, WeeklyEarningEntry[]>();
    for (const day of earnings.days) {
      const key = `${day.dayLabel} ${day.dateLabel}`;
      map.set(
        key,
        earnings.entries.filter((entry) => entry.dateLabel === key),
      );
    }
    return map;
  }, [earnings]);

  useEffect(() => {
    setExpandedDayKey(null);
  }, [weekOffset]);

  return (
    <View style={styles.screen}>
      <EarningsBySchoolScreen
        visible={schoolEarningsVisible}
        summary={schoolEarnings}
        onClose={() => setSchoolEarningsVisible(false)}
      />

      <View style={styles.header}>
        <Text style={styles.pageTitle}>Earnings</Text>

        <View style={styles.weekPicker}>
          <Pressable
            onPress={() => setWeekOffset((current) => current - 1)}
            hitSlop={10}
            android_ripple={ANDROID_RIPPLE}
            accessibilityLabel="Previous week"
            style={({ pressed }) => [
              styles.weekArrow,
              pressed && styles.pressed,
            ]}
          >
            <ChevronLeftIcon color={colors.text} />
          </Pressable>

          <View style={styles.weekLabelWrap}>
            <Text style={styles.weekLabel}>{earnings.weekLabel}</Text>
            {weekOffset === 0 ? (
              <Text style={styles.weekBadge}>This week</Text>
            ) : null}
          </View>

          <Pressable
            onPress={() => setWeekOffset((current) => Math.min(current + 1, 0))}
            disabled={weekOffset >= 0}
            hitSlop={10}
            android_ripple={weekOffset < 0 ? ANDROID_RIPPLE : undefined}
            accessibilityLabel="Next week"
            style={({ pressed }) => [
              styles.weekArrow,
              weekOffset >= 0 && styles.weekArrowDisabled,
              pressed && weekOffset < 0 && styles.pressed,
            ]}
          >
            <ChevronRightIcon
              color={weekOffset >= 0 ? colors.textMuted : colors.text}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={8}
      >
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Weekly total</Text>
          <Text style={styles.summaryAmount}>
            {formatCurrency(earnings.totalCents)}
          </Text>
          <View style={styles.summaryMeta}>
            <Text style={styles.summaryMetaText}>
              {earnings.lessonCount} lessons ·{" "}
              {formatHours(earnings.hoursTaught)} ·{" "}
              {formatCurrency(avgPerLessonCents)} avg / lesson
            </Text>
          </View>
        </View>

        <View style={styles.activeSchoolsCard}>
          <View style={styles.activeSchoolsIconWrap}>
            <HomeNavIcon size={20} color={colors.primary} />
          </View>
          <View style={styles.activeSchoolsText}>
            <View style={styles.activeSchoolsTitleRow}>
              <Text style={styles.activeSchoolsValue}>
                {ACTIVE_SCHOOL_COUNT}
              </Text>
              <Text style={styles.activeSchoolsLabel}>Active schools</Text>
            </View>
            <Text style={styles.activeSchoolsHint}>
              Actively working for {ACTIVE_SCHOOL_COUNT}{" "}
              {ACTIVE_SCHOOL_COUNT === 1 ? "school" : "schools"}
            </Text>
          </View>
          <Pressable
            onPress={() => setSchoolEarningsVisible(true)}
            android_ripple={ANDROID_RIPPLE}
            style={({ pressed }) => [
              styles.viewButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.viewButtonText}>View</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Daily breakdown</Text>
        <View style={styles.breakdownCard}>
          {earnings.days.map((day, index) => {
            const dayKey = `${day.dayLabel} ${day.dateLabel}`;
            const isLastDay = index === earnings.days.length - 1;

            return (
              <DayDropdown
                key={dayKey}
                day={day}
                entries={entriesByDay.get(dayKey) ?? []}
                expanded={expandedDayKey === dayKey}
                showDivider={!isLastDay}
                onToggle={() =>
                  setExpandedDayKey((current) =>
                    current === dayKey ? null : dayKey,
                  )
                }
              />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.4,
  },
  weekPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  weekArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.inputBackground,
  },
  weekArrowDisabled: {
    opacity: 0.45,
  },
  weekLabelWrap: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  weekLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
  },
  weekBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 96,
    gap: spacing.lg,
  },
  summaryCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.82)",
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: -0.8,
  },
  summaryMeta: {
    gap: 6,
  },
  summaryMetaText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.88)",
  },
  activeSchoolsCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: "#f9f9f9",
    borderRadius: 14,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  activeSchoolsIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e8f1ff",
    alignItems: "center",
    justifyContent: "center",
  },
  activeSchoolsText: {
    flex: 1,
    gap: 2,
  },
  activeSchoolsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  activeSchoolsValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  activeSchoolsLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  activeSchoolsHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  viewButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: "#e8f1ff",
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  breakdownCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  breakdownRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e8edf3",
  },
  breakdownDay: {
    flex: 1,
    gap: 1,
  },
  breakdownDayLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  breakdownDate: {
    fontSize: 11,
    color: colors.textMuted,
  },
  breakdownAmountWrap: {
    alignItems: "flex-end",
    gap: 1,
    marginRight: spacing.xs,
  },
  breakdownAmount: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  breakdownLessons: {
    fontSize: 10,
    color: colors.textMuted,
  },
  dayPanel: {
    overflow: "hidden",
  },
  dayEntries: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  entryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.md,
    height: ENTRY_ROW_HEIGHT - spacing.sm,
  },
  entryLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  entryAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e8f1ff",
    alignItems: "center",
    justifyContent: "center",
  },
  entryAvatarText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  entryText: {
    flex: 1,
    gap: 3,
  },
  entryName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  entryMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  entryRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  entryAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  entryStatus: {
    fontSize: 11,
    fontWeight: "600",
    color: "#16a34a",
  },
  entryStatusPending: {
    color: "#d97706",
  },
  pressed: {
    opacity: 0.85,
  },
});
