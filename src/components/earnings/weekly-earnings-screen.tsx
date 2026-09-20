import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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

import { colors, spacing } from "../../constants/theme";
import { useInstructorEarnings } from "../../hooks/use-instructor-earnings";
import type {
  InstructorEarningDay,
  InstructorEarningEntry,
  InstructorEarningStatus,
} from "../../types/instructor-earnings";
import { formatCurrency } from "../../utils/earnings";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeNavIcon,
} from "../icons/dashboard-icons";
import { EarningsBySchoolScreen } from "./earnings-by-school-screen";

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 94, 255, 0.08)" } : undefined;

const ENTRY_ROW_HEIGHT = 72;
const EXPAND_MS = 260;

const SCHOOL_AVATAR_COLORS = [
  "#dbeafe",
  "#ede9fe",
  "#dcfce7",
  "#fef3c7",
  "#ffe4e6",
  "#cffafe",
];

type WeeklyEarningsScreenProps = {
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

type DayDropdownProps = Readonly<{
  day: InstructorEarningDay;
  entries: InstructorEarningEntry[];
  expanded: boolean;
  showDivider: boolean;
  onToggle: () => void;
}>;

function parseDateKey(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

function formatDayLabel(date: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    timeZone: "UTC",
  }).format(parseDateKey(date));
}

function formatDateLabel(date: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(parseDateKey(date));
}

function formatWeekDate(date: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(parseDateKey(date));
}

function getWeekDates(weekOffset: number) {
  const now = new Date();
  const currentDay = now.getUTCDay();
  const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;

  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  monday.setUTCDate(monday.getUTCDate() - daysSinceMonday + weekOffset * 7);

  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);

  return {
    startDate: monday.toISOString().slice(0, 10),
    endDate: sunday.toISOString().slice(0, 10),
  };
}

function formatWeekLabel(startDate: string, endDate: string): string {
  return `${formatWeekDate(startDate)} – ${formatWeekDate(endDate)}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = minutes / 60;

  if (Number.isInteger(hours)) {
    return `${hours} ${hours === 1 ? "hr" : "hrs"}`;
  }

  return `${Number(hours.toFixed(2))} hrs`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  if (parts.length === 0) {
    return "DS";
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

function getSchoolAvatarColor(schoolId: string): string {
  let hash = 0;

  for (const character of schoolId) {
    hash = (hash * 31 + character.charCodeAt(0)) | 0;
  }

  return SCHOOL_AVATAR_COLORS[Math.abs(hash) % SCHOOL_AVATAR_COLORS.length];
}

function getStatusLabel(status: InstructorEarningStatus): string {
  switch (status) {
    case "available":
      return "Available";
    case "processing":
      return "Processing";
    case "paid":
      return "Paid";
    case "failed":
      return "Failed";
    case "reversed":
      return "Reversed";
  }
}

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

  const dayLabel = formatDayLabel(day.date);
  const dateLabel = formatDateLabel(day.date);

  return (
    <View>
      <Pressable
        onPress={onToggle}
        android_ripple={ANDROID_RIPPLE}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${dayLabel} ${dateLabel}, ${formatCurrency(
          day.amountCents,
        )}, ${day.lessonCount} ${day.lessonCount === 1 ? "lesson" : "lessons"}`}
        style={({ pressed }) => [
          styles.breakdownRow,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.breakdownDay}>
          <Text style={styles.breakdownDayLabel}>{dayLabel}</Text>

          <Text style={styles.breakdownDate}>{dateLabel}</Text>
        </View>

        <View style={styles.breakdownAmountWrap}>
          <Text style={styles.breakdownAmount}>
            {formatCurrency(day.amountCents)}
          </Text>

          <Text style={styles.breakdownLessons}>
            {day.lessonCount} {day.lessonCount === 1 ? "lesson" : "lessons"}
          </Text>
        </View>

        <Animated.View
          style={{
            transform: [{ rotate: chevronRotate }],
          }}
        >
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
                  <Text style={styles.entryName} numberOfLines={1}>
                    {entry.studentName}
                  </Text>

                  <Text style={styles.entryMeta}>
                    {formatDuration(entry.durationMinutes)}
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
                    entry.status === "paid" && styles.entryStatusPaid,
                    entry.status === "available" && styles.entryStatusAvailable,
                    entry.status === "processing" &&
                      styles.entryStatusProcessing,
                    entry.status === "failed" && styles.entryStatusFailed,
                    entry.status === "reversed" && styles.entryStatusReversed,
                  ]}
                >
                  {getStatusLabel(entry.status)}
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

  const {
    data: earnings,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useInstructorEarnings(weekOffset);

  const fallbackWeek = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const weekStartDate =
    earnings?.schools[0]?.weekStartDate ?? fallbackWeek.startDate;

  const weekEndDate = earnings?.schools[0]?.weekEndDate ?? fallbackWeek.endDate;

  const weekLabel = formatWeekLabel(weekStartDate, weekEndDate);

  const schoolEarnings = useMemo(
    () => ({
      weekLabel,
      totalCents: earnings?.totalCents ?? 0,
      schools: (earnings?.schools ?? []).map((school) => ({
        schoolId: school.schoolId,
        name: school.name,
        initials: getInitials(school.name),
        avatarColor: getSchoolAvatarColor(school.schoolId),
        lessonCount: school.lessonCount,
        amountCents: school.amountCents,
      })),
    }),
    [earnings, weekLabel],
  );

  useEffect(() => {
    setExpandedDayKey(null);
  }, [weekOffset]);

  const activeSchoolCount = earnings?.activeSchoolCount ?? 0;

  const errorMessage =
    error instanceof Error ? error.message : "Unable to load earnings.";

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
            <Text style={styles.weekLabel}>{weekLabel}</Text>

            <View style={styles.weekMetaRow}>
              {weekOffset === 0 ? (
                <Text style={styles.weekBadge}>This week</Text>
              ) : null}

              {isFetching && !isLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : null}
            </View>
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
        {isLoading && !earnings ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="small" color={colors.primary} />

            <Text style={styles.stateText}>Loading earnings...</Text>
          </View>
        ) : null}

        {isError && !earnings ? (
          <View style={styles.stateCard}>
            <Text style={styles.errorTitle}>Unable to load earnings</Text>

            <Text style={styles.stateText}>{errorMessage}</Text>

            <Pressable
              onPress={() => void refetch()}
              android_ripple={ANDROID_RIPPLE}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {earnings ? (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Weekly total</Text>

              <Text style={styles.summaryAmount}>
                {formatCurrency(earnings.totalCents)}
              </Text>

              <View style={styles.summaryMeta}>
                <Text style={styles.summaryMetaText}>
                  {earnings.lessonCount}{" "}
                  {earnings.lessonCount === 1 ? "lesson" : "lessons"} ·{" "}
                  {formatDuration(earnings.durationMinutes)} ·{" "}
                  {formatCurrency(earnings.averagePerLessonCents)} avg / lesson
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
                    {activeSchoolCount}
                  </Text>

                  <Text style={styles.activeSchoolsLabel}>Active schools</Text>
                </View>

                <Text style={styles.activeSchoolsHint}>
                  Actively working for {activeSchoolCount}{" "}
                  {activeSchoolCount === 1 ? "school" : "schools"}
                </Text>
              </View>

              <Pressable
                onPress={() => setSchoolEarningsVisible(true)}
                disabled={activeSchoolCount === 0}
                android_ripple={
                  activeSchoolCount > 0 ? ANDROID_RIPPLE : undefined
                }
                style={({ pressed }) => [
                  styles.viewButton,
                  activeSchoolCount === 0 && styles.viewButtonDisabled,
                  pressed && activeSchoolCount > 0 && styles.pressed,
                ]}
              >
                <Text style={styles.viewButtonText}>View</Text>
              </Pressable>
            </View>

            <Text style={styles.sectionLabel}>Daily breakdown</Text>

            <View style={styles.breakdownCard}>
              {earnings.days.length > 0 ? (
                earnings.days.map((day, index) => {
                  const key = day.date;

                  return (
                    <DayDropdown
                      key={key}
                      day={day}
                      entries={day.entries}
                      expanded={expandedDayKey === key}
                      showDivider={index < earnings.days.length - 1}
                      onToggle={() =>
                        setExpandedDayKey((current) =>
                          current === key ? null : key,
                        )
                      }
                    />
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No completed lessons</Text>

                  <Text style={styles.emptyText}>
                    There are no completed lesson earnings for this week.
                  </Text>
                </View>
              )}
            </View>
          </>
        ) : null}
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

  weekMetaRow: {
    minHeight: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
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

  stateCard: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },

  stateText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },

  errorTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },

  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: "#e8f1ff",
  },

  retryButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
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

  viewButtonDisabled: {
    opacity: 0.45,
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
    color: colors.textMuted,
  },

  entryStatusPaid: {
    color: "#16a34a",
  },

  entryStatusAvailable: {
    color: "#d97706",
  },

  entryStatusProcessing: {
    color: colors.primary,
  },

  entryStatusFailed: {
    color: "#dc2626",
  },

  entryStatusReversed: {
    color: "#64748b",
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },

  emptyText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
  },

  pressed: {
    opacity: 0.85,
  },
});
