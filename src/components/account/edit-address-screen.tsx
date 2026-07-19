import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AuthTextField } from "../auth/auth-text-field";
import { ChevronLeftIcon } from "../icons/dashboard-icons";
import { colors, spacing } from "../../constants/theme";
import {
  cloneInstructorAddress,
  MOCK_INSTRUCTOR_ADDRESS,
  type InstructorAddress,
} from "../../data/mock-instructor-address";

type EditAddressScreenProps = {
  onClose: () => void;
};

type FocusedField = keyof InstructorAddress | null;

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 0, 0, 0.06)" } : undefined;

export function EditAddressScreen({
  onClose,
}: Readonly<EditAddressScreenProps>) {
  const [address, setAddress] = useState(() =>
    cloneInstructorAddress(MOCK_INSTRUCTOR_ADDRESS),
  );
  const [focusedField, setFocusedField] = useState<FocusedField>(null);
  const [error, setError] = useState<string | null>(null);

  const line2Ref = useRef<TextInput>(null);
  const suburbRef = useRef<TextInput>(null);
  const stateRef = useRef<TextInput>(null);
  const postcodeRef = useRef<TextInput>(null);

  function updateField<K extends keyof InstructorAddress>(
    field: K,
    value: InstructorAddress[K],
  ) {
    setAddress((current) => ({ ...current, [field]: value }));
    setError(null);
  }

  function handleSave() {
    if (!address.line1.trim()) {
      setError("Enter your street address.");
      return;
    }

    if (!address.suburb.trim()) {
      setError("Enter your suburb.");
      return;
    }

    if (!address.state.trim()) {
      setError("Enter your state.");
      return;
    }

    if (!/^\d{4}$/.test(address.postcode.trim())) {
      setError("Enter a valid 4-digit postcode.");
      return;
    }

    // TODO: connect to NestJS instructor address API
    onClose();
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Pressable
          onPress={onClose}
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

        <Text style={styles.headerTitle}>Edit Address</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.introTitle}>Home address</Text>
        <Text style={styles.introText}>
          Update where you are based. Schools may use this for lesson planning
          and local matching.
        </Text>

        <View style={styles.form}>
          <AuthTextField
            label="Street address"
            value={address.line1}
            onChangeText={(value) => updateField("line1", value)}
            onFocus={() => setFocusedField("line1")}
            onBlur={() =>
              setFocusedField((current) =>
                current === "line1" ? null : current,
              )
            }
            onSubmitEditing={() => line2Ref.current?.focus()}
            returnKeyType="next"
            placeholder="12 Park Road"
            focused={focusedField === "line1"}
          />

          <AuthTextField
            label="Unit / apartment (optional)"
            value={address.line2}
            onChangeText={(value) => updateField("line2", value)}
            onFocus={() => setFocusedField("line2")}
            onBlur={() =>
              setFocusedField((current) =>
                current === "line2" ? null : current,
              )
            }
            onSubmitEditing={() => suburbRef.current?.focus()}
            returnKeyType="next"
            placeholder="Unit 4"
            focused={focusedField === "line2"}
            ref={line2Ref}
          />

          <AuthTextField
            label="Suburb"
            value={address.suburb}
            onChangeText={(value) => updateField("suburb", value)}
            onFocus={() => setFocusedField("suburb")}
            onBlur={() =>
              setFocusedField((current) =>
                current === "suburb" ? null : current,
              )
            }
            onSubmitEditing={() => stateRef.current?.focus()}
            returnKeyType="next"
            placeholder="Brisbane"
            focused={focusedField === "suburb"}
            ref={suburbRef}
          />

          <View style={styles.row}>
            <View style={styles.rowField}>
              <AuthTextField
                label="State"
                value={address.state}
                onChangeText={(value) => updateField("state", value)}
                onFocus={() => setFocusedField("state")}
                onBlur={() =>
                  setFocusedField((current) =>
                    current === "state" ? null : current,
                  )
                }
                onSubmitEditing={() => postcodeRef.current?.focus()}
                returnKeyType="next"
                placeholder="QLD"
                autoCapitalize="characters"
                focused={focusedField === "state"}
                ref={stateRef}
              />
            </View>

            <View style={styles.rowField}>
              <AuthTextField
                label="Postcode"
                value={address.postcode}
                onChangeText={(value) => updateField("postcode", value)}
                onFocus={() => setFocusedField("postcode")}
                onBlur={() =>
                  setFocusedField((current) =>
                    current === "postcode" ? null : current,
                  )
                }
                returnKeyType="done"
                placeholder="4000"
                keyboardType="number-pad"
                maxLength={4}
                focused={focusedField === "postcode"}
                ref={postcodeRef}
              />
            </View>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleSave}
          android_ripple={ANDROID_RIPPLE}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.saveButtonText}>Save address</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.3,
  },
  introText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  form: {
    gap: spacing.lg,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  rowField: {
    flex: 1,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  saveButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
  },
  pressed: {
    opacity: 0.88,
  },
});
