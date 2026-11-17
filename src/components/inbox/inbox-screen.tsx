import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-provider";

import {
  listInstructorNotifications,
  markInstructorNotificationRead,
  setIosAppIconBadge,
  type InstructorPushNotification,
} from "@/services/instructor-notifications";
import { colors, spacing } from "../../constants/theme";
import type { InboxNotification } from "../../types/inbox";
import type { SchoolInvite } from "../../types/school-invite";
import { getInstructorInvites } from "@/services/school-invite";
import {
  HomeNavIcon,
  InboxNavIcon,
  MoreVerticalIcon,
  SearchIcon,
} from "../icons/dashboard-icons";
import { getSchoolAvatarColor, getSchoolInitials } from "../../utils/school-ui";

type InboxScreenProps = {
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 94, 255, 0.08)" } : undefined;

const UNREAD_ROW_BG = "#e7f3ff";

function formatRelativeTime(iso?: string | null) {
  if (!iso) {
    return "New";
  }

  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return "New";
  }

  const diffMs = Math.max(0, Date.now() - then);
  const minutes = Math.max(1, Math.round(diffMs / 60_000));
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }

  return `${Math.round(hours / 24)}d`;
}

function mapPushToNotification(item: InstructorPushNotification): InboxNotification {
  let type: InboxNotification["type"] = "booking";
  switch (item.type) {
    case "instructor_school_invitation":
      type = "school";
      break;
    case "instructor_payout_completed":
      type = "payment";
      break;
    case "instructor_booking_reminder_30m":
      type = "reminder";
      break;
    default:
      break;
  }
  return {
    id: item.id,
    type,
    title: item.title,
    body: item.body,
    timeLabel: formatRelativeTime(item.createdAt),
    unread: item.readAt === null,
    avatarUrl: null,
    avatarColor: getSchoolAvatarColor(item.type),
    initials: getSchoolInitials(item.title),
  };
}

function mapLegacyInvite(invite: SchoolInvite): InboxNotification {
  return {
    id: `legacy:${invite.id}`,
    type: "school",
    title: invite.schoolName,
    body: "has invited you to join as an instructor.",
    timeLabel: "Earlier",
    unread: false,
    avatarUrl: invite.schoolLogoUrl,
    avatarColor: invite.schoolAvatarColor,
    initials: invite.schoolInitials,
  };
}

function NotificationAvatar({
  notification,
}: Readonly<{ notification: InboxNotification }>) {
  return (
    <View style={styles.avatarWrap}>
      {notification.avatarUrl ? (
        <Image source={{ uri: notification.avatarUrl }} style={styles.avatar} />
      ) : (
        <View
          style={[
            styles.avatar,
            { backgroundColor: notification.avatarColor ?? colors.primary },
          ]}
        >
          <Text style={styles.avatarText}>{notification.initials}</Text>
        </View>
      )}
      <View style={styles.overlayBadge}>
        <HomeNavIcon size={12} color={colors.white} />
      </View>
    </View>
  );
}

function NotificationRow({
  notification,
  onPress,
}: Readonly<{
  notification: InboxNotification;
  onPress: () => void;
}>) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={ANDROID_RIPPLE}
      style={({ pressed }) => [
        styles.row,
        notification.unread && styles.rowUnread,
        pressed && styles.rowPressed,
      ]}
    >
      <NotificationAvatar notification={notification} />
      <View style={styles.rowBody}>
        <Text style={styles.rowText}>
          <Text style={styles.rowTitle}>{notification.title} </Text>
          {notification.body}{" "}
          <Text style={styles.timeLabel}>{notification.timeLabel}</Text>
        </Text>
      </View>
      <View style={styles.moreButton} pointerEvents="none">
        <MoreVerticalIcon size={18} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

export function InboxScreen({ onScroll }: Readonly<InboxScreenProps>) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: pushNotifications,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["instructor-notifications"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Authentication required");
      return listInstructorNotifications(token);
    },
    refetchInterval: 30_000,
  });

  const { data: existingInvites } = useQuery({
    queryKey: ["instructor-invites"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Authentication required");
      return getInstructorInvites(token);
    },
  });

  const notifications = useMemo(() => {
    const pushItems = pushNotifications ?? [];
    const pushInviteIds = new Set(pushItems.map((item) => item.inviteId));
    const legacyInvites = (existingInvites ?? [])
      .filter((invite) => !pushInviteIds.has(invite.id))
      .map(mapLegacyInvite);
    return [...pushItems.map(mapPushToNotification), ...legacyInvites];
  }, [pushNotifications, existingInvites]);

  const visibleNotifications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return notifications;
    }

    return notifications.filter((notification) =>
      `${notification.title} ${notification.body}`
        .toLowerCase()
        .includes(query),
    );
  }, [notifications, searchQuery]);

  const newNotifications = visibleNotifications.filter((item) => item.unread);
  const earlierNotifications = visibleNotifications.filter(
    (item) => !item.unread,
  );

  async function handleNotificationPress(notification: InboxNotification) {
    if (notification.id.startsWith("legacy:")) {
      router.push({ pathname: "/invite", params: { id: notification.id.slice(7) } });
      return;
    }
    const item = pushNotifications?.find((candidate) => candidate.id === notification.id);
    if (!item) return;

    if (!item.readAt) {
      try {
        const token = await getToken();
        if (!token) return;
        const count = await markInstructorNotificationRead(token, item.id);
        queryClient.setQueryData<InstructorPushNotification[]>(
          ["instructor-notifications"],
          (previous) => previous?.map((entry) => entry.id === item.id
            ? { ...entry, readAt: new Date().toISOString() }
            : entry),
        );
        queryClient.setQueryData(["instructor-notifications-count"], count);
        await setIosAppIconBadge(count);
      } catch (error) {
        console.warn("[Notifications] Failed to mark as read:", error);
        return;
      }
    }

    if (item.type === "instructor_school_invitation" && item.inviteId) {
      router.push({ pathname: "/invite", params: { id: item.inviteId } });
    }
  }

  function renderEmpty() {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <InboxNavIcon size={36} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>No notification</Text>
        <Text style={styles.emptySubtitle}>
          {isError
            ? "Notifications will appear here when they are available."
            : searchQuery.trim()
              ? "Try a different search."
              : "Notifications will appear here when they are available."}
        </Text>
      </View>
    );
  }

  function renderSection(title: string, items: InboxNotification[]) {
    if (items.length === 0) {
      return null;
    }

    return (
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {items.map((notification) => (
          <NotificationRow
            key={notification.id}
            notification={notification}
            onPress={() => void handleNotificationPress(notification)}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        {searchOpen ? (
          <View style={styles.searchRow}>
            <SearchIcon size={18} color={colors.textMuted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search notifications"
              placeholderTextColor={colors.textMuted}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.searchInput}
            />
            <Pressable
              onPress={() => {
                setSearchOpen(false);
                setSearchQuery("");
              }}
              hitSlop={8}
              android_ripple={ANDROID_RIPPLE}
              style={styles.searchClose}
            >
              <Text style={styles.searchCloseText}>Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.title}>Notifications</Text>
            <Pressable
              onPress={() => setSearchOpen(true)}
              android_ripple={ANDROID_RIPPLE}
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.rowPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Search notifications"
            >
              <SearchIcon size={20} color={colors.text} />
            </Pressable>
          </>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={8}
      >
        {isLoading ? (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={styles.loader}
          />
        ) : visibleNotifications.length === 0 ? (
          renderEmpty()
        ) : (
          <>
            {renderSection("New", newNotifications)}
            {renderSection("Earlier", earlierNotifications)}
          </>
        )}
      </ScrollView>
    </View>
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
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  title: {
    flex: 1,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.4,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.inputBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  searchRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.inputBackground,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
  },
  searchClose: {
    paddingLeft: spacing.xs,
  },
  searchCloseText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: 96,
    flexGrow: 1,
  },
  loader: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  rowUnread: {
    backgroundColor: UNREAD_ROW_BG,
  },
  rowPressed: { opacity: 0.85 },
  avatarWrap: {
    width: 56,
    height: 56,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.inputBackground,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.white,
  },
  overlayBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  rowText: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.textSecondary,
    fontWeight: "400",
  },
  rowTitle: {
    fontWeight: "700",
    color: colors.text,
  },
  timeLabel: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: "400",
  },
  moreButton: {
    paddingTop: 4,
    paddingLeft: spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    paddingTop: 72,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.inputBackground,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
