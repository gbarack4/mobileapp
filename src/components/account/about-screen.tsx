import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ChevronLeftIcon, ChevronRightIcon } from '../icons/dashboard-icons';
import { colors, spacing } from '../../constants/theme';
import { AboutIcon } from './account-icons';

type AboutScreenProps = {
  onClose: () => void;
};

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 0, 0, 0.06)' } : undefined;

const APP_VERSION = '1.0.0';
const BUILD_LABEL = 'Instructor Hub for Australia';

const LEGAL_LINKS = [
  {
    id: 'terms',
    label: 'Terms of Service',
    url: 'https://instructorhub.com.au/terms',
  },
  {
    id: 'privacy',
    label: 'Privacy Policy',
    url: 'https://instructorhub.com.au/privacy',
  },
  {
    id: 'licenses',
    label: 'Open source licenses',
    url: 'https://instructorhub.com.au/licenses',
  },
  {
    id: 'support',
    label: 'Contact support',
    url: 'mailto:support@instructorhub.com.au',
  },
] as const;

type LinkRowProps = {
  label: string;
  onPress: () => void;
  showDivider?: boolean;
};

function LinkRow({ label, onPress, showDivider = true }: LinkRowProps) {
  return (
    <View>
      <Pressable
        onPress={onPress}
        android_ripple={ANDROID_RIPPLE}
        style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}>
        <Text style={styles.linkLabel}>{label}</Text>
        <ChevronRightIcon size={18} color={colors.textMuted} />
      </Pressable>
      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

async function openLink(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    // Ignore failed opens in local/dev when the URL is unavailable.
  }
}

export function AboutScreen({ onClose }: AboutScreenProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          android_ripple={ANDROID_RIPPLE}
          accessibilityLabel="Back"
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <ChevronLeftIcon size={22} />
        </Pressable>

        <Text style={styles.headerTitle}>About</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.brandCard}>
          <View style={styles.brandIcon}>
            <AboutIcon size={28} color={colors.primary} />
          </View>
          <Text style={styles.brandName}>Instructor Hub</Text>
          <Text style={styles.brandTagline}>
            Tools for driving instructors to manage lessons, schools, availability,
            and payouts in one place.
          </Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Version {APP_VERSION}</Text>
          </View>
          <Text style={styles.buildLabel}>{BUILD_LABEL}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal & support</Text>
          <View style={styles.card}>
            {LEGAL_LINKS.map((link, index) => (
              <LinkRow
                key={link.id}
                label={link.label}
                onPress={() => {
                  void openLink(link.url);
                }}
                showDivider={index < LEGAL_LINKS.length - 1}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.copyright}>
          © {new Date().getFullYear()} Instructor Hub. All rights reserved.
        </Text>
      </View>
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  brandCard: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  brandIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#e8f1ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  brandTagline: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  versionBadge: {
    marginTop: spacing.sm,
    backgroundColor: colors.inputBackground,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  versionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  buildLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
  },
  linkLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg,
  },
  copyright: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
