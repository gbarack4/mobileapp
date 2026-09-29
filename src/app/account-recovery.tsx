import { useAuth, useClerk } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors, spacing } from "@/constants/theme";
import {
  getInstructorAccountStatus,
  restoreInstructorAccount,
} from "@/services/instructor-account";
import type { InstructorAccountStatusResult } from "@/types/instructor-account";

function formatRecoveryDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function AccountRecoveryScreen() {
  const { getToken } = useAuth();
  const { signOut } = useClerk();

  const [accountStatus, setAccountStatus] =
    useState<InstructorAccountStatusResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAccountStatus() {
      try {
        const token = await getToken();

        if (!token || cancelled) {
          return;
        }

        const status = await getInstructorAccountStatus(token);

        if (!cancelled) {
          setAccountStatus(status);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Failed to load instructor account status:", error);

        Alert.alert(
          "Unable to load account",
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAccountStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRestore() {
    if (restoring) {
      return;
    }

    setRestoring(true);

    try {
      const token = await getToken();

      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      await restoreInstructorAccount(token);

      router.replace("/dashboard");
    } catch (error) {
      Alert.alert(
        "Unable to restore account",
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setRestoring(false);
    }
  }

  async function handleSignOut() {
    await signOut();
  }

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const expired = accountStatus?.status === "recovery_expired";

  const recoveryDate = accountStatus?.recoveryExpiresAt
    ? formatRecoveryDate(accountStatus.recoveryExpiresAt)
    : null;

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {expired
            ? "Account recovery expired"
            : "Your account has been deleted"}
        </Text>

        <Text style={styles.description}>
          {expired
            ? "Your 30-day recovery period has expired. This account can no longer be restored."
            : "Your Instructor account is currently deleted. You can restore it during the 30-day recovery period."}
        </Text>

        {!expired && recoveryDate ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Recovery available until</Text>

            <Text style={styles.infoValue}>{recoveryDate}</Text>
          </View>
        ) : null}

        {!expired && accountStatus?.canRestore ? (
          <Pressable
            onPress={() => void handleRestore()}
            disabled={restoring}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
              restoring && styles.buttonDisabled,
            ]}
          >
            {restoring ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Restore account</Text>
            )}
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => void handleSignOut()}
          disabled={restoring}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.secondaryButtonText}>Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing.lg,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.textSecondary,
    textAlign: "center",
  },
  infoCard: {
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: "#F5F7FA",
    gap: spacing.xs,
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D9DDE3",
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
