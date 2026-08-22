import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, spacing } from '../../constants/theme';

type DeleteAccountDialogProps = {
  visible: boolean;
  deleting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 0, 0, 0.06)' } : undefined;

export function DeleteAccountDialog({
  visible,
  deleting = false,
  onClose,
  onConfirm,
}: Readonly<DeleteAccountDialogProps>) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={deleting ? undefined : onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={deleting ? undefined : onClose}
          accessibilityLabel="Close"
        />

        <View style={styles.dialog}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Danger zone</Text>
          </View>

          <Text style={styles.title}>Delete Hub account?</Text>
          <Text style={styles.body}>
            You will lose access to your Instructor Hub account. Your profile,
            lessons, availability, documents, and payment connections will be
            permanently removed and cannot be recovered.
          </Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              disabled={deleting}
              android_ripple={ANDROID_RIPPLE}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && !deleting && styles.pressed,
                deleting && styles.buttonDisabled,
              ]}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={deleting}
              android_ripple={ANDROID_RIPPLE}
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && !deleting && styles.pressed,
                deleting && styles.deleteButtonDisabled,
              ]}
            >
              {deleting ? (
                <View style={styles.deletingRow}>
                  <ActivityIndicator color={colors.white} />
                  <Text style={styles.deleteButtonText}>Deleting...</Text>
                </View>
              ) : (
                <Text style={styles.deleteButtonText}>Delete account</Text>
              )}
            </Pressable>
          </View>
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
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    zIndex: 1,
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fef2f2',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.error,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.error,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  cancelButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  deleteButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  deletingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  pressed: {
    opacity: 0.88,
  },
});
