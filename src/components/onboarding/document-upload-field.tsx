import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "../../constants/theme";

type DocumentUploadFieldProps = {
  label: string;
  hint?: string;
  fileName: string | null;
  onPress: () => void;
};

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 94, 255, 0.14)" } : undefined;

export function DocumentUploadField({
  label,
  hint,
  fileName,
  onPress,
}: Readonly<DocumentUploadFieldProps>) {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>

      <Pressable
        onPress={onPress}
        android_ripple={ANDROID_RIPPLE}
        style={({ pressed }) => [styles.uploadCard, pressed && styles.pressed]}
      >
        <Text style={styles.uploadTitle}>
          {fileName ? "Document added" : "Upload document"}
        </Text>
        <Text style={styles.uploadSubtitle}>
          {fileName ?? "Tap to select a PDF or image"}
        </Text>
      </Pressable>
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
  pressed: {
    opacity: 0.85,
  },
});
