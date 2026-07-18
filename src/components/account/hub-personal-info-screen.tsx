import { useAuth, useUser } from "@clerk/clerk-expo";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors, spacing } from "../../constants/theme";
import { getMyProfile } from "../../services/profile";
import { getSessionEmail, setSessionEmail } from "../../services/session";
import { AuthTextField } from "../auth/auth-text-field";
import { ChevronLeftIcon } from "../icons/dashboard-icons";

type HubPersonalInfoScreenProps = {
  onBack: () => void;
};

type FocusedField = "firstName" | "lastName" | "phone" | "address" | null;

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 0, 0, 0.06)" } : undefined;

export function HubPersonalInfoScreen({
  onBack,
}: Readonly<HubPersonalInfoScreenProps>) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const clerkEmail = user?.primaryEmailAddress?.emailAddress ?? null;

  const [email, setEmail] = useState(clerkEmail || getSessionEmail() || "");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [focusedField, setFocusedField] = useState<FocusedField>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (clerkEmail) {
      setSessionEmail(clerkEmail);
      if (!email) setEmail(clerkEmail);
    }
  }, [clerkEmail, email]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const token = await getToken();
        const profile = await getMyProfile(token);

        if (cancelled || !profile) {
          return;
        }

        const nameParts = profile.name ? profile.name.split(" ") : [];
        setFirstName(nameParts[0] || "");
        setLastName(nameParts.slice(1).join(" ") || "");

        setEmail(profile.email || clerkEmail || "");
        setPhone(profile.phone || "");

        if (profile.address) {
          const addr = profile.address;
          const fullAddress = [
            addr.line1,
            addr.line2,
            addr.suburb,
            addr.state,
            addr.postcode,
          ]
            .filter(Boolean)
            .join(", ");
          setAddress(fullAddress);
        }

        setSessionEmail(profile.email || clerkEmail || "");
      } catch {
        setError("Failed to load profile data.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [getToken, clerkEmail]);

  async function handleSave() {
    if (isSaving) return;

    setError(null);
    setSuccess(null);
    setIsSaving(true);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          hitSlop={8}
          android_ripple={ANDROID_RIPPLE}
          accessibilityLabel="Back"
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <ChevronLeftIcon size={22} />
        </Pressable>

        <Text style={styles.headerTitle}>Personal info</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.loader}
          />
        ) : (
          <>
            <Text style={styles.description}>
              Info about you and your preferences across InstructorHub services.
              Some details may be visible to schools you work with.
            </Text>

            <View style={styles.form}>
              <Text style={styles.sectionTitle}>Basic info</Text>

              <AuthTextField
                label="First name"
                value={firstName}
                onChangeText={setFirstName}
                onFocus={() => setFocusedField("firstName")}
                onBlur={() => setFocusedField(null)}
                focused={focusedField === "firstName"}
                autoCapitalize="words"
                editable={!isSaving}
              />

              <AuthTextField
                label="Last name"
                value={lastName}
                onChangeText={setLastName}
                onFocus={() => setFocusedField("lastName")}
                onBlur={() => setFocusedField(null)}
                focused={focusedField === "lastName"}
                autoCapitalize="words"
                editable={!isSaving}
              />

              <AuthTextField
                label="Email"
                value={email}
                focused={false}
                editable={false}
                autoCapitalize="none"
              />

              <AuthTextField
                label="Phone"
                value={phone}
                onChangeText={setPhone}
                onFocus={() => setFocusedField("phone")}
                onBlur={() => setFocusedField(null)}
                focused={focusedField === "phone"}
                keyboardType="phone-pad"
                editable={!isSaving}
              />

              <Text style={styles.sectionTitle}>Contact info</Text>

              <AuthTextField
                label="Address"
                value={address}
                onChangeText={setAddress}
                onFocus={() => setFocusedField("address")}
                onBlur={() => setFocusedField(null)}
                focused={focusedField === "address"}
                autoCapitalize="words"
                editable={!isSaving}
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              {success ? (
                <Text style={styles.successText}>{success}</Text>
              ) : null}

              <Pressable
                onPress={() => {
                  void handleSave();
                }}
                disabled={isSaving}
                android_ripple={ANDROID_RIPPLE}
                style={({ pressed }) => [
                  styles.saveButton,
                  (pressed || isSaving) && styles.pressed,
                  isSaving && styles.saveButtonDisabled,
                ]}
              >
                {isSaving ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Save changes</Text>
                )}
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  headerSpacer: {
    width: 32,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  loader: {
    marginTop: 40,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    paddingHorizontal: spacing.xl,
  },
  form: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: spacing.sm,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
  },
  successText: {
    fontSize: 14,
    color: "#15803d",
  },
  saveButton: {
    marginTop: spacing.sm,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.85,
  },
});
