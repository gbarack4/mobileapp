import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors } from "../../constants/theme";
import { authErrorMessage } from "../../lib/auth/auth-errors";
import { useAuth } from "../../lib/auth/auth-provider";
import { completeSocialSignIn } from "../../lib/auth/social-sign-in";

export default function SSOCallback() {
  const { isLoaded } = useAuth();
  const nativeUrl = Linking.useLinkingURL();
  const [webUrl] = useState(() =>
    Platform.OS === "web" && typeof window !== "undefined"
      ? window.location.href
      : null,
  );
  const [error, setError] = useState<string | null>(null);
  const callbackUrl = Platform.OS === "web" ? webUrl : nativeUrl;

  useEffect(() => {
    if (Platform.OS === "web" && webUrl) {
      window.history.replaceState(window.history.state, "", "/sso-callback");
    }
  }, [webUrl]);

  useEffect(() => {
    if (!isLoaded || !callbackUrl) return;
    let mounted = true;
    void completeSocialSignIn(callbackUrl).catch((reason: unknown) => {
      if (mounted) setError(authErrorMessage(reason));
    });
    return () => {
      mounted = false;
    };
  }, [callbackUrl, isLoaded]);

  return (
    <View style={styles.page}>
      {error ? (
        <>
          <Text accessibilityRole="alert" style={styles.text}>
            {error}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace("/login")}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Back to sign in</Text>
          </Pressable>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.text}>Completing sign-in…</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 20,
    backgroundColor: colors.background,
  },
  text: {
    color: colors.text,
    textAlign: "center",
    fontSize: 16,
    maxWidth: 420,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: { color: colors.white, fontWeight: "600" },
});
