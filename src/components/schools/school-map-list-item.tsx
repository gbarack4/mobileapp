import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "../../constants/theme";
import type { School } from "../../types/school";

type SchoolMapListItemProps = {
  school: School;
  selected: boolean;
  onPress: (school: School) => void;
};

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 94, 255, 0.08)" } : undefined;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}

export function SchoolMapListItem({
  school,
  selected,
  onPress,
}: Readonly<SchoolMapListItemProps>) {
  return (
    <Pressable
      onPress={() => onPress(school)}
      android_ripple={ANDROID_RIPPLE}
      style={[styles.item, selected && styles.itemSelected]}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(school.name)}</Text>
      </View>

      <View style={styles.text}>
        <Text style={styles.name}>{school.name}</Text>
        <Text style={styles.location}>
          {school.address}, {school.suburb}
        </Text>
      </View>

      <Text style={styles.rating}>{school.rating}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  itemSelected: {
    backgroundColor: "#f0f6ff",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  location: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  rating: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
});
