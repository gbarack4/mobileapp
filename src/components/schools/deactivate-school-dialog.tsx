import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { SheetCloseIcon } from '../icons/cancel-lesson-icons';
import { colors, spacing } from '../../constants/theme';

type DeactivateChoice = 'pause' | 'deactive';

type DeactivateSchoolDialogProps = {
  visible: boolean;
  schoolName: string;
  onClose: () => void;
  onPause: () => void;
  onDeactivate: () => void;
};

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 0, 0, 0.06)' } : undefined;

export function DeactivateSchoolDialog({
  visible,
  schoolName,
  onClose,
  onPause,
  onDeactivate,
}: DeactivateSchoolDialogProps) {
  const [choice, setChoice] = useState<DeactivateChoice | null>(null);

  useEffect(() => {
    if (visible) {
      setChoice(null);
    }
  }, [visible]);

  function handleSubmit() {
    if (choice === 'pause') {
      onPause();
      return;
    }
    if (choice === 'deactive') {
      onDeactivate();
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />

        <View style={styles.dialog}>
          <View style={styles.header}>
            <Text style={styles.title}>Manage school</Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              android_ripple={ANDROID_RIPPLE}
              accessibilityLabel="Close"
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
              <SheetCloseIcon />
            </Pressable>
          </View>
          <Text style={styles.body}>
            Choose what to do with {schoolName}. You can pause lessons for now, or deactive and
            leave the school.
          </Text>

          <Pressable
            onPress={() => setChoice('pause')}
            android_ripple={ANDROID_RIPPLE}
            style={({ pressed }) => [
              styles.optionCard,
              choice === 'pause' && styles.optionCardSelected,
              pressed && styles.pressed,
            ]}>
            <Text
              style={[
                styles.optionTitle,
                styles.optionTitlePause,
                choice === 'pause' && styles.optionTitlePauseSelected,
              ]}>
              Pause
            </Text>
            <Text style={styles.optionBody}>
              Stop receiving lessons from this school. You stay connected and can resume later.
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setChoice('deactive')}
            android_ripple={ANDROID_RIPPLE}
            style={({ pressed }) => [
              styles.optionCard,
              styles.optionCardDanger,
              choice === 'deactive' && styles.optionCardDangerSelected,
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.optionTitle, styles.optionTitleDanger]}>Deactive</Text>
            <Text style={styles.optionBody}>
              You will lose this school and need to rejoin again if you want to come back.
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSubmit}
            disabled={!choice}
            android_ripple={ANDROID_RIPPLE}
            style={({ pressed }) => [
              styles.submitButton,
              !choice && styles.submitButtonDisabled,
              pressed && choice && styles.pressed,
            ]}>
            <Text style={styles.submitButtonText}>Submit</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inputBackground,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  optionCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
    gap: 4,
    backgroundColor: colors.background,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#e8f1ff',
  },
  optionCardDanger: {
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  optionCardDangerSelected: {
    borderColor: colors.error,
    backgroundColor: '#fee2e2',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  optionTitlePause: {
    color: '#ca8a04',
  },
  optionTitlePauseSelected: {
    color: '#a16207',
  },
  optionTitleDanger: {
    color: colors.error,
  },
  optionBody: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  submitButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  pressed: {
    opacity: 0.88,
  },
});
