import { type ReactNode, useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ChevronRightIcon } from "../icons/dashboard-icons";
import { colors, spacing } from "../../constants/theme";

export type AccountMenuOption = {
  id: string;
  label: string;
  onPress: () => void;
};

type AccountMenuRowProps = {
  label: string;
  subtitle?: string;
  icon: ReactNode;
  onPress?: () => void;
  showDivider?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  options?: AccountMenuOption[];
};

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 0, 0, 0.04)" } : undefined;

const OPTION_ROW_HEIGHT = 48;
const EXPAND_MS = 240;

export function AccountMenuRow({
  label,
  subtitle,
  icon,
  onPress,
  showDivider = true,
  expandable = false,
  expanded = false,
  options = [],
}: Readonly<AccountMenuRowProps>) {
  const progress = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    if (!expandable) {
      return;
    }

    Animated.timing(progress, {
      toValue: expanded ? 1 : 0,
      duration: EXPAND_MS,
      easing: expanded ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [expandable, expanded, progress]);

  const optionsHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(options.length, 1) * OPTION_ROW_HEIGHT],
  });

  const optionsOpacity = progress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0.4, 1],
  });

  const chevronRotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  return (
    <View>
      <Pressable
        onPress={onPress}
        android_ripple={ANDROID_RIPPLE}
        accessibilityState={expandable ? { expanded } : undefined}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <View style={styles.iconWrap}>{icon}</View>

        <View style={styles.textWrap}>
          <Text style={styles.label}>{label}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
          <ChevronRightIcon size={18} color={colors.textMuted} />
        </Animated.View>
      </Pressable>

      {expandable ? (
        <Animated.View
          pointerEvents={expanded ? "auto" : "none"}
          style={[
            styles.optionsWrap,
            {
              height: optionsHeight,
              opacity: optionsOpacity,
            },
          ]}
        >
          {options.map((option) => (
            <Pressable
              key={option.id}
              onPress={option.onPress}
              android_ripple={ANDROID_RIPPLE}
              style={({ pressed }) => [
                styles.optionRow,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.optionLabel}>{option.label}</Text>
              <ChevronRightIcon size={16} color={colors.textMuted} />
            </Pressable>
          ))}
        </Animated.View>
      ) : null}

      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingVertical: 18,
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    width: 28,
    alignItems: "center",
  },
  textWrap: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  optionsWrap: {
    overflow: "hidden",
    backgroundColor: "#fafafa",
  },
  optionRow: {
    height: OPTION_ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: spacing.xl + 28 + spacing.lg,
    paddingRight: spacing.xl,
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.xl,
  },
  pressed: {
    opacity: 0.85,
  },
});
