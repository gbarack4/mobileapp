import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "@clerk/clerk-expo";

import { AuthTextField } from "../auth/auth-text-field";
import { SelectionPills } from "../onboarding/selection-pills";
import { ChevronLeftIcon } from "../icons/dashboard-icons";
import { colors, spacing } from "../../constants/theme";
import {
  VEHICLE_DUAL_CONTROL_OPTIONS,
  VEHICLE_TRANSMISSION_OPTIONS,
  type InstructorVehicle,
} from "../../data/mock-instructor-vehicle";
import type { TransmissionType, YesNo } from "../../types/onboarding";
import { getMyProfile } from "../../services/profile";

type VehiclesScreenProps = {
  onClose: () => void;
};

type FocusedField = "make" | "model" | "year" | "registration" | null;

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 0, 0, 0.06)" } : undefined;

export function VehiclesScreen({ onClose }: Readonly<VehiclesScreenProps>) {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  const [vehicle, setVehicle] = useState<InstructorVehicle>({
    make: "",
    model: "",
    year: "",
    registration: "",
    transmission: "automatic",
    dualControl: "no",
  });

  const [focusedField, setFocusedField] = useState<FocusedField>(null);
  const [error, setError] = useState<string | null>(null);

  const modelRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);
  const registrationRef = useRef<TextInput>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadVehicleData() {
      try {
        const token = await getToken();
        const profile = await getMyProfile(token);

        if (isMounted && profile?.carDetails) {
          const { carDetails } = profile;

          setVehicle({
            make: carDetails.make || "",
            model: carDetails.model || "",
            year: carDetails.year || "",
            registration: carDetails.registration || "",
            transmission: (carDetails.transmission.toLowerCase() === "manual"
              ? "manual"
              : carDetails.transmission.toLowerCase() === "both"
                ? "both"
                : "automatic") as TransmissionType,
            dualControl: carDetails.dualControl ? "yes" : "no",
          });
        }
      } catch (err) {
        console.error("Failed to load vehicle data", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadVehicleData();

    return () => {
      isMounted = false;
    };
  }, [getToken]);

  function updateField<K extends keyof InstructorVehicle>(
    field: K,
    value: InstructorVehicle[K],
  ) {
    setVehicle((current) => ({ ...current, [field]: value }));
    setError(null);
  }

  function handleSave() {
    if (!vehicle.make.trim()) {
      setError("Enter your vehicle make.");
      return;
    }

    if (!vehicle.model.trim()) {
      setError("Enter your vehicle model.");
      return;
    }

    if (!vehicle.year.trim()) {
      setError("Enter your vehicle year.");
      return;
    }

    if (!vehicle.registration.trim()) {
      setError("Enter your registration number.");
      return;
    }

    // TODO: connect to NestJS instructor vehicle API (PATCH request)
    console.log("Vehicle data to save:", vehicle);
    onClose();
  }

  if (isLoading) {
    return (
      <View style={[styles.screen, styles.loaderContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
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

        <Text style={styles.headerTitle}>Vehicles</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.introTitle}>Teaching vehicle</Text>
        <Text style={styles.introText}>
          Update the car you use for lessons. Schools may show this on your
          instructor profile.
        </Text>

        <View style={styles.form}>
          <AuthTextField
            label="Make"
            value={vehicle.make}
            onChangeText={(value) => updateField("make", value)}
            onFocus={() => setFocusedField("make")}
            onBlur={() =>
              setFocusedField((current) =>
                current === "make" ? null : current,
              )
            }
            onSubmitEditing={() => modelRef.current?.focus()}
            returnKeyType="next"
            placeholder="Ford"
            focused={focusedField === "make"}
          />

          <AuthTextField
            label="Model"
            value={vehicle.model}
            onChangeText={(value) => updateField("model", value)}
            onFocus={() => setFocusedField("model")}
            onBlur={() =>
              setFocusedField((current) =>
                current === "model" ? null : current,
              )
            }
            onSubmitEditing={() => yearRef.current?.focus()}
            returnKeyType="next"
            placeholder="Focus"
            focused={focusedField === "model"}
            ref={modelRef}
          />

          <View style={styles.row}>
            <View style={styles.rowField}>
              <AuthTextField
                label="Year"
                value={vehicle.year}
                onChangeText={(value) => updateField("year", value)}
                onFocus={() => setFocusedField("year")}
                onBlur={() =>
                  setFocusedField((current) =>
                    current === "year" ? null : current,
                  )
                }
                onSubmitEditing={() => registrationRef.current?.focus()}
                returnKeyType="next"
                placeholder="2021"
                keyboardType="number-pad"
                maxLength={4}
                focused={focusedField === "year"}
                ref={yearRef}
              />
            </View>

            <View style={styles.rowFieldWide}>
              <AuthTextField
                label="Registration"
                value={vehicle.registration}
                onChangeText={(value) => updateField("registration", value)}
                onFocus={() => setFocusedField("registration")}
                onBlur={() =>
                  setFocusedField((current) =>
                    current === "registration" ? null : current,
                  )
                }
                returnKeyType="done"
                placeholder="AB21 XYZ"
                autoCapitalize="characters"
                focused={focusedField === "registration"}
                ref={registrationRef}
              />
            </View>
          </View>

          <SelectionPills
            label="Transmission"
            options={VEHICLE_TRANSMISSION_OPTIONS}
            value={vehicle.transmission}
            onChange={(value: TransmissionType) =>
              updateField("transmission", value)
            }
          />

          <SelectionPills
            label="Dual-control vehicle"
            options={VEHICLE_DUAL_CONTROL_OPTIONS}
            value={vehicle.dualControl}
            onChange={(value: YesNo) => updateField("dualControl", value)}
          />
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
          <Text style={styles.saveButtonText}>Save vehicle</Text>
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
  loaderContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  // ... всі інші твої стилі залишаються без змін
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
    flex: 0.8,
  },
  rowFieldWide: {
    flex: 1.2,
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
