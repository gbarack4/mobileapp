import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CloseIcon } from "../icons/lesson-detail-icons";
import { colors, spacing } from "../../constants/theme";

type SchoolsMapChromeProps = {
  onBack: () => void;
};

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 0, 0, 0.06)" } : undefined;

const FLOATING_SHADOW =
  Platform.OS === "web"
    ? ({ boxShadow: "0 4px 14px rgba(15, 23, 42, 0.12)" } as object)
    : {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 14,
        elevation: 5,
      };

export function SchoolsMapChrome({ onBack }: Readonly<SchoolsMapChromeProps>) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { top: insets.top + spacing.sm }]}>
      <Pressable
        onPress={onBack}
        hitSlop={8}
        android_ripple={ANDROID_RIPPLE}
        style={({ pressed }) => [
          styles.backButton,
          FLOATING_SHADOW,
          pressed && styles.pressed,
        ]}
      >
        <CloseIcon size={20} />
      </Pressable>

      <View style={[styles.titlePill, FLOATING_SHADOW]} pointerEvents="none">
        <Text style={styles.title}>Driving Schools nearby</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    left: spacing.xl,
    right: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  backButton: {
    position: "absolute",
    left: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  titlePill: {
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    maxWidth: "72%",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.88,
  },
});
