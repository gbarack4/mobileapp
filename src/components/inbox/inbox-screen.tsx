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
import { useAuth } from "@clerk/clerk-expo";

import { getInstructorInvites } from "@/services/school-invite";
import { colors, spacing } from "../../constants/theme";
import type { InboxNotification } from "../../types/inbox";
import {
  HomeNavIcon,
  InboxNavIcon,
  MoreVerticalIcon,
  SearchIcon,
} from "../icons/dashboard-icons";
import {
  getSchoolAvatarColor,
  getSchoolInitials,
} from "../../utils/school-ui";

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

function mapInviteToNotification(invite: Record<string, any>): InboxNotification {
  const school = invite.school ?? {};
  const schoolName =
    invite.schoolName || school.name || "A school";
  const schoolId = school.id || invite.id || schoolName;
  const avatarUrl = invite.schoolLogoUrl || school.logoUrl || null;

  return {
    id: invite.id,
    type: "school",
    title: schoolName,
    body: "has invited you to join as an instructor.",
    timeLabel: formatRelativeTime(invite.createdAt),
    unread: !invite._isRead,
    avatarUrl,
    avatarColor: invite.schoolAvatarColor || getSchoolAvatarColor(schoolId),
    initials: invite.schoolInitials || getSchoolInitials(schoolName),
  };
}

function NotificationAvatar({
  notification,
}: Readonly<{ notification: InboxNotification }>) {
  return (
    <View style={styles.avatarWrap}>
      {notification.avatarUrl ? (
        <Image
          source={{ uri: notification.avatarUrl }}
          style={styles.avatar}
        />
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

  const { data: realInvites, isLoading, isError } = useQuery({
    queryKey: ["instructor-invites"],
    queryFn: async () => {
      const token = await getToken();
      return getInstructorInvites(token);
    },
  });

  const markAsRead = (inviteId: string) => {
    queryClient.setQueryData(["instructor-invites"], (oldData: any[]) => {
      if (!oldData) return oldData;
      return oldData.map((invite) =>
        invite.id === inviteId ? { ...invite, _isRead: true } : invite,
      );
    });
  };

  const notifications = useMemo(
    () => (realInvites ?? []).map((invite) => mapInviteToNotification(invite)),
    [realInvites],
  );

  const visibleNotifications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return notifications;
    }

    return notifications.filter((notification) =>
      `${notification.title} ${notification.body}`.toLowerCase().includes(query),
    );
  }, [notifications, searchQuery]);

  const newNotifications = visibleNotifications.filter((item) => item.unread);
  const earlierNotifications = visibleNotifications.filter(
    (item) => !item.unread,
  );

  function handleNotificationPress(notification: InboxNotification) {
    markAsRead(notification.id);
    if (notification.type === "school") {
      router.push({ pathname: "/invite", params: { id: notification.id } });
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
              : "When schools invite you, they will show up here."}
        </Text>
      </View>
    );
  }

  function renderSection(
    title: string,
    items: InboxNotification[],
  ) {
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
            onPress={() => handleNotificationPress(notification)}
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
