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
import { ConfirmedPopup } from '../../components/confirmed-popup';
import { LockIcon } from '../../components/icons/auth-icons';
import { Logo } from '../../components/logo';
import { colors, radius, spacing } from '../../constants/theme';
import { isValidPassword } from '../../utils/validation';

type SignUpField =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'password';

type PressableState = {
  pressed: boolean;
  hovered?: boolean;
};

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 94, 255, 0.14)' } : undefined;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CREATING_ACCOUNT_MS = 2000;

type SignUpPhase = 'form' | 'submitting' | 'confirmed';

export default function SignUpScreen() {
  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [focusedField, setFocusedField] = useState<SignUpField | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<SignUpPhase>('form');

  function clearError() {
    if (error) {
      setError(null);
    }
  }

  async function handleSignUp() {
    if (phase !== 'form') {
      return;
    }

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedFirstName) {
      setError('Enter your first name.');
      return;
    }

    if (!trimmedLastName) {
      setError('Enter your last name.');
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    if (trimmedPhone.replace(/\D/g, '').length < 7) {
      setError('Enter a valid phone number.');
      return;
    }

    if (!isValidPassword(password)) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (!agreedToTerms) {
      setError('You must agree to the Terms and Privacy Policy.');
      return;
    }

    setError(null);
    setPhase('submitting');

    try {
      await new Promise((resolve) => setTimeout(resolve, CREATING_ACCOUNT_MS));
      // TODO: connect to NestJS sign-up API
      setPhase('confirmed');
    } catch {
      setPhase('form');
      setError('Unable to create account. Please try again.');
    }
  }

  function handleSuccessClose() {
    router.push('/onboarding');
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {phase === 'confirmed' ? (
        <ConfirmedPopup
          title="Account created"
          message="Your InstructorHub account is ready. Let's finish setting up your instructor profile."
          actionLabel="Set up profile"
          onClose={handleSuccessClose}
        />
      ) : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Logo size={64} />
            <Text style={styles.title}>Create your InstructorHub account</Text>
          </View>

          <View style={styles.form}>
            <AuthTextField
              label="First name"
              value={firstName}
              onChangeText={(value) => {
                setFirstName(value);
                clearError();
              }}
              onFocus={() => setFocusedField('firstName')}
              onBlur={() => setFocusedField((current) => (current === 'firstName' ? null : current))}
              placeholder="First name"
              autoCapitalize="words"
              autoCorrect={false}
              textContentType="givenName"
              autoComplete="given-name"
              returnKeyType="next"
              onSubmitEditing={() => lastNameRef.current?.focus()}
              focused={focusedField === 'firstName'}
            />

            <AuthTextField
              label="Last name"
              value={lastName}
              onChangeText={(value) => {
                setLastName(value);
                clearError();
              }}
              onFocus={() => setFocusedField('lastName')}
              onBlur={() => setFocusedField((current) => (current === 'lastName' ? null : current))}
              placeholder="Last name"
              autoCapitalize="words"
              autoCorrect={false}
              textContentType="familyName"
              autoComplete="family-name"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              focused={focusedField === 'lastName'}
              ref={lastNameRef}
            />

            <AuthTextField
              label="Email"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                clearError();
              }}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField((current) => (current === 'email' ? null : current))}
              placeholder="Email"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
              focused={focusedField === 'email'}
              ref={emailRef}
            />

            <AuthTextField
              label="Phone number"
              value={phone}
              onChangeText={(value) => {
                setPhone(value);
                clearError();
              }}
              onFocus={() => setFocusedField('phone')}
              onBlur={() => setFocusedField((current) => (current === 'phone' ? null : current))}
              placeholder="Phone number"
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              focused={focusedField === 'phone'}
              ref={phoneRef}
            />

            <AuthTextField
              label="Password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                clearError();
              }}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField((current) => (current === 'password' ? null : current))}
              placeholder="Password"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              autoComplete="new-password"
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
              focused={focusedField === 'password'}
              icon={<LockIcon />}
              ref={passwordRef}
            />

            <Pressable
              onPress={() => {
                setAgreedToTerms((current) => !current);
                clearError();
              }}
              android_ripple={ANDROID_RIPPLE}
              style={styles.termsRow}>
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                {agreedToTerms ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.termsLink}>Terms</Text> &{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              onPress={handleSignUp}
              disabled={phase === 'submitting'}
              android_ripple={ANDROID_RIPPLE}
              style={({ pressed, hovered }: PressableState) => [
                styles.primaryButton,
                phase === 'submitting' && styles.primaryButtonDisabled,
                hovered && phase === 'form' && !pressed && styles.primaryButtonHovered,
                pressed && phase === 'form' && styles.buttonPressed,
              ]}>
              <Text style={styles.primaryButtonText}>
                {phase === 'submitting' ? 'Creating account....' : 'Create account'}
              </Text>
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
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    gap: spacing.xl,
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  form: {
    gap: spacing.lg,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  error: {
    color: colors.error,
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: spacing.sm,
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
  primaryButtonDisabled: {
    opacity: 0.85,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
