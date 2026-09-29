import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors, spacing } from "../../constants/theme";
import type { InstructorAccountDeletionBlockers } from "../../types/instructor-account";

type DeleteAccountBlockedDialogProps = {
  visible: boolean;
  blockers: InstructorAccountDeletionBlockers | null;
  onClose: () => void;
};

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 0, 0, 0.06)" } : undefined;

export function DeleteAccountBlockedDialog({
  visible,
  blockers,
  onClose,
}: Readonly<DeleteAccountBlockedDialogProps>) {
  if (!blockers) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Account can&apos;t be deleted yet</Text>

          <Text style={styles.description}>
            You need to resolve the following before deleting your Instructor
            Hub account.
          </Text>

          <View style={styles.reasons}>
            {blockers.upcomingBookings ? (
              <View style={styles.reason}>
                <Text style={styles.reasonTitle}>Upcoming lessons</Text>

                <Text style={styles.reasonText}>
                  Complete or cancel your upcoming lessons before deleting your
                  account.
                </Text>
              </View>
            ) : null}

            {blockers.unpaidEarnings ? (
              <View style={styles.reason}>
                <Text style={styles.reasonTitle}>Unpaid earnings</Text>

                <Text style={styles.reasonText}>
                  Your outstanding earnings need to be paid before deleting your
                  account.
                </Text>
              </View>
            ) : null}
          </View>

          <Pressable
            onPress={onClose}
            android_ripple={ANDROID_RIPPLE}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Text style={styles.buttonText}>Got it</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    paddingHorizontal: spacing.xl,
  },
  dialog: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    color: colors.text,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  reasons: {
    gap: spacing.md,
  },
  reason: {
    gap: spacing.xs,
  },
  reasonTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  reasonText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  button: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  pressed: {
    opacity: 0.85,
  },
});
