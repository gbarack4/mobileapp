import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConfirmedPopup } from '../confirmed-popup';
import { CarIcon } from '../icons/dashboard-icons';
import { SheetCloseIcon, WarningIcon } from '../icons/cancel-lesson-icons';
import { colors, spacing } from '../../constants/theme';
import type { Lesson } from '../../types/dashboard';

export type CancellationReason =
  | 'unwell'
  | 'personal-emergency'
  | 'schedule-conflict'
  | 'instructor-issue'
  | 'other';

type CancelLessonSheetProps = {
  visible: boolean;
  lesson: Lesson;
  onClose: () => void;
  onConfirm: (reason: CancellationReason) => void | Promise<void>;
};

const CANCELLATION_REASONS: { id: CancellationReason; label: string }[] = [
  { id: 'unwell', label: 'Unwell / illness' },
  { id: 'personal-emergency', label: 'Personal emergency' },
  { id: 'schedule-conflict', label: 'Schedule conflict' },
  { id: 'instructor-issue', label: 'Instructor issue' },
  { id: 'other', label: 'Other' },
];

const SHEET_SLIDE_DISTANCE = 720;
const FADE_DURATION = 220;
const SLIDE_DURATION = 320;
const CANCELLING_MS = 2000;

type SheetPhase = 'form' | 'submitting' | 'confirmed';

type PressableState = {
  pressed: boolean;
};

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(220, 38, 38, 0.08)' } : undefined;

function formatLessonSummary(lesson: Lesson) {
  return `${lesson.dayOfWeek} ${lesson.day} ${lesson.month} · ${lesson.time} · ${lesson.studentName}`;
}

export function CancelLessonSheet({ visible, lesson, onClose, onConfirm }: Readonly<CancelLessonSheetProps>) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const [selectedReason, setSelectedReason] = useState<CancellationReason | null>(null);
  const [phase, setPhase] = useState<SheetPhase>('form');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SHEET_SLIDE_DISTANCE)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setSelectedReason(null);
      setPhase('form');
      fadeAnim.setValue(0);
      slideAnim.setValue(SHEET_SLIDE_DISTANCE);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: FADE_DURATION,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: SLIDE_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!mounted) {
      return;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: FADE_DURATION,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SHEET_SLIDE_DISTANCE,
        duration: SLIDE_DURATION,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setMounted(false);
      }
    });
  }, [fadeAnim, mounted, slideAnim, visible]);

  if (!mounted) {
    return null;
  }

  const canConfirm = selectedReason !== null && phase === 'form';

  async function handleConfirmPress() {
    if (!selectedReason || phase !== 'form') {
      return;
    }

    setPhase('submitting');
    const startedAt = Date.now();

    try {
      await onConfirm(selectedReason);

      const remaining = CANCELLING_MS - (Date.now() - startedAt);
      if (remaining > 0) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, remaining);
        });
      }

      setPhase('confirmed');
    } catch {
      setPhase('form');
    }
  }

  function handleConfirmedClose() {
    onClose();
  }

  function handleClose() {
    if (phase === 'submitting') {
      return;
    }

    onClose();
  }

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable
            style={styles.backdropPressable}
            onPress={handleClose}
            accessibilityLabel="Close"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
            { transform: [{ translateY: slideAnim }] },
          ]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Cancel lesson</Text>
            <Pressable
              onPress={handleClose}
              disabled={phase === 'submitting'}
              hitSlop={12}
              android_ripple={ANDROID_RIPPLE}
              accessibilityLabel="Close"
              style={({ pressed }: PressableState) => [styles.closeButton, pressed && styles.pressed]}>
              <SheetCloseIcon />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            scrollEnabled={phase === 'form'}>
            <View style={styles.lessonCard}>
              <View style={styles.lessonIconWrap}>
                <CarIcon size={16} color="#ef4444" />
              </View>
              <View style={styles.lessonText}>
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                <Text style={styles.lessonMeta}>{formatLessonSummary(lesson)}</Text>
              </View>
            </View>

            <View style={styles.warningBanner}>
              <WarningIcon size={16} />
              <Text style={styles.warningText}>
                Cancelling within 12 hours of the lesson may result in a cancellation fee.
              </Text>
            </View>

            <Text style={styles.sectionLabel}>Reason for cancelling</Text>

            <View style={styles.reasonList}>
              {CANCELLATION_REASONS.map((reason) => {
                const selected = selectedReason === reason.id;

                return (
                  <Pressable
                    key={reason.id}
                    onPress={() => setSelectedReason(reason.id)}
                    disabled={phase !== 'form'}
                    android_ripple={ANDROID_RIPPLE}
                    style={[
                      styles.reasonRow,
                      selected && styles.reasonRowSelected,
                    ]}>
                    <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                      {selected ? <View style={styles.radioInner} /> : null}
                    </View>
                    <Text style={[styles.reasonLabel, selected && styles.reasonLabelSelected]}>
                      {reason.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <Pressable
            onPress={handleConfirmPress}
            disabled={!selectedReason || phase !== 'form'}
            android_ripple={canConfirm ? ANDROID_RIPPLE : undefined}
            style={({ pressed }: PressableState) => [
              styles.confirmButton,
              selectedReason ? styles.confirmButtonActive : styles.confirmButtonDisabled,
              canConfirm && pressed && styles.pressed,
            ]}>
            <Text
              style={[
                styles.confirmButtonText,
                !selectedReason && styles.confirmButtonTextDisabled,
              ]}>
              {phase === 'submitting' ? 'Cancelling....' : 'Cancel lesson'}
            </Text>
          </Pressable>
        </Animated.View>

        {phase === 'confirmed' ? (
          <ConfirmedPopup
            title="Cancellation confirmed"
            message="The lesson has been cancelled successfully."
            onClose={handleConfirmedClose}
          />
        ) : null}
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
  backdropPressable: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    maxHeight: '92%',
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#d1d5db',
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#f9f9f9',
    borderRadius: 14,
    padding: spacing.md,
  },
  lessonIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonText: {
    flex: 1,
    gap: 2,
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  lessonMeta: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    padding: spacing.md,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#9a3412',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  reasonList: {
    gap: spacing.sm,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  reasonRowSelected: {
    borderColor: colors.error,
    backgroundColor: '#fffafa',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.error,
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.error,
  },
  reasonLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  reasonLabelSelected: {
    color: colors.error,
    fontWeight: '600',
  },
  confirmButton: {
    borderRadius: 14,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.inputBackground,
  },
  confirmButtonActive: {
    backgroundColor: colors.error,
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  confirmButtonTextDisabled: {
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.85,
  },
});
