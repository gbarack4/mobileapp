import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../constants/theme';
import { LightningIcon } from './availability-icons';

type DynamicSchedulingInfoDialogProps = {
  visible: boolean;
  travelTimeMinutes: number;
  onClose: () => void;
};

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 0, 0, 0.06)' } : undefined;

export function DynamicSchedulingInfoDialog({
  visible,
  travelTimeMinutes,
  onClose,
}: DynamicSchedulingInfoDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />

        <View style={styles.dialog}>
          <View style={styles.iconWrap}>
            <LightningIcon />
          </View>

          <Text style={styles.title}>Dynamic Scheduling</Text>
          <Text style={styles.body}>
            When this is on, your fixed {travelTimeMinutes} min travel buffer is not used. Travel
            time is adjusted from the real distance between lessons instead.
          </Text>

          <Pressable
            onPress={onClose}
            android_ripple={ANDROID_RIPPLE}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            <Text style={styles.buttonText}>Got it</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
    minHeight: 48,
    marginTop: spacing.xs,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  pressed: {
    opacity: 0.88,
  },
});
