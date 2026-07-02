import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChevronLeftIcon } from '../icons/dashboard-icons';
import {
  HUB_PERSONAL_INFO_SECTIONS,
  HUB_PRIVACY_SECTIONS,
  HUB_SECURITY_SECTIONS,
  type HubQuickLinkId,
  type HubSettingItem,
  type HubSettingsSection,
} from '../../data/mock-hub-account';
import { colors, spacing } from '../../constants/theme';
import { HubSettingsRow } from './hub-settings-row';

type HubQuickLinkScreenProps = {
  screen: HubQuickLinkId;
  onBack: () => void;
};

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 0, 0, 0.06)' } : undefined;

const HUB_QUICK_LINKS_LABELS: Record<HubQuickLinkId, string> = {
  'personal-info': 'Personal info',
  security: 'Security',
  'privacy-data': 'Privacy & data',
};

const SCREEN_COPY: Record<
  HubQuickLinkId,
  { description: string; sections: HubSettingsSection[] }
> = {
  'personal-info': {
    description:
      'Info about you and your preferences across InstructorHub services. Some details may be visible to schools you work with.',
    sections: HUB_PERSONAL_INFO_SECTIONS,
  },
  security: {
    description:
      'Settings and recommendations to help keep your account secure. Manage how you sign in and monitor recent activity.',
    sections: HUB_SECURITY_SECTIONS,
  },
  'privacy-data': {
    description:
      'Manage how your data is used in InstructorHub. You can control visibility, sharing, and download or delete your data.',
    sections: HUB_PRIVACY_SECTIONS,
  },
};

function HubSettingsSections({
  sections,
  toggleState,
  onToggle,
  onRowPress,
}: {
  sections: HubSettingsSection[];
  toggleState: Record<string, boolean>;
  onToggle: (id: string, enabled: boolean) => void;
  onRowPress: (item: HubSettingItem) => void;
}) {
  return (
    <>
      {sections.map((section, sectionIndex) => (
        <View key={section.title ?? `section-${sectionIndex}`} style={styles.section}>
          {section.title ? <Text style={styles.sectionTitle}>{section.title}</Text> : null}

          <View style={styles.sectionCard}>
            {section.rows.map((row, rowIndex) => (
              <HubSettingsRow
                key={row.id}
                label={row.label}
                value={row.value}
                subtitle={row.subtitle}
                toggle={row.toggle}
                enabled={row.toggle ? (toggleState[row.id] ?? row.enabled ?? false) : false}
                destructive={row.destructive}
                onPress={() => onRowPress(row)}
                onToggle={(enabled) => onToggle(row.id, enabled)}
                showDivider={rowIndex < section.rows.length - 1}
              />
            ))}
          </View>
        </View>
      ))}
    </>
  );
}

function HubQuickLinkSettingsScreen({ screen, onBack }: HubQuickLinkScreenProps) {
  const copy = SCREEN_COPY[screen];
  const title = HUB_QUICK_LINKS_LABELS[screen];
  const [toggleState, setToggleState] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};

    for (const section of copy.sections) {
      for (const row of section.rows) {
        if (row.toggle) {
          initial[row.id] = row.enabled ?? false;
        }
      }
    }

    return initial;
  });

  function handleRowPress(item: HubSettingItem) {
    // TODO: connect to NestJS hub account settings API
    void item;
  }

  function handleToggle(id: string, enabled: boolean) {
    setToggleState((current) => ({ ...current, [id]: enabled }));
    // TODO: connect to NestJS hub account settings API
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

        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>{copy.description}</Text>

        <HubSettingsSections
          sections={copy.sections}
          toggleState={toggleState}
          onToggle={handleToggle}
          onRowPress={handleRowPress}
        />
      </ScrollView>
    </View>
  );
}

export function HubPersonalInfoScreen({ onBack }: { onBack: () => void }) {
  return <HubQuickLinkSettingsScreen screen="personal-info" onBack={onBack} />;
}

export function HubSecurityScreen({ onBack }: { onBack: () => void }) {
  return <HubQuickLinkSettingsScreen screen="security" onBack={onBack} />;
}

export function HubPrivacyDataScreen({ onBack }: { onBack: () => void }) {
  return <HubQuickLinkSettingsScreen screen="privacy-data" onBack={onBack} />;
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
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    paddingHorizontal: spacing.xl,
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
    paddingHorizontal: spacing.xl,
  },
  sectionCard: {
    backgroundColor: colors.background,
  },
  pressed: {
    opacity: 0.85,
  },
});
