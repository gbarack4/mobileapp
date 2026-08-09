import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../../constants/theme";
import { UNREAD_INBOX_COUNT } from "../../data/mock-inbox";
import type { DashboardTab } from "../../types/dashboard";
import {
  BookingsNavIcon,
  EarningsNavIcon,
  HomeNavIcon,
  InboxNavIcon,
  ProfileNavIcon,
} from "../icons/dashboard-icons";

type DashboardBottomNavProps = {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  translateY?: Animated.Value;
  inboxBadgeCount?: number;
};

const NAV_ITEMS: {
  id: DashboardTab;
  label: string;
  Icon: typeof HomeNavIcon;
}[] = [
  { id: "school", label: "School", Icon: HomeNavIcon },
  { id: "bookings", label: "Bookings", Icon: BookingsNavIcon },
  { id: "inbox", label: "Inbox", Icon: InboxNavIcon },
  { id: "earnings", label: "Earnings", Icon: EarningsNavIcon },
  { id: "profile", label: "Account", Icon: ProfileNavIcon },
];

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 0, 0, 0.06)" } : undefined;

const NAV_ICON_SIZE = 18;

function formatBadgeCount(count: number) {
  return count > 99 ? "99+" : String(count);
}

export function DashboardBottomNav({
  activeTab,
  onTabChange,
  translateY,
  inboxBadgeCount = UNREAD_INBOX_COUNT,
}: Readonly<DashboardBottomNavProps>) {
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { paddingBottom: insets.bottom },
        translateY ? { transform: [{ translateY }] } : null,
      ]}
    >
      <View style={styles.bar}>
        {NAV_ITEMS.map((item) => {
          const active = activeTab === item.id;
          const iconColor = active ? colors.text : colors.textMuted;
          const { Icon } = item;
          const showInboxBadge =
            item.id === "inbox" && inboxBadgeCount > 0;

          return (
            <Pressable
              key={item.id}
              onPress={() => onTabChange(item.id)}
              android_ripple={ANDROID_RIPPLE}
              style={({ pressed }) => [
                styles.item,
                active && styles.itemActive,
                pressed && styles.itemPressed,
              ]}
            >
              <View style={styles.iconWrap}>
                <Icon color={iconColor} size={NAV_ICON_SIZE} />
                {showInboxBadge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {formatBadgeCount(inboxBadgeCount)}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.label, active && styles.labelActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: "#eef2f7",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 8,
  },
  item: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 12,
    ...(Platform.OS === "web"
      ? ({
          transition: "background-color 0.15s ease, opacity 0.15s ease",
        } as object)
      : {}),
  },
  itemActive: {
    backgroundColor: colors.inputBackground,
  },
  itemPressed: {
    opacity: 0.8,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -6,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.white,
    lineHeight: 11,
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.textMuted,
    ...(Platform.OS === "web"
      ? ({ transition: "color 0.15s ease" } as object)
      : {}),
  },
  labelActive: {
    color: colors.text,
    fontWeight: "700",
  },
});
