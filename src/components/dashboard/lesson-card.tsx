import { router } from "expo-router";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../../constants/theme";
import type { Lesson } from "../../types/dashboard";
import { cancelLesson } from "../../services/lessons";
import { formatLessonMeta } from "../../utils/lessons";
import {
  CancelLessonSheet,
  type CancellationReason,
} from "./cancel-lesson-sheet";
import {
  CarIcon,
  MapPinIcon,
  MoreVerticalIcon,
} from "../icons/dashboard-icons";

type LessonCardProps = {
  lesson: Lesson;
};

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 0, 0, 0.04)" } : undefined;

function statusLabel(status: Lesson["status"]) {
  switch (status) {
    case "upcoming":
      return "Upcoming";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

function statusBadgeStyle(status: Lesson["status"]) {
  switch (status) {
    case "completed":
      return styles.statusBadgeCompleted;
    case "cancelled":
      return styles.statusBadgeCancelled;
    default:
      return null;
  }
}

function statusTextStyle(status: Lesson["status"]) {
  switch (status) {
    case "completed":
      return styles.statusTextCompleted;
    case "cancelled":
      return styles.statusTextCancelled;
    default:
      return null;
  }
}

export function LessonCard({ lesson }: Readonly<LessonCardProps>) {
  const [cancelSheetVisible, setCancelSheetVisible] = useState(false);

  function handleMenuPress() {
    if (lesson.status !== "upcoming") {
      return;
    }

    setCancelSheetVisible(true);
  }

  async function handleConfirmCancellation(reason: CancellationReason) {
    await cancelLesson(lesson.id, reason);
  }

  return (
    <>
      <Pressable
        onPress={() => router.push(`/dashboard/lesson/${lesson.id}`)}
        android_ripple={ANDROID_RIPPLE}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <View style={styles.dateColumn}>
          <Text style={styles.dayOfWeek}>{lesson.dayOfWeek}</Text>
          <Text style={styles.day}>{lesson.day}</Text>
          <Text style={styles.month}>{lesson.month}</Text>
          <View style={styles.dateDivider} />
          <Text style={styles.time}>{lesson.time}</Text>
        </View>

        <View style={styles.contentColumn}>
          <View style={styles.titleRow}>
            <View style={styles.titleLeft}>
              <View style={styles.iconCircle}>
                <CarIcon size={16} />
              </View>
              <View style={styles.titleTextColumn}>
                <Text
                  style={styles.title}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {lesson.title}
                </Text>
                <Text style={styles.meta}>{formatLessonMeta(lesson)}</Text>
              </View>
            </View>

            <View style={styles.titleRight}>
              <View
                style={[styles.statusBadge, statusBadgeStyle(lesson.status)]}
              >
                <Text
                  style={[styles.statusText, statusTextStyle(lesson.status)]}
                >
                  {statusLabel(lesson.status)}
                </Text>
              </View>
              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  handleMenuPress();
                }}
                android_ripple={ANDROID_RIPPLE}
                hitSlop={8}
              >
                <MoreVerticalIcon />
              </Pressable>
            </View>
          </View>

          <View style={styles.locationRow}>
            <MapPinIcon />
            <View style={styles.locationText}>
              <Text
                style={styles.locationAddress}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {lesson.locationAddress}
              </Text>
            </View>
          </View>

          <View style={styles.studentRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{lesson.studentInitials}</Text>
            </View>
            <View style={styles.studentText}>
              <Text style={styles.studentLabel}>Student</Text>
              <Text
                style={styles.studentName}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {lesson.studentName}
              </Text>
              <Text
                style={styles.studentEmail}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {lesson.studentEmail}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>

      <CancelLessonSheet
        visible={cancelSheetVisible}
        lesson={lesson}
        onClose={() => setCancelSheetVisible(false)}
        onConfirm={handleConfirmCancellation}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    overflow: "hidden",
  },
  cardPressed: {
    opacity: 0.92,
  },
  dateColumn: {
    width: 78,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#e8edf3",
  },
  dayOfWeek: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  day: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "700",
    color: colors.text,
  },
  month: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  dateDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "#e8edf3",
    marginBottom: 10,
  },
  time: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
    textAlign: "center",
  },
  contentColumn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  titleLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  titleTextColumn: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  titleRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  statusBadge: {
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  statusBadgeCompleted: {
    backgroundColor: colors.white,
  },
  statusTextCompleted: {
    color: "#059669",
  },
  statusBadgeCancelled: {
    backgroundColor: colors.white,
  },
  statusTextCancelled: {
    color: colors.error,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  locationText: {
    flex: 1,
    minWidth: 0,
  },
  locationAddress: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e8f1ff",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  studentText: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  studentLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  studentName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  studentEmail: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
