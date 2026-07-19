import {
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
import type { SchoolWeeklyEarningsSummary } from "../../types/earnings";
import { formatCurrency } from "../../utils/earnings";
import { ChevronLeftIcon } from "../icons/dashboard-icons";

type EarningsBySchoolScreenProps = {
  visible: boolean;
  summary: SchoolWeeklyEarningsSummary;
  onClose: () => void;
};

type PressableState = {
  pressed: boolean;
};

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 94, 255, 0.08)" } : undefined;

export function EarningsBySchoolScreen({
  visible,
  summary,
  onClose,
}: Readonly<EarningsBySchoolScreenProps>) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View
        style={[
          styles.screen,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            android_ripple={ANDROID_RIPPLE}
            accessibilityLabel="Back"
            style={({ pressed }: PressableState) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <ChevronLeftIcon color={colors.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Earnings by school</Text>
            <Text style={styles.headerSubtitle}>{summary.weekLabel}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Weekly total</Text>
            <Text style={styles.totalAmount}>
              {formatCurrency(summary.totalCents)}
            </Text>
            <Text style={styles.totalMeta}>
              Across {summary.schools.length} active schools
            </Text>
          </View>

          <Text style={styles.sectionLabel}>School breakdown</Text>

          <View style={styles.schoolList}>
            {summary.schools.map((school) => {
              const sharePercent = Math.round(
                (school.amountCents / summary.totalCents) * 100,
              );

              return (
                <View key={school.schoolId} style={styles.schoolCard}>
                  <View style={styles.schoolTopRow}>
                    <View
                      style={[
                        styles.schoolAvatar,
                        { backgroundColor: `${school.avatarColor}22` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.schoolAvatarText,
                          { color: school.avatarColor },
                        ]}
                      >
                        {school.initials}
                      </Text>
                    </View>

                    <View style={styles.schoolInfo}>
                      <Text style={styles.schoolName}>{school.name}</Text>
                      <Text style={styles.schoolMeta}>
                        {school.lessonCount}{" "}
                        {school.lessonCount === 1 ? "lesson" : "lessons"} ·{" "}
                        {sharePercent}% of weekly earnings
                      </Text>
                    </View>

                    <Text style={styles.schoolAmount}>
                      {formatCurrency(school.amountCents)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.inputBackground,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  totalCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.82)",
    letterSpacing: 0.2,
    textTransform: "none",
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: -0.8,
  },
  totalMeta: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.88)",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  schoolList: {
    gap: spacing.sm,
  },
  schoolCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.sm,
  },
  schoolTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  schoolAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  schoolAvatarText: {
    fontSize: 14,
    fontWeight: "700",
  },
  schoolInfo: {
    flex: 1,
    gap: 3,
  },
  schoolName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  schoolMeta: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  schoolAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  pressed: {
    opacity: 0.85,
  },
});
