import { useAuth, useUser } from '@clerk/clerk-expo';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AuthTextField } from '../auth/auth-text-field';
import { ChevronLeftIcon } from '../icons/dashboard-icons';
import { colors, spacing } from '../../constants/theme';
import {
  getMyAccountProfile,
  ProfileApiError,
  updateMyAccountProfile,
} from '../../services/profile';
import { getSessionEmail, setSessionEmail } from '../../services/session';

type HubPersonalInfoScreenProps = {
  onBack: () => void;
};

type FocusedField = 'firstName' | 'lastName' | 'phone' | 'address' | null;

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 0, 0, 0.06)' } : undefined;

export function HubPersonalInfoScreen({ onBack }: HubPersonalInfoScreenProps) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const clerkEmail = user?.primaryEmailAddress?.emailAddress ?? null;

  const [email, setEmail] = useState(clerkEmail || getSessionEmail() || '');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [focusedField, setFocusedField] = useState<FocusedField>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (clerkEmail) {
      setSessionEmail(clerkEmail);
      setEmail(clerkEmail);
    }
  }, [clerkEmail]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const token = await getToken();
        const profile = await getMyAccountProfile(token);

        if (cancelled) {
          return;
        }

        if (!profile) {
          setError('No profile found in the database yet. Sign in with an existing account email.');
          return;
        }

        setEmail(profile.email);
        setFirstName(profile.firstName ?? '');
        setLastName(profile.lastName ?? '');
        setPhone(profile.phone ?? '');
        setAddress(profile.address ?? '');
        setSessionEmail(profile.email);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ProfileApiError
              ? err.message
              : 'Unable to load personal info from the database.',
          );
        }
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
  }, [getToken]);

  async function handleSave() {
    if (isSaving) {
      return;
    }

    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const token = await getToken();
      const profile = await updateMyAccountProfile(
        {
          firstName,
          lastName,
          phoneNumber: phone,
          address,
        },
        token,
      );

      setEmail(profile.email);
      setFirstName(profile.firstName ?? '');
      setLastName(profile.lastName ?? '');
      setPhone(profile.phone ?? '');
      setAddress(profile.address ?? '');
      setSessionEmail(profile.email);
      setSuccess('Personal info saved.');
    } catch (err) {
      setError(
        err instanceof ProfileApiError
          ? err.message
          : 'Unable to save personal info. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          hitSlop={8}
          android_ripple={ANDROID_RIPPLE}
          accessibilityLabel="Back"
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <ChevronLeftIcon size={22} />
        </Pressable>

        <Text style={styles.headerTitle}>Personal info</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>
          Info about you and your preferences across InstructorHub services. Some details may be
          visible to schools you work with.
        </Text>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.metaText}>Loading from database…</Text>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Basic info</Text>

            <AuthTextField
              label="First name"
              value={firstName}
              onChangeText={setFirstName}
              onFocus={() => setFocusedField('firstName')}
              onBlur={() => setFocusedField(null)}
              focused={focusedField === 'firstName'}
              autoCapitalize="words"
              editable={!isSaving}
            />

            <AuthTextField
              label="Last name"
              value={lastName}
              onChangeText={setLastName}
              onFocus={() => setFocusedField('lastName')}
              onBlur={() => setFocusedField(null)}
              focused={focusedField === 'lastName'}
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
              onFocus={() => setFocusedField('phone')}
              onBlur={() => setFocusedField(null)}
              focused={focusedField === 'phone'}
              keyboardType="phone-pad"
              editable={!isSaving}
            />

            <Text style={styles.sectionTitle}>Contact info</Text>

            <AuthTextField
              label="Address"
              value={address}
              onChangeText={setAddress}
              onFocus={() => setFocusedField('address')}
              onBlur={() => setFocusedField(null)}
              focused={focusedField === 'address'}
              autoCapitalize="words"
              editable={!isSaving}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {success ? <Text style={styles.successText}>{success}</Text> : null}

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
              ]}>
              {isSaving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>Save changes</Text>
              )}
            </Pressable>
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
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
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: spacing.sm,
  },
  centered: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  metaText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
  },
  successText: {
    fontSize: 14,
    color: '#15803d',
  },
  saveButton: {
    marginTop: spacing.sm,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});
