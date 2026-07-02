import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthTextField } from '../../components/auth/auth-text-field';
import { DocumentUploadField } from '../../components/onboarding/document-upload-field';
import { ProfilePhotoPicker } from '../../components/onboarding/profile-photo-picker';
import { SelectionPills } from '../../components/onboarding/selection-pills';
import { Logo } from '../../components/logo';
import { colors, radius, spacing } from '../../constants/theme';
import {
  type DocumentType,
  INITIAL_ONBOARDING_FORM,
  type OnboardingForm,
  type TransmissionType,
  type YesNo,
} from '../../types/onboarding';

type OnboardingStep = {
  id: string;
  title: string;
  subtitle: string;
};

type FocusedField = string | null;

type PressableState = {
  pressed: boolean;
  hovered?: boolean;
};

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 94, 255, 0.14)' } : undefined;

const STEPS: OnboardingStep[] = [
  {
    id: 'personal',
    title: 'Personal information',
    subtitle: 'Tell us a bit about yourself.',
  },
  {
    id: 'licence',
    title: 'Driver licence',
    subtitle: 'Add your licence details.',
  },
  {
    id: 'professional',
    title: 'Professional information',
    subtitle: 'Share your instructor credentials.',
  },
  {
    id: 'vehicle',
    title: 'Vehicle information',
    subtitle: 'Tell us about the car you teach in.',
  },
  {
    id: 'documents',
    title: 'Documents upload',
    subtitle: 'Upload the required certificates and checks.',
  },
];

const TRANSMISSION_OPTIONS: { value: TransmissionType; label: string }[] = [
  { value: 'automatic', label: 'Automatic' },
  { value: 'manual', label: 'Manual' },
  { value: 'both', label: 'Both' },
];

const YES_NO_OPTIONS: { value: YesNo; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

const DOCUMENT_FIELDS: { type: DocumentType; label: string; hint?: string }[] = [
  { type: 'driverLicence', label: 'Driver licence' },
  { type: 'instructorAccreditation', label: 'Instructor accreditation certificate' },
  { type: 'insuranceCertificate', label: 'Insurance certificate' },
  { type: 'vehicleRegistration', label: 'Vehicle registration' },
  { type: 'workingWithChildrenCheck', label: 'Working with children check', hint: 'If required' },
  { type: 'policeCheck', label: 'Police check', hint: 'If required' },
];

export default function OnboardingScreen() {
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<OnboardingForm>(INITIAL_ONBOARDING_FORM);
  const [focusedField, setFocusedField] = useState<FocusedField>(null);
  const [error, setError] = useState<string | null>(null);

  const addressRef = useRef<TextInput>(null);
  const emergencyNameRef = useRef<TextInput>(null);
  const emergencyPhoneRef = useRef<TextInput>(null);

  const currentStep = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  function updateForm<K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    clearError();
  }

  function clearError() {
    if (error) {
      setError(null);
    }
  }

  function validateStep(): boolean {
    switch (currentStep.id) {
      case 'personal':
        if (!form.address.trim()) {
          setError('Enter your address.');
          return false;
        }
        if (!form.emergencyContactName.trim()) {
          setError('Enter an emergency contact name.');
          return false;
        }
        if (form.emergencyContactPhone.replace(/\D/g, '').length < 7) {
          setError('Enter a valid emergency contact phone number.');
          return false;
        }
        break;
      case 'licence':
        if (!form.driverLicenceNumber.trim()) {
          setError('Enter your driver licence number.');
          return false;
        }
        if (!form.driverLicenceExpiry.trim()) {
          setError('Enter your driver licence expiry date.');
          return false;
        }
        break;
      case 'professional':
        if (!form.instructorAccreditationNumber.trim()) {
          setError('Enter your instructor accreditation number.');
          return false;
        }
        if (!form.accreditationExpiry.trim()) {
          setError('Enter your accreditation expiry date.');
          return false;
        }
        if (!form.yearsOfExperience.trim()) {
          setError('Enter your years of experience.');
          return false;
        }
        if (!form.transmissionType) {
          setError('Select a transmission type.');
          return false;
        }
        if (!form.languagesSpoken.trim()) {
          setError('Enter the languages you speak.');
          return false;
        }
        break;
      case 'vehicle':
        if (!form.vehicleMake.trim()) {
          setError('Enter your vehicle make.');
          return false;
        }
        if (!form.vehicleModel.trim()) {
          setError('Enter your vehicle model.');
          return false;
        }
        if (!form.vehicleYear.trim()) {
          setError('Enter your vehicle year.');
          return false;
        }
        if (!form.registrationNumber.trim()) {
          setError('Enter your registration number.');
          return false;
        }
        if (!form.vehicleTransmission) {
          setError('Select your vehicle transmission.');
          return false;
        }
        if (!form.dualControlVehicle) {
          setError('Indicate if your vehicle is dual-control.');
          return false;
        }
        break;
      case 'documents':
        if (!form.documents.driverLicence) {
          setError('Upload your driver licence.');
          return false;
        }
        if (!form.documents.instructorAccreditation) {
          setError('Upload your instructor accreditation certificate.');
          return false;
        }
        if (!form.documents.insuranceCertificate) {
          setError('Upload your insurance certificate.');
          return false;
        }
        if (!form.documents.vehicleRegistration) {
          setError('Upload your vehicle registration.');
          return false;
        }
        break;
      default:
        break;
    }

    setError(null);
    return true;
  }

  function handleBack() {
    if (stepIndex === 0) {
      return;
    }

    setError(null);
    setStepIndex((current) => current - 1);
  }

  function handleNext() {
    if (!validateStep()) {
      return;
    }

    if (isLastStep) {
    // TODO: connect to NestJS onboarding API
    router.replace('/dashboard');
      return;
    }

    setStepIndex((current) => current + 1);
  }

  function handleMockPhotoSelect() {
    updateForm('profilePhotoUri', 'profile-photo.jpg');
  }

  function handleMockDocumentUpload(type: DocumentType) {
    const fileName = `${type}.pdf`;
    setForm((current) => ({
      ...current,
      documents: { ...current.documents, [type]: fileName },
    }));
    clearError();
  }

  function renderPersonalStep() {
    return (
      <>
        <ProfilePhotoPicker photoUri={form.profilePhotoUri} onPress={handleMockPhotoSelect} />

        <AuthTextField
          label="Date of birth (optional)"
          value={form.dateOfBirth}
          onChangeText={(value) => updateForm('dateOfBirth', value)}
          onFocus={() => setFocusedField('dateOfBirth')}
          onBlur={() => setFocusedField((current) => (current === 'dateOfBirth' ? null : current))}
          placeholder="DD/MM/YYYY"
          keyboardType="numbers-and-punctuation"
          returnKeyType="next"
          onSubmitEditing={() => addressRef.current?.focus()}
          focused={focusedField === 'dateOfBirth'}
        />

        <AuthTextField
          label="Address"
          value={form.address}
          onChangeText={(value) => updateForm('address', value)}
          onFocus={() => setFocusedField('address')}
          onBlur={() => setFocusedField((current) => (current === 'address' ? null : current))}
          placeholder="Street, suburb, state, postcode"
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => emergencyNameRef.current?.focus()}
          focused={focusedField === 'address'}
          ref={addressRef}
        />

        <AuthTextField
          label="Emergency contact name"
          value={form.emergencyContactName}
          onChangeText={(value) => updateForm('emergencyContactName', value)}
          onFocus={() => setFocusedField('emergencyContactName')}
          onBlur={() =>
            setFocusedField((current) => (current === 'emergencyContactName' ? null : current))
          }
          placeholder="Full name"
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => emergencyPhoneRef.current?.focus()}
          focused={focusedField === 'emergencyContactName'}
          ref={emergencyNameRef}
        />

        <AuthTextField
          label="Emergency contact phone"
          value={form.emergencyContactPhone}
          onChangeText={(value) => updateForm('emergencyContactPhone', value)}
          onFocus={() => setFocusedField('emergencyContactPhone')}
          onBlur={() =>
            setFocusedField((current) => (current === 'emergencyContactPhone' ? null : current))
          }
          placeholder="Phone number"
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          returnKeyType="done"
          focused={focusedField === 'emergencyContactPhone'}
          ref={emergencyPhoneRef}
        />
      </>
    );
  }

  function renderLicenceStep() {
    return (
      <>
        <AuthTextField
          label="Driver licence number"
          value={form.driverLicenceNumber}
          onChangeText={(value) => updateForm('driverLicenceNumber', value)}
          onFocus={() => setFocusedField('driverLicenceNumber')}
          onBlur={() =>
            setFocusedField((current) => (current === 'driverLicenceNumber' ? null : current))
          }
          placeholder="Licence number"
          autoCapitalize="characters"
          returnKeyType="next"
          focused={focusedField === 'driverLicenceNumber'}
        />

        <AuthTextField
          label="Driver licence expiry date"
          value={form.driverLicenceExpiry}
          onChangeText={(value) => updateForm('driverLicenceExpiry', value)}
          onFocus={() => setFocusedField('driverLicenceExpiry')}
          onBlur={() =>
            setFocusedField((current) => (current === 'driverLicenceExpiry' ? null : current))
          }
          placeholder="DD/MM/YYYY"
          keyboardType="numbers-and-punctuation"
          returnKeyType="done"
          focused={focusedField === 'driverLicenceExpiry'}
        />
      </>
    );
  }

  function renderProfessionalStep() {
    return (
      <>
        <AuthTextField
          label="Instructor accreditation number"
          value={form.instructorAccreditationNumber}
          onChangeText={(value) => updateForm('instructorAccreditationNumber', value)}
          onFocus={() => setFocusedField('instructorAccreditationNumber')}
          onBlur={() =>
            setFocusedField((current) =>
              current === 'instructorAccreditationNumber' ? null : current,
            )
          }
          placeholder="Accreditation number"
          autoCapitalize="characters"
          returnKeyType="next"
          focused={focusedField === 'instructorAccreditationNumber'}
        />

        <AuthTextField
          label="Accreditation expiry date"
          value={form.accreditationExpiry}
          onChangeText={(value) => updateForm('accreditationExpiry', value)}
          onFocus={() => setFocusedField('accreditationExpiry')}
          onBlur={() =>
            setFocusedField((current) => (current === 'accreditationExpiry' ? null : current))
          }
          placeholder="DD/MM/YYYY"
          keyboardType="numbers-and-punctuation"
          returnKeyType="next"
          focused={focusedField === 'accreditationExpiry'}
        />

        <AuthTextField
          label="Years of experience"
          value={form.yearsOfExperience}
          onChangeText={(value) => updateForm('yearsOfExperience', value)}
          onFocus={() => setFocusedField('yearsOfExperience')}
          onBlur={() =>
            setFocusedField((current) => (current === 'yearsOfExperience' ? null : current))
          }
          placeholder="e.g. 5"
          keyboardType="number-pad"
          returnKeyType="next"
          focused={focusedField === 'yearsOfExperience'}
        />

        <SelectionPills
          label="Transmission type"
          options={TRANSMISSION_OPTIONS}
          value={form.transmissionType}
          onChange={(value) => updateForm('transmissionType', value)}
        />

        <AuthTextField
          label="Languages spoken"
          value={form.languagesSpoken}
          onChangeText={(value) => updateForm('languagesSpoken', value)}
          onFocus={() => setFocusedField('languagesSpoken')}
          onBlur={() =>
            setFocusedField((current) => (current === 'languagesSpoken' ? null : current))
          }
          placeholder="e.g. English, Mandarin"
          autoCapitalize="words"
          returnKeyType="next"
          focused={focusedField === 'languagesSpoken'}
        />

        <AuthTextField
          label="Bio / About me"
          value={form.bio}
          onChangeText={(value) => updateForm('bio', value)}
          onFocus={() => setFocusedField('bio')}
          onBlur={() => setFocusedField((current) => (current === 'bio' ? null : current))}
          placeholder="Tell students about your teaching style"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={styles.bioInput}
          returnKeyType="done"
          focused={focusedField === 'bio'}
        />
      </>
    );
  }

  function renderVehicleStep() {
    return (
      <>
        <AuthTextField
          label="Vehicle make"
          value={form.vehicleMake}
          onChangeText={(value) => updateForm('vehicleMake', value)}
          onFocus={() => setFocusedField('vehicleMake')}
          onBlur={() => setFocusedField((current) => (current === 'vehicleMake' ? null : current))}
          placeholder="e.g. Toyota"
          autoCapitalize="words"
          returnKeyType="next"
          focused={focusedField === 'vehicleMake'}
        />

        <AuthTextField
          label="Vehicle model"
          value={form.vehicleModel}
          onChangeText={(value) => updateForm('vehicleModel', value)}
          onFocus={() => setFocusedField('vehicleModel')}
          onBlur={() => setFocusedField((current) => (current === 'vehicleModel' ? null : current))}
          placeholder="e.g. Corolla"
          autoCapitalize="words"
          returnKeyType="next"
          focused={focusedField === 'vehicleModel'}
        />

        <AuthTextField
          label="Vehicle year"
          value={form.vehicleYear}
          onChangeText={(value) => updateForm('vehicleYear', value)}
          onFocus={() => setFocusedField('vehicleYear')}
          onBlur={() => setFocusedField((current) => (current === 'vehicleYear' ? null : current))}
          placeholder="e.g. 2022"
          keyboardType="number-pad"
          returnKeyType="next"
          focused={focusedField === 'vehicleYear'}
        />

        <AuthTextField
          label="Registration number"
          value={form.registrationNumber}
          onChangeText={(value) => updateForm('registrationNumber', value)}
          onFocus={() => setFocusedField('registrationNumber')}
          onBlur={() =>
            setFocusedField((current) => (current === 'registrationNumber' ? null : current))
          }
          placeholder="Registration plate"
          autoCapitalize="characters"
          returnKeyType="next"
          focused={focusedField === 'registrationNumber'}
        />

        <SelectionPills
          label="Vehicle transmission"
          options={TRANSMISSION_OPTIONS}
          value={form.vehicleTransmission}
          onChange={(value) => updateForm('vehicleTransmission', value)}
        />

        <SelectionPills
          label="Dual-control vehicle"
          options={YES_NO_OPTIONS}
          value={form.dualControlVehicle}
          onChange={(value) => updateForm('dualControlVehicle', value)}
        />
      </>
    );
  }

  function renderDocumentsStep() {
    return (
      <>
        {DOCUMENT_FIELDS.map((document) => (
          <DocumentUploadField
            key={document.type}
            label={document.label}
            hint={document.hint}
            fileName={form.documents[document.type]}
            onPress={() => handleMockDocumentUpload(document.type)}
          />
        ))}
      </>
    );
  }

  function renderStepContent() {
    switch (currentStep.id) {
      case 'personal':
        return renderPersonalStep();
      case 'licence':
        return renderLicenceStep();
      case 'professional':
        return renderProfessionalStep();
      case 'vehicle':
        return renderVehicleStep();
      case 'documents':
        return renderDocumentsStep();
      default:
        return null;
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Logo size={48} />
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.stepCounter}>
              Step {stepIndex + 1} of {STEPS.length}
            </Text>
            <Text style={styles.title}>{currentStep.title}</Text>
            <Text style={styles.subtitle}>{currentStep.subtitle}</Text>
          </View>

          <View style={styles.form}>{renderStepContent()}</View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.footer}>
            {stepIndex > 0 ? (
              <Pressable
                onPress={handleBack}
                android_ripple={ANDROID_RIPPLE}
                style={({ pressed, hovered }: PressableState) => [
                  styles.secondaryButton,
                  hovered && !pressed && styles.secondaryButtonHovered,
                  pressed && styles.buttonPressed,
                ]}>
                <Text style={styles.secondaryButtonText}>Back</Text>
              </Pressable>
            ) : (
              <View style={styles.footerSpacer} />
            )}

            <Pressable
              onPress={handleNext}
              android_ripple={ANDROID_RIPPLE}
              style={({ pressed, hovered }: PressableState) => [
                styles.primaryButton,
                hovered && !pressed && styles.primaryButtonHovered,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.primaryButtonText}>{isLastStep ? 'Complete setup' : 'Continue'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.inputBackground,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  stepCounter: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    gap: spacing.lg,
  },
  bioInput: {
    minHeight: 112,
    paddingTop: spacing.md,
  },
  error: {
    color: colors.error,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  footerSpacer: {
    flex: 1,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? ({ outlineStyle: 'none', transition: 'background-color 0.15s ease' } as object)
      : {}),
  },
  primaryButtonHovered: {
    backgroundColor: colors.primaryHover,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? ({ outlineStyle: 'none', transition: 'background-color 0.15s ease' } as object)
      : {}),
  },
  secondaryButtonHovered: {
    backgroundColor: colors.inputBackgroundHover,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
