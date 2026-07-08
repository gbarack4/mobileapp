import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../constants/theme';
import { CheckCircleIcon, SheetCloseIcon } from './icons/cancel-lesson-icons';

type ConfirmedPopupProps = Readonly<{
  title: string;
  message?: string;
  actionLabel?: string;
  onClose: () => void;
}>;

type PressableState = {
  pressed: boolean;
};

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 0, 0, 0.06)' } : undefined;

const PRIMARY_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(255, 255, 255, 0.2)' } : undefined;

export function ConfirmedPopup({ title, message, actionLabel, onClose }: ConfirmedPopupProps) {
  const insets = useSafeAreaInsets();
  const usesActionButton = Boolean(actionLabel);

  return (
    <View
      style={[styles.page, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      accessibilityViewIsModal
      accessibilityRole="alert"
    >
      {!usesActionButton ? (
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            android_ripple={ANDROID_RIPPLE}
            accessibilityLabel="Close"
            style={({ pressed }: PressableState) => [styles.closeButton, pressed && styles.pressed]}
          >
            <SheetCloseIcon size={22} color={colors.text} />
          </Pressable>
        </View>
      ) : null}

      <View style={[styles.content, usesActionButton && styles.contentWithAction]}>
        <View style={styles.iconWrap}>
          <CheckCircleIcon size={36} />
        </View>
        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}

        {usesActionButton ? (
          <Pressable
            onPress={onClose}
            android_ripple={PRIMARY_RIPPLE}
            style={({ pressed }: PressableState) => [
              styles.actionButton,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.actionButtonText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.background,
    zIndex: 20,
  },
  header: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  contentWithAction: {
    gap: spacing.lg,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  actionButton: {
    marginTop: spacing.md,
    minWidth: 220,
    minHeight: 54,
    paddingHorizontal: spacing.xl,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? ({ outlineStyle: 'none', transition: 'opacity 0.15s ease' } as object)
      : {}),
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.white,
  },
  pressed: {
    opacity: 0.7,
  },
});
