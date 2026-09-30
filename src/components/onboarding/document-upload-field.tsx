import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors, radius, spacing } from "../../constants/theme";

type DocumentUploadFieldProps = {
  label: string;
  hint?: string;
  fileName: string | null;
  uploading?: boolean;
  error?: string | null;
  onPress: () => void;
};

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 94, 255, 0.14)" } : undefined;

function GreenTick() {
  return (
    <View style={styles.tick}>
      <Text style={styles.tickMark}>✓</Text>
    </View>
  );
}

export function DocumentUploadField({
  label,
  hint,
  fileName,
  uploading = false,
  error = null,
  onPress,
}: Readonly<DocumentUploadFieldProps>) {
  const progress = useRef(new Animated.Value(fileName ? 1 : 0)).current;
  const uploaded = Boolean(fileName) && !uploading;

  useEffect(() => {
    if (uploading) {
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 0.9,
        duration: 4000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      return;
    }

    if (fileName) {
      Animated.timing(progress, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
      return;
    }

    progress.setValue(0);
  }, [fileName, progress, uploading]);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>

      <Pressable
        onPress={onPress}
        disabled={uploading}
        android_ripple={ANDROID_RIPPLE}
        style={({ pressed }) => [
          styles.uploadCard,
          uploaded && styles.uploadCardSuccess,
          pressed && !uploading && styles.pressed,
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardText}>
            <Text style={styles.uploadTitle}>
              {uploading
                ? "Uploading..."
                : uploaded
                  ? "Document added"
                  : "Upload document"}
            </Text>
            <Text style={styles.uploadSubtitle}>
              {uploading
                ? "Please wait"
                : (fileName ?? "Tap to select a PDF or image")}
            </Text>
          </View>
          {uploaded ? <GreenTick /> : null}
        </View>

        {uploading || uploaded ? (
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                uploaded && styles.progressFillSuccess,
                {
                  width: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>
        ) : null}
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  labelRow: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
    fontWeight: "500",
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  uploadCard: {
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderWidth: 2,
    borderColor: "transparent",
    gap: spacing.md,
  },
  uploadCardSuccess: {
    borderColor: "#bbf7d0",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  cardText: {
    flex: 1,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  uploadSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: colors.error,
  },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  progressFillSuccess: {
    backgroundColor: "#22c55e",
  },
  tick: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
  },
  tickMark: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.85,
  },
});
