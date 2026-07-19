import { useMemo, useState } from "react";
import {
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
import { formatCurrency, formatHours } from "../../utils/earnings";
import { EarningsBySchoolScreen } from "./earnings-by-school-screen";
import {
  CarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeNavIcon,
} from "../icons/dashboard-icons";

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 94, 255, 0.08)" } : undefined;

type WeeklyEarningsScreenProps = {
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

export function WeeklyEarningsScreen({
  onScroll,
}: Readonly<WeeklyEarningsScreenProps>) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [schoolEarningsVisible, setSchoolEarningsVisible] = useState(false);
  const earnings = useMemo(() => getWeeklyEarnings(weekOffset), [weekOffset]);
  const schoolEarnings = useMemo(
    () => getSchoolWeeklyEarnings(weekOffset),
    [weekOffset],
  );
  const avgPerLessonCents = Math.round(
    earnings.totalCents / Math.max(earnings.lessonCount, 1),
  );

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
            const isLastDay = index === earnings.days.length - 1;

            return (
              <View
                key={day.dayLabel}
                style={[
                  styles.breakdownRow,
                  !isLastDay && styles.breakdownRowDivider,
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
                    {day.lessonCount}{" "}
                    {day.lessonCount === 1 ? "lesson" : "lessons"}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>This week&apos;s lessons</Text>
        <View style={styles.entriesList}>
          {earnings.entries.map((entry) => (
            <View key={entry.id} style={styles.entryCard}>
              <View style={styles.entryLeft}>
                <View style={styles.entryAvatar}>
                  <Text style={styles.entryAvatarText}>
                    {entry.studentInitials}
                  </Text>
                </View>
                <View style={styles.entryText}>
                  <Text style={styles.entryName}>{entry.studentName}</Text>
                  <View style={styles.entryMetaRow}>
                    <CarIcon size={14} color={colors.textMuted} />
                    <Text style={styles.entryMeta}>
                      {entry.dateLabel} · {entry.time}
                    </Text>
                  </View>
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
    padding: spacing.lg,
    gap: 0,
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
    width: 52,
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
    width: 78,
    alignItems: "flex-end",
    gap: 1,
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
  entriesList: {
    gap: spacing.sm,
  },
  entryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9f9f9",
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.md,
  },
  entryLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  entryAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e8f1ff",
    alignItems: "center",
    justifyContent: "center",
  },
  entryAvatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  entryText: {
    flex: 1,
    gap: 4,
  },
  entryName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  entryMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
    fontSize: 15,
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
