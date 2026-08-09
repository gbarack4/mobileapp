import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

import { colors, spacing } from "../../constants/theme";
import {
  MOCK_MESSAGES,
  MOCK_NOTIFICATIONS,
  // UNREAD_MESSAGE_COUNT, // Message tab temporarily hidden
  UNREAD_NOTIFICATION_COUNT,
} from "../../data/mock-inbox";
import type {
  InboxMessage,
  InboxNotification,
  InboxNotificationType,
} from "../../types/inbox";
import {
  BookingsNavIcon,
  EarningsNavIcon,
  HomeNavIcon,
  InboxNavIcon,
} from "../icons/dashboard-icons";

type InboxSection = "message" | "notification";

type InboxScreenProps = {
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

const SECTIONS: { id: InboxSection; label: string; badgeCount: number }[] = [
  // Message tab temporarily hidden
  // { id: "message", label: "Message", badgeCount: UNREAD_MESSAGE_COUNT },
  {
    id: "notification",
    label: "Notification",
    badgeCount: UNREAD_NOTIFICATION_COUNT,
  },
];

function formatBadgeCount(count: number) {
  return count > 99 ? "99+" : String(count);
}

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 94, 255, 0.08)" } : undefined;

const NOTIFICATION_ICON: Record<
  InboxNotificationType,
  { bg: string; color: string; Icon: typeof HomeNavIcon }
> = {
  booking: {
    bg: "#dbeafe",
    color: colors.primary,
    Icon: BookingsNavIcon,
  },
  payment: {
    bg: "#dcfce7",
    color: "#15803d",
    Icon: EarningsNavIcon,
  },
  school: {
    bg: "#ccfbf1",
    color: "#0f766e",
    Icon: HomeNavIcon,
  },
  reminder: {
    bg: "#fef3c7",
    color: "#b45309",
    Icon: InboxNavIcon,
  },
  system: {
    bg: colors.inputBackground,
    color: colors.textSecondary,
    Icon: InboxNavIcon,
  },
};

function MessageRow({ message }: Readonly<{ message: InboxMessage }>) {
  return (
    <Pressable
      onPress={() => router.push(`/dashboard/inbox/${message.id}`)}
      android_ripple={ANDROID_RIPPLE}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.rowPressed,
      ]}
    >
      <View
        style={[styles.avatar, message.fromSchool && styles.avatarSchool]}
      >
        <Image
          source={{ uri: message.avatarUrl }}
          style={styles.avatarImage}
          accessibilityLabel={`${message.senderName} photo`}
        />
      </View>

      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text
            style={[styles.rowTitle, message.unread && styles.rowTitleUnread]}
            numberOfLines={1}
          >
            {message.senderName}
          </Text>
          <Text style={styles.timeLabel}>{message.timeLabel}</Text>
        </View>
        <View style={styles.previewRow}>
          <Text
            style={[styles.preview, message.unread && styles.previewUnread]}
            numberOfLines={2}
          >
            {message.preview}
          </Text>
          {message.unread ? <View style={styles.unreadDot} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

function NotificationRow({
  notification,
}: Readonly<{ notification: InboxNotification }>) {
  const meta = NOTIFICATION_ICON[notification.type];
  const { Icon } = meta;

  return (
    <Pressable
      android_ripple={ANDROID_RIPPLE}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.rowPressed,
      ]}
    >
      <View style={[styles.iconBadge, { backgroundColor: meta.bg }]}>
        <Icon size={18} color={meta.color} />
      </View>

      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text
            style={[
              styles.rowTitle,
              notification.unread && styles.rowTitleUnread,
            ]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          <Text style={styles.timeLabel}>{notification.timeLabel}</Text>
        </View>
        <View style={styles.previewRow}>
          <Text
            style={[
              styles.preview,
              notification.unread && styles.previewUnread,
            ]}
            numberOfLines={2}
          >
            {notification.body}
          </Text>
          {notification.unread ? <View style={styles.unreadDot} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

export function InboxScreen({ onScroll }: Readonly<InboxScreenProps>) {
  const [section, setSection] = useState<InboxSection>("notification");

  const showSegmentControl = SECTIONS.length > 1;

  return (
    <View style={styles.screen}>
      {showSegmentControl ? (
        <View style={styles.header}>
          <View style={styles.segmentRow}>
            {SECTIONS.map((item) => {
              const active = section === item.id;

              return (
                <Pressable
                  key={item.id}
                  onPress={() => setSection(item.id)}
                  android_ripple={ANDROID_RIPPLE}
                  style={({ pressed }) => [
                    styles.segmentButton,
                    active && styles.segmentButtonActive,
                    pressed && styles.segmentButtonPressed,
                  ]}
                >
                  <View style={styles.segmentLabelRow}>
                    <Text
                      style={[
                        styles.segmentLabel,
                        active && styles.segmentLabelActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {item.badgeCount > 0 ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {formatBadgeCount(item.badgeCount)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={8}
      >
        {section === "message" ? (
          <View style={styles.list}>
            {MOCK_MESSAGES.map((message) => (
              <MessageRow key={message.id} message={message} />
            ))}
          </View>
        ) : (
          <View style={styles.list}>
            {MOCK_NOTIFICATIONS.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
              />
            ))}
          </View>
        )}
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
    paddingBottom: spacing.sm,
  },
  segmentRow: {
    flexDirection: "row",
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  segmentButtonActive: {
    backgroundColor: colors.primary,
  },
  segmentButtonPressed: {
    opacity: 0.85,
  },
  segmentLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textMuted,
  },
  segmentLabelActive: {
    color: colors.white,
    fontWeight: "700",
  },
  badge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.white,
    lineHeight: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: 96,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowPressed: {
    opacity: 0.85,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.inputBackground,
    overflow: "hidden",
  },
  avatarSchool: {
    borderRadius: 12,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  rowTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  rowTitleUnread: {
    fontWeight: "700",
  },
  timeLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  preview: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  previewUnread: {
    color: colors.text,
    fontWeight: "500",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
