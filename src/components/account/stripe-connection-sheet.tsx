import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SheetCloseIcon } from '../icons/cancel-lesson-icons';
import { colors, spacing } from '../../constants/theme';
import type { SchoolStripeConnection } from '../../types/payment';

type StripeConnectionSheetProps = {
  visible: boolean;
  connection: SchoolStripeConnection | null;
  onClose: () => void;
  onReconnect: (schoolId: string) => void;
  onDisconnect: (schoolId: string) => void;
};

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 0, 0, 0.06)' } : undefined;

export function StripeConnectionSheet({
  visible,
  connection,
  onClose,
  onReconnect,
  onDisconnect,
}: StripeConnectionSheetProps) {
  const insets = useSafeAreaInsets();

  if (!connection) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Stripe account</Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              android_ripple={ANDROID_RIPPLE}
              accessibilityLabel="Close"
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
              <SheetCloseIcon />
            </Pressable>
          </View>

          <View style={styles.schoolSummary}>
            <View
              style={[
                styles.schoolAvatar,
                { backgroundColor: `${connection.avatarColor}22` },
              ]}>
              <Text style={[styles.schoolAvatarText, { color: connection.avatarColor }]}>
                {connection.initials}
              </Text>
            </View>

            <View style={styles.schoolInfo}>
              <Text style={styles.schoolName}>{connection.name}</Text>
              <Text style={styles.schoolMeta}>
                Account {connection.stripeAccountLabel ?? 'connected'}
              </Text>
            </View>
          </View>

          <Text style={styles.sheetDescription}>
            Reconnect if you need to update your Stripe details, or disconnect to stop payouts from
            this school.
          </Text>

          <Pressable
            onPress={() => onReconnect(connection.schoolId)}
            android_ripple={ANDROID_RIPPLE}
            style={({ pressed }) => [styles.reconnectButton, pressed && styles.pressed]}>
            <Text style={styles.reconnectButtonText}>Reconnect Stripe</Text>
          </Pressable>

          <Pressable
            onPress={() => onDisconnect(connection.schoolId)}
            android_ripple={ANDROID_RIPPLE}
            style={({ pressed }) => [styles.disconnectButton, pressed && styles.pressed]}>
            <Text style={styles.disconnectButtonText}>Disconnect</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.inputBackground,
  },
  schoolSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#f9f9f9',
    borderRadius: 14,
    padding: spacing.md,
  },
  schoolAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  schoolAvatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  schoolInfo: {
    flex: 1,
    gap: 4,
  },
  schoolName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  schoolMeta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  sheetDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  reconnectButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#635bff',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? ({ outlineStyle: 'none', transition: 'opacity 0.15s ease' } as object)
      : {}),
  },
  reconnectButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  disconnectButton: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? ({ outlineStyle: 'none', transition: 'opacity 0.15s ease' } as object)
      : {}),
  },
  disconnectButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.error,
  },
  pressed: {
    opacity: 0.85,
  },
});
