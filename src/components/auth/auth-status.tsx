import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors } from "../../constants/theme";

export function AuthStatus({
  message,
  onRetry,
  onSignOut,
}: Readonly<{
  message?: string;
  onRetry?: () => void;
  onSignOut?: () => void;
}>) {
  return (
    <View style={styles.container}>
      {message ? (
        <Text style={styles.message}>{message}</Text>
      ) : (
        <ActivityIndicator size="large" color={colors.primary} />
      )}
      {onRetry ? (
        <Pressable onPress={onRetry} style={styles.button}>
          <Text style={styles.label}>Try again</Text>
        </Pressable>
      ) : null}
      {onSignOut ? (
        <Pressable onPress={onSignOut} style={styles.button}>
          <Text style={styles.label}>Sign out</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: colors.background,
    gap: 16,
  },
  message: { color: colors.text, textAlign: "center", fontSize: 16 },
  button: { padding: 12 },
  label: { color: colors.primary, fontWeight: "600" },
});
