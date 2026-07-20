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
  getInsuranceDeclaration,
  isInsuranceDeclarationComplete,
  setInsuranceDeclaration,
  subscribeInsuranceDeclaration,
  type InsuranceDeclaration,
} from '../../services/insurance-declaration';
import { InsuranceIcon } from './account-icons';

type InsuranceScreenProps = {
  onClose: () => void;
};

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 0, 0, 0.06)' } : undefined;

const AGREEMENTS = [
  {
    key: 'hasInsurance' as const,
    title: 'Valid instructor insurance',
    body: 'I confirm I hold current insurance that covers me for giving driving instruction.',
  },
  {
    key: 'hasDualControls' as const,
    title: 'Dual controls fitted',
    body: 'I confirm the vehicle I teach in has dual controls fitted and in working order.',
  },
  {
    key: 'isQualifiedToTeach' as const,
    title: 'Qualified to teach',
    body: 'I confirm I am qualified and legally allowed to teach students how to drive.',
  },
] as const;

type AgreementRowProps = {
  title: string;
  body: string;
  checked: boolean;
  onToggle: () => void;
  showDivider?: boolean;
};

function AgreementRow({
  title,
  body,
  checked,
  onToggle,
  showDivider = true,
}: AgreementRowProps) {
  return (
    <View>
      <Pressable
        onPress={onToggle}
        android_ripple={ANDROID_RIPPLE}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        style={({ pressed }) => [styles.agreementRow, pressed && styles.pressed]}>
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
        <View style={styles.agreementText}>
          <Text style={styles.agreementTitle}>{title}</Text>
          <Text style={styles.agreementBody}>{body}</Text>
        </View>
      </Pressable>
      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

function formatConfirmedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function InsuranceScreen({ onClose }: InsuranceScreenProps) {
  const [declaration, setDeclaration] = useState<InsuranceDeclaration>(() =>
    getInsuranceDeclaration(),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return subscribeInsuranceDeclaration(() => {
      setDeclaration(getInsuranceDeclaration());
    });
  }, []);

  const allChecked =
    declaration.hasInsurance &&
    declaration.hasDualControls &&
    declaration.isQualifiedToTeach;
  const isComplete = isInsuranceDeclarationComplete(declaration);

  function toggleAgreement(key: keyof Pick<
    InsuranceDeclaration,
    'hasInsurance' | 'hasDualControls' | 'isQualifiedToTeach'
  >) {
    setError(null);
    setDeclaration((current) => ({
      ...current,
      [key]: !current[key],
      confirmedAt: null,
    }));
  }

  function handleConfirm() {
    if (!allChecked) {
      setError('Please confirm all three statements before continuing.');
      return;
    }

    const next: InsuranceDeclaration = {
      hasInsurance: true,
      hasDualControls: true,
      isQualifiedToTeach: true,
      confirmedAt: new Date().toISOString(),
    };

    setInsuranceDeclaration(next);
    setDeclaration(next);
    setError(null);
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

        <Text style={styles.headerTitle}>Declaration</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <InsuranceIcon size={26} color={colors.primary} />
          </View>
          <Text style={styles.introTitle}>Declaration</Text>
          <Text style={styles.introBody}>
            Confirm you meet the requirements to teach. You must agree to all
            statements below.
          </Text>
        </View>

        {isComplete ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Declaration confirmed</Text>
            <Text style={styles.statusBody}>
              Confirmed on {formatConfirmedAt(declaration.confirmedAt!)}. You can
              update this anytime if your details change.
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>I confirm that</Text>
          <View style={styles.card}>
            {AGREEMENTS.map((item, index) => (
              <AgreementRow
                key={item.key}
                title={item.title}
                body={item.body}
                checked={declaration[item.key]}
                onToggle={() => toggleAgreement(item.key)}
                showDivider={index < AGREEMENTS.length - 1}
              />
            ))}
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleConfirm}
          disabled={isComplete && allChecked}
          android_ripple={ANDROID_RIPPLE}
          style={({ pressed }) => [
            styles.confirmButton,
            (!allChecked || (isComplete && allChecked)) && styles.confirmButtonDisabled,
            pressed && allChecked && !isComplete && styles.pressed,
          ]}>
          <Text style={styles.confirmButtonText}>
            {isComplete ? 'Confirmed' : 'Agree and confirm'}
          </Text>
        </Pressable>
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
  introCard: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  introIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#e8f1ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  introBody: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statusCard: {
    borderRadius: 16,
    backgroundColor: '#ecfdf5',
    padding: spacing.lg,
    gap: 4,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#047857',
  },
  statusBody: {
    fontSize: 13,
    lineHeight: 19,
    color: '#065f46',
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
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
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
  agreementText: {
    flex: 1,
    gap: 4,
  },
  agreementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  agreementBody: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg,
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.error,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  confirmButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.45,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  pressed: {
    opacity: 0.88,
  },
});
