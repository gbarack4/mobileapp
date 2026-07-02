import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { OtpInput } from './otp-input';
import {
  VerificationMethod,
  VerificationOptionsSheet,
} from './verification-options-sheet';
import { colors, radius, spacing } from '../../constants/theme';

type PressableState = {
  pressed: boolean;
  hovered?: boolean;
};

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 94, 255, 0.14)' } : undefined;

type VerifyCodeStepProps = {
  identifier: string;
  code: string;
  error: string | null;
  success: string | null;
  isSubmitting: boolean;
  onChangeCode: (code: string) => void;
  onBack: () => void;
  onNext: () => void;
  onSelectVerificationMethod?: (method: VerificationMethod) => void;
};

function getDisplayName(identifier: string): string {
  if (!identifier.includes('@')) {
    return 'there';
  }

  const localPart = identifier.split('@')[0] ?? '';
  const namePart = localPart.split(/[._-]/)[0] ?? localPart;
  if (!namePart) {
    return 'there';
  }

  return namePart.charAt(0).toUpperCase() + namePart.slice(1);
}

function isEmail(identifier: string): boolean {
  return identifier.includes('@');
}

export function VerifyCodeStep({
  identifier,
  code,
  error,
  success,
  isSubmitting,
  onChangeCode,
  onBack,
  onNext,
  onSelectVerificationMethod,
}: VerifyCodeStepProps) {
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const displayName = getDisplayName(identifier);
  const canContinue = code.length === 4 && !isSubmitting;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.greeting}>Welcome back, {displayName}.</Text>

        <Text style={styles.instruction}>Enter the 4-digit code sent to you at:</Text>
        <Text style={styles.identifier}>{identifier}</Text>

        <OtpInput value={code} onChange={onChangeCode} disabled={isSubmitting} />

        <Text style={styles.tip}>
          Tip:{' '}
          {isEmail(identifier)
            ? 'Be sure to check your inbox and spam folders'
            : 'Be sure to check your text messages'}
        </Text>

        {success ? <Text style={styles.success}>{success}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          onPress={() => setShowOptionsSheet(true)}
          disabled={isSubmitting}
          android_ripple={ANDROID_RIPPLE}
          style={({ pressed }: PressableState) => [
            styles.tryDifferentWayButton,
            pressed && styles.buttonPressed,
          ]}>
          <Text style={styles.tryDifferentWayText}>Try a different way</Text>
        </Pressable>
      </View>

      <VerificationOptionsSheet
        visible={showOptionsSheet}
        identifier={identifier}
        onClose={() => setShowOptionsSheet(false)}
        onSelectMethod={(method) => {
          onSelectVerificationMethod?.(method);
        }}
      />

      <View style={styles.footer}>
        <Pressable
          onPress={onBack}
          disabled={isSubmitting}
          android_ripple={ANDROID_RIPPLE}
          accessibilityLabel="Go back"
          style={({ pressed }: PressableState) => [
            styles.backButton,
            pressed && styles.buttonPressed,
          ]}>
          <Text style={styles.backButtonIcon}>←</Text>
        </Pressable>

        <Pressable
          onPress={onNext}
          disabled={!canContinue}
          android_ripple={ANDROID_RIPPLE}
          style={({ pressed }: PressableState) => [
            styles.nextButton,
            !canContinue && styles.nextButtonDisabled,
            pressed && canContinue && styles.buttonPressed,
          ]}>
          {isSubmitting ? (
            <ActivityIndicator color={colors.textSecondary} />
          ) : (
            <>
              <Text style={[styles.nextButtonText, !canContinue && styles.nextButtonTextDisabled]}>
                Next
              </Text>
              <Text style={[styles.nextButtonArrow, !canContinue && styles.nextButtonTextDisabled]}>
                →
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
  content: {
    gap: spacing.lg,
    paddingTop: spacing.xxxl,
  },
  greeting: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  instruction: {
    fontSize: 17,
    lineHeight: 24,
    color: colors.text,
  },
  identifier: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  tip: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  error: {
    color: colors.error,
    fontSize: 14,
    lineHeight: 20,
  },
  success: {
    color: '#15803d',
    fontSize: 14,
    lineHeight: 20,
  },
  tryDifferentWayButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tryDifferentWayText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonIcon: {
    fontSize: 22,
    color: colors.text,
    fontWeight: '500',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.inputBackground,
    borderRadius: 999,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    minWidth: 120,
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.55,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  nextButtonArrow: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  nextButtonTextDisabled: {
    color: colors.textMuted,
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
