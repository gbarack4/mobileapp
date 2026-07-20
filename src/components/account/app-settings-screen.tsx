import { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ChevronLeftIcon } from '../icons/dashboard-icons';
import { colors, spacing } from '../../constants/theme';
import {
  getAppSettings,
  setAppSettings,
  subscribeAppSettings,
  type AppSettings,
  type DistanceUnit,
  type TimeFormat,
} from '../../services/app-settings';
import { BlueToggle } from './blue-toggle';

type AppSettingsScreenProps = {
  onClose: () => void;
};

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 0, 0, 0.06)' } : undefined;

type ToggleRowProps = {
  label: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  showDivider?: boolean;
};

function ToggleRow({
  label,
  subtitle,
  value,
  onValueChange,
  showDivider = true,
}: ToggleRowProps) {
  return (
    <View>
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowLabel}>{label}</Text>
          <Text style={styles.rowSubtitle}>{subtitle}</Text>
        </View>
        <BlueToggle
          value={value}
          onValueChange={onValueChange}
          accessibilityLabel={label}
        />
      </View>
      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

type ChoicePillProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function ChoicePill({ label, selected, onPress }: ChoicePillProps) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={ANDROID_RIPPLE}
      style={({ pressed }) => [
        styles.pill,
        selected && styles.pillSelected,
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function AppSettingsScreen({ onClose }: AppSettingsScreenProps) {
  const [settings, setSettings] = useState<AppSettings>(() => getAppSettings());

  useEffect(() => {
    return subscribeAppSettings(() => {
      setSettings(getAppSettings());
    });
  }, []);

  function updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setAppSettings({ [key]: value });
    setSettings(getAppSettings());
  }

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

        <Text style={styles.headerTitle}>App Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>
          Control notifications and how times and distances appear in Instructor Hub.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <ToggleRow
              label="Push notifications"
              subtitle="Allow alerts from Instructor Hub on this device"
              value={settings.pushNotifications}
              onValueChange={(value) => updateSetting('pushNotifications', value)}
            />
            <ToggleRow
              label="Lesson reminders"
              subtitle="Get reminded before upcoming lessons"
              value={settings.lessonReminders}
              onValueChange={(value) => updateSetting('lessonReminders', value)}
            />
            <ToggleRow
              label="Booking alerts"
              subtitle="New bookings, cancellations, and changes"
              value={settings.bookingAlerts}
              onValueChange={(value) => updateSetting('bookingAlerts', value)}
            />
            <ToggleRow
              label="Payment alerts"
              subtitle="Payouts, failed charges, and Stripe updates"
              value={settings.paymentAlerts}
              onValueChange={(value) => updateSetting('paymentAlerts', value)}
              showDivider={false}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display</Text>
          <View style={styles.card}>
            <View style={styles.choiceBlock}>
              <Text style={styles.rowLabel}>Distance</Text>
              <Text style={styles.rowSubtitle}>Used for travel estimates and maps</Text>
              <View style={styles.pillRow}>
                {([
                  { id: 'km' as DistanceUnit, label: 'Kilometres' },
                  { id: 'mi' as DistanceUnit, label: 'Miles' },
                ]).map((option) => (
                  <ChoicePill
                    key={option.id}
                    label={option.label}
                    selected={settings.distanceUnit === option.id}
                    onPress={() => updateSetting('distanceUnit', option.id)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.choiceBlock}>
              <Text style={styles.rowLabel}>Time format</Text>
              <Text style={styles.rowSubtitle}>How lesson times are shown</Text>
              <View style={styles.pillRow}>
                {([
                  { id: '12h' as TimeFormat, label: '12-hour' },
                  { id: '24h' as TimeFormat, label: '24-hour' },
                ]).map((option) => (
                  <ChoicePill
                    key={option.id}
                    label={option.label}
                    selected={settings.timeFormat === option.id}
                    onPress={() => updateSetting('timeFormat', option.id)}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this app</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.rowLabel}>Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
            <View style={styles.divider} />
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <Text style={styles.rowLabel}>Region</Text>
              <Text style={styles.infoValue}>Australia</Text>
            </View>
          </View>
        </View>
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
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  rowSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg,
  },
  choiceBlock: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 4,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.inputBackground,
  },
  pillSelected: {
    backgroundColor: colors.primary,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  pillTextSelected: {
    color: colors.white,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  infoRowLast: {
    paddingBottom: spacing.md,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.85,
  },
});
