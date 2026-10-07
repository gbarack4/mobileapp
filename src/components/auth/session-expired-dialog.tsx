import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors } from "@/constants/theme";

type Props = Readonly<{
  visible: boolean;
  busy: boolean;
  error: string | null;
  onSignIn: () => void;
}>;

export function SessionExpiredDialog({
  visible,
  busy,
  error,
  onSignIn,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        // Keep the session notice visible until the user chooses Sign in.
      }}
    >
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityViewIsModal>
          <Text style={styles.title} accessibilityRole="header">
            Session expired
          </Text>
          <Text style={styles.message}>
            You’ve been signed out after 3 hours of inactivity. Please sign in
            again to continue.
          </Text>
          {error ? (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign in"
            disabled={busy}
            onPress={onSignIn}
            style={[styles.button, busy && styles.disabled]}
          >
            {busy ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Sign in</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  message: { fontSize: 16, lineHeight: 24, color: colors.textSecondary },
  error: { marginTop: 12, color: colors.error },
  button: {
    marginTop: 24,
    borderRadius: 10,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primary,
  },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: "600" },
  disabled: { opacity: 0.6 },
});
