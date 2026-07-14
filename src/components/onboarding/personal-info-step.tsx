import { useRef } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { AuthTextField } from "../auth/auth-text-field";
import { colors, spacing } from "../../constants/theme";
import type { OnboardingAddress, OnboardingForm } from "../../types/onboarding";
import { ProfilePhotoPicker } from "./profile-photo-picker";

type PersonalInfoStepProps = {
  form: OnboardingForm;
  focusedField: string | null;
  onFocusField: (field: string) => void;
  onBlurField: (field: string) => void;
  onUpdateField: <K extends keyof OnboardingForm>(
    key: K,
    value: OnboardingForm[K],
  ) => void;
  onUpdateAddress: <K extends keyof OnboardingAddress>(
    key: K,
    value: OnboardingAddress[K],
  ) => void;
  onSelectPhoto: (uri: string, fileName: string) => void;
  onRemovePhoto: () => void;
};

function formatDateOfBirthInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function SectionHeader({
  title,
  subtitle,
}: Readonly<{
  title: string;
  subtitle?: string;
}>) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function PersonalInfoStep({
  form,
  focusedField,
  onFocusField,
  onBlurField,
  onUpdateField,
  onUpdateAddress,
  onSelectPhoto,
  onRemovePhoto,
}: Readonly<PersonalInfoStepProps>) {
  const line1Ref = useRef<TextInput>(null);
  const line2Ref = useRef<TextInput>(null);
  const suburbRef = useRef<TextInput>(null);
  const stateRef = useRef<TextInput>(null);
  const postcodeRef = useRef<TextInput>(null);
  const emergencyNameRef = useRef<TextInput>(null);
  const emergencyPhoneRef = useRef<TextInput>(null);

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Your profile"
        subtitle="This is shown to schools when you join their instructor network."
      />

      <ProfilePhotoPicker
        photoUri={form.profilePhotoUri}
        photoName={form.profilePhotoName}
        onSelect={onSelectPhoto}
        onRemove={onRemovePhoto}
      />

      <AuthTextField
        label="Date of birth (optional)"
        value={form.dateOfBirth}
        onChangeText={(value) =>
          onUpdateField("dateOfBirth", formatDateOfBirthInput(value))
        }
        onFocus={() => onFocusField("dateOfBirth")}
        onBlur={() => onBlurField("dateOfBirth")}
        placeholder="DD/MM/YYYY"
        keyboardType="numbers-and-punctuation"
        returnKeyType="next"
        onSubmitEditing={() => line1Ref.current?.focus()}
        focused={focusedField === "dateOfBirth"}
        maxLength={10}
      />

      <SectionHeader
        title="Home address"
        subtitle="Used for local lesson matching and school compliance records."
      />

      <AuthTextField
        label="Street address"
        value={form.address.line1}
        onChangeText={(value) => onUpdateAddress("line1", value)}
        onFocus={() => onFocusField("address.line1")}
        onBlur={() => onBlurField("address.line1")}
        placeholder="12 Park Road"
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={() => line2Ref.current?.focus()}
        focused={focusedField === "address.line1"}
        ref={line1Ref}
      />

      <AuthTextField
        label="Unit / apartment (optional)"
        value={form.address.line2}
        onChangeText={(value) => onUpdateAddress("line2", value)}
        onFocus={() => onFocusField("address.line2")}
        onBlur={() => onBlurField("address.line2")}
        placeholder="Unit 4"
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={() => suburbRef.current?.focus()}
        focused={focusedField === "address.line2"}
        ref={line2Ref}
      />

      <View style={styles.addressRow}>
        <View style={styles.addressSuburb}>
          <AuthTextField
            label="Suburb"
            value={form.address.suburb}
            onChangeText={(value) => onUpdateAddress("suburb", value)}
            onFocus={() => onFocusField("address.suburb")}
            onBlur={() => onBlurField("address.suburb")}
            placeholder="Brisbane"
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => stateRef.current?.focus()}
            focused={focusedField === "address.suburb"}
            ref={suburbRef}
          />
        </View>

        <View style={styles.addressState}>
          <AuthTextField
            label="State"
            value={form.address.state}
            onChangeText={(value) =>
              onUpdateAddress("state", value.toUpperCase())
            }
            onFocus={() => onFocusField("address.state")}
            onBlur={() => onBlurField("address.state")}
            placeholder="QLD"
            autoCapitalize="characters"
            returnKeyType="next"
            onSubmitEditing={() => postcodeRef.current?.focus()}
            focused={focusedField === "address.state"}
            maxLength={3}
            ref={stateRef}
          />
        </View>
      </View>

      <AuthTextField
        label="Postcode"
        value={form.address.postcode}
        onChangeText={(value) =>
          onUpdateAddress("postcode", value.replace(/\D/g, "").slice(0, 4))
        }
        onFocus={() => onFocusField("address.postcode")}
        onBlur={() => onBlurField("address.postcode")}
        placeholder="4000"
        keyboardType="number-pad"
        returnKeyType="next"
        onSubmitEditing={() => emergencyNameRef.current?.focus()}
        focused={focusedField === "address.postcode"}
        maxLength={4}
        ref={postcodeRef}
      />

      <SectionHeader
        title="Emergency contact"
        subtitle="Someone we can reach if something happens during a lesson."
      />

      <AuthTextField
        label="Contact name"
        value={form.emergencyContactName}
        onChangeText={(value) => onUpdateField("emergencyContactName", value)}
        onFocus={() => onFocusField("emergencyContactName")}
        onBlur={() => onBlurField("emergencyContactName")}
        placeholder="Full name"
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={() => emergencyPhoneRef.current?.focus()}
        focused={focusedField === "emergencyContactName"}
        ref={emergencyNameRef}
      />

      <AuthTextField
        label="Contact phone"
        value={form.emergencyContactPhone}
        onChangeText={(value) => onUpdateField("emergencyContactPhone", value)}
        onFocus={() => onFocusField("emergencyContactPhone")}
        onBlur={() => onBlurField("emergencyContactPhone")}
        placeholder="04XX XXX XXX"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        returnKeyType="done"
        focused={focusedField === "emergencyContactPhone"}
        ref={emergencyPhoneRef}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  sectionHeader: {
    gap: 4,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  addressRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  addressSuburb: {
    flex: 2,
  },
  addressState: {
    flex: 1,
  },
});
