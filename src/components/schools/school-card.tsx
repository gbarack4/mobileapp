import { router } from "expo-router";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { MapPinIcon } from "../icons/dashboard-icons";
import { colors, spacing } from "../../constants/theme";
import type { School } from "../../types/school";
import { getSchoolUIData } from "../../utils/school-ui";
import { StarRating } from "./star-rating";

type SchoolCardProps = {
  school: School;
  onJoin: (school: School) => void;
};

type PressableState = {
  pressed: boolean;
  hovered?: boolean;
};

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 94, 255, 0.08)" } : undefined;

function joinButtonStyles(status: School["joinStatus"]) {
  if (status === "pending") {
    return {
      button: styles.pendingButton,
      hovered: styles.pendingButtonHovered,
      text: styles.pendingButtonText,
      label: "Pending",
    };
  }

  if (status === "accepted") {
    return {
      button: styles.joinedButton,
      hovered: styles.joinedButtonHovered,
      text: styles.joinedButtonText,
      label: "Joined",
    };
  }

  if (status === "paused") {
    return {
      button: styles.pausedButton,
      hovered: styles.pausedButtonHovered,
      text: styles.pausedButtonText,
      label: "Paused",
    };
  }

  if (status === "rejected") {
    return {
      button: styles.pausedButton,
      hovered: styles.pausedButtonHovered,
      text: styles.pausedButtonText,
      label: "Rejected",
    };
  }

  return {
    button: styles.primaryButton,
    hovered: styles.primaryButtonHovered,
    text: styles.primaryButtonText,
    label: "Join",
  };
}

export function SchoolCard({ school, onJoin }: Readonly<SchoolCardProps>) {
  const status = school.joinStatus || "none";
  const canJoin = status === "none";
  const joinStyles = joinButtonStyles(status);

  const { initials, avatarColor } = getSchoolUIData(school);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        {school.logoUrl ? (
          <Image
            source={{ uri: school.logoUrl }}
            style={styles.avatar}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}

        <View style={styles.headerText}>
          <Text style={styles.name}>{school.name}</Text>
          <StarRating rating={school.rating} reviewCount={school.reviewCount} />
        </View>
      </View>

      <View style={styles.locationRow}>
        <MapPinIcon size={14} color={colors.textMuted} />
        <Text style={styles.locationText} numberOfLines={1}>
          {school.address}
          {school.suburb ? `, ${school.suburb}` : ""}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => router.push(`/dashboard/school/${school.id}`)}
          android_ripple={ANDROID_RIPPLE}
          style={({ pressed, hovered }: PressableState) => [
            styles.secondaryButton,
            hovered && styles.buttonHoverOverlay,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.secondaryButtonText}>View Details</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            if (canJoin) {
              onJoin(school);
            }
          }}
          disabled={!canJoin}
          accessibilityState={{ disabled: !canJoin }}
          android_ripple={canJoin ? ANDROID_RIPPLE : undefined}
          style={({ pressed, hovered }: PressableState) => [
            joinStyles.button,
            hovered && styles.buttonHoverOverlay,
            pressed && canJoin && styles.pressed,
          ]}
        >
          <Text style={joinStyles.text}>{joinStyles.label}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },
  distanceText: {
    fontWeight: "600",
    color: colors.text,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    ...(Platform.OS === "web"
      ? ({
          outlineStyle: "none",
          transition: "filter 0.15s ease, opacity 0.15s ease",
          position: "relative",
        } as object)
      : {}),
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  primaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    ...(Platform.OS === "web"
      ? ({
          outlineStyle: "none",
          transition: "filter 0.15s ease, opacity 0.15s ease",
          position: "relative",
        } as object)
      : {}),
  },
  primaryButtonHovered: {
    backgroundColor: colors.primaryHover,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.white,
  },
  pendingButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#f59e0b",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    ...(Platform.OS === "web"
      ? ({
          outlineStyle: "none",
          transition: "filter 0.15s ease, opacity 0.15s ease",
          position: "relative",
        } as object)
      : {}),
  },
  pendingButtonHovered: {
    backgroundColor: "#d97706",
  },
  pendingButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
  joinedButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    ...(Platform.OS === "web"
      ? ({
          outlineStyle: "none",
          transition: "filter 0.15s ease, opacity 0.15s ease",
          position: "relative",
        } as object)
      : {}),
  },
  joinedButtonHovered: {
    backgroundColor: "#16a34a",
  },
  joinedButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
  pausedButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    ...(Platform.OS === "web"
      ? ({
          outlineStyle: "none",
          transition: "filter 0.15s ease, opacity 0.15s ease",
          position: "relative",
        } as object)
      : {}),
  },
  pausedButtonHovered: {
    backgroundColor: "#e5e7eb",
  },
  pausedButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  buttonHoverOverlay: {
    ...(Platform.OS === "web"
      ? ({
          filter: "brightness(0.92)",
          boxShadow: "inset 0 0 0 999px rgba(15, 23, 42, 0.08)",
        } as object)
      : {
          opacity: 0.9,
        }),
  },
  pressed: {
    opacity: 0.88,
  },
});
