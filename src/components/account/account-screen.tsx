import { useAuth, useClerk, useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
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
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import { CloseIcon } from '../icons/lesson-detail-icons';
import {
  ACCOUNT_MENU_SECTION_1,
  ACCOUNT_MENU_SECTION_2,
  ACCOUNT_MENU_SECTION_3,
  type InstructorProfile,
  MOCK_INSTRUCTOR_PROFILE,
} from '../../data/mock-account';
import { colors, spacing } from '../../constants/theme';
import { getMyProfile } from '../../services/profile';
import { clearSession, getSessionEmail, setSessionEmail } from '../../services/session';
import {
  AboutIcon,
  AppSettingsIcon,
  AvailabilityIcon,
  DocumentsIcon,
  EditAddressIcon,
  InsuranceIcon,
  ManageAccountIcon,
  PaymentIcon,
  PrivacyIcon,
  VehiclesIcon,
} from './account-icons';
import { AccountMenuRow } from './account-menu-row';
import { StarIcon } from './hub-account-icons';

type AccountScreenProps = {
  onClose?: () => void;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 0, 0, 0.06)' } : undefined;

const SECTION_1_ICONS = {
  vehicles: VehiclesIcon,
  documents: DocumentsIcon,
  payment: PaymentIcon,
  availability: AvailabilityIcon,
} as const;

const SECTION_2_ICONS = {
  'manage-account': ManageAccountIcon,
  'edit-address': EditAddressIcon,
  insurance: InsuranceIcon,
} as const;

const SECTION_3_ICONS = {
  privacy: PrivacyIcon,
  'app-settings': AppSettingsIcon,
  about: AboutIcon,
} as const;

function formatRating(rating: number) {
  return Number.isInteger(rating) ? String(rating) : rating.toFixed(1);
}

function handleMenuPress(itemId: string) {
  if (itemId === 'vehicles') {
    router.push('/dashboard/account/vehicles');
    return;
  }

  if (itemId === 'documents') {
    router.push('/dashboard/account/documents');
    return;
  }

  if (itemId === 'manage-account') {
    router.push('/dashboard/account/hub');
    return;
  }

  if (itemId === 'availability') {
    router.push('/dashboard/account/availability');
    return;
  }

  if (itemId === 'payment') {
    router.push('/dashboard/account/payment');
    return;
  }

  if (itemId === 'edit-address') {
    router.push('/dashboard/account/edit-address');
    return;
  }

  // TODO: connect to account routes / NestJS API
  void itemId;
}

function buildFallbackProfile(email?: string | null): InstructorProfile {
  const resolvedEmail = email || getSessionEmail();
  if (!resolvedEmail) {
    return {
      name: 'Instructor',
      initials: '?',
      subtitle: 'Sign in to load your profile',
      email: '',
      rating: 0,
      vehicleSummary: MOCK_INSTRUCTOR_PROFILE.vehicleSummary,
    };
  }

  return {
    name: resolvedEmail.split('@')[0] || 'Instructor',
    initials: (resolvedEmail[0] ?? '?').toUpperCase(),
    subtitle: 'Complete your profile',
    email: resolvedEmail,
    rating: 0,
    vehicleSummary: '',
  };
}

export function AccountScreen({ onClose, onScroll }: AccountScreenProps) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? null;
  const [profile, setProfile] = useState<InstructorProfile>(() =>
    buildFallbackProfile(userEmail),
  );
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    if (userEmail) {
      setSessionEmail(userEmail);
    }
  }, [userEmail]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setIsLoadingProfile(true);

      try {
        const token = await getToken();
        const remoteProfile = await getMyProfile(token);
        if (!cancelled && remoteProfile) {
          setProfile(remoteProfile);
          return;
        }

        if (!cancelled) {
          setProfile(buildFallbackProfile(userEmail));
        }
      } catch {
        if (!cancelled) {
          setProfile(buildFallbackProfile(userEmail));
        }
      } finally {
        if (!cancelled) {
          setIsLoadingProfile(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [getToken, userEmail]);

  async function handleSignOut() {
    clearSession();
    try {
      await signOut();
    } finally {
      router.replace('/login');
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={8}>
        {onClose ? (
          <Pressable
            onPress={onClose}
            hitSlop={8}
            android_ripple={ANDROID_RIPPLE}
            accessibilityLabel="Close"
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
            <CloseIcon size={22} />
          </Pressable>
        ) : null}

        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            {isLoadingProfile ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.avatarText}>{profile.initials}</Text>
            )}
          </View>

          <View style={styles.profileText}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>{profile.name}</Text>
              {profile.rating > 0 ? (
                <View style={styles.ratingBadge}>
                  <StarIcon size={11} />
                  <Text style={styles.ratingText}>{formatRating(profile.rating)}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.profileSubtitle}>{profile.subtitle}</Text>
            <Text style={styles.profileEmail}>{profile.email}</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          {ACCOUNT_MENU_SECTION_1.map((item, index) => {
            const Icon = SECTION_1_ICONS[item.id as keyof typeof SECTION_1_ICONS];

            return (
              <AccountMenuRow
                key={item.id}
                label={item.label}
                subtitle={item.subtitle}
                icon={<Icon />}
                onPress={() => handleMenuPress(item.id)}
                showDivider={index < ACCOUNT_MENU_SECTION_1.length - 1}
              />
            );
          })}
        </View>

        <View style={styles.sectionSeparator} />

        <View style={styles.menuSection}>
          {ACCOUNT_MENU_SECTION_2.map((item, index) => {
            const Icon = SECTION_2_ICONS[item.id as keyof typeof SECTION_2_ICONS];

            return (
              <AccountMenuRow
                key={item.id}
                label={item.label}
                icon={<Icon />}
                onPress={() => handleMenuPress(item.id)}
                showDivider={index < ACCOUNT_MENU_SECTION_2.length - 1}
              />
            );
          })}
        </View>

        <View style={styles.sectionSeparator} />

        <View style={styles.menuSection}>
          {ACCOUNT_MENU_SECTION_3.map((item, index) => {
            const Icon = SECTION_3_ICONS[item.id as keyof typeof SECTION_3_ICONS];

            return (
              <AccountMenuRow
                key={item.id}
                label={item.label}
                icon={<Icon />}
                onPress={() => handleMenuPress(item.id)}
                showDivider={index < ACCOUNT_MENU_SECTION_3.length - 1}
              />
            );
          })}
        </View>

        <Pressable
          onPress={() => {
            void handleSignOut();
          }}
          android_ripple={ANDROID_RIPPLE}
          style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xl - 8,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e8f1ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  profileText: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  profileSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  profileEmail: {
    fontSize: 13,
    color: colors.textMuted,
  },
  menuSection: {
    backgroundColor: colors.background,
  },
  sectionSeparator: {
    height: 10,
    backgroundColor: '#f3f4f6',
    marginVertical: spacing.sm,
  },
  signOutButton: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? ({ outlineStyle: 'none', transition: 'opacity 0.15s ease' } as object)
      : {}),
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.error,
  },
  pressed: {
    opacity: 0.85,
  },
});
