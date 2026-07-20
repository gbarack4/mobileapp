import { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, spacing } from '../../constants/theme';

type TimePickerSheetProps = {
  visible: boolean;
  value: string;
  title?: string;
  /** `24h` returns "HH:mm". `12h` returns "h:mm am/pm". */
  outputFormat?: '24h' | '12h';
  onClose: () => void;
  onConfirm: (time: string) => void;
};

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 0, 0, 0.06)' } : undefined;

const MINUTES = [0, 15, 30, 45] as const;

function snapMinute(minute: number) {
  return MINUTES.reduce((closest, option) =>
    Math.abs(option - minute) < Math.abs(closest - minute) ? option : closest,
  );
}

function parseTime(value: string): { hour12: number; minute: number; period: 'am' | 'pm' } {
  const trimmed = value.trim().toLowerCase();

  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    const [hours24, minute] = trimmed.split(':').map(Number);
    const period: 'am' | 'pm' = hours24 >= 12 ? 'pm' : 'am';
    const hour12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    return { hour12, minute: snapMinute(minute), period };
  }

  const twelveHourMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
  if (twelveHourMatch) {
    const hour12Raw = Number(twelveHourMatch[1]);
    const minute = Number(twelveHourMatch[2]);
    const period = twelveHourMatch[3] as 'am' | 'pm';
    const hour12 = hour12Raw === 0 ? 12 : Math.min(Math.max(hour12Raw, 1), 12);
    return { hour12, minute: snapMinute(minute), period };
  }

  return { hour12: 12, minute: 0, period: 'pm' };
}

function toTwentyFourHour(hour12: number, minute: number, period: 'am' | 'pm') {
  let hours24 = hour12 % 12;
  if (period === 'pm') {
    hours24 += 12;
  }

  return `${String(hours24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function toTwelveHour(hour12: number, minute: number, period: 'am' | 'pm') {
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
}

type StepperProps = {
  label: string;
  display: string;
  onMinus: () => void;
  onPlus: () => void;
};

function Stepper({ label, display, onMinus, onPlus }: StepperProps) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable
          onPress={onMinus}
          android_ripple={ANDROID_RIPPLE}
          accessibilityLabel={`Decrease ${label}`}
          style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}>
          <Text style={styles.stepButtonText}>−</Text>
        </Pressable>
        <Text style={styles.stepperValue}>{display}</Text>
        <Pressable
          onPress={onPlus}
          android_ripple={ANDROID_RIPPLE}
          accessibilityLabel={`Increase ${label}`}
          style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}>
          <Text style={styles.stepButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function TimePickerSheet({
  visible,
  value,
  title = 'Set break time',
  outputFormat = '24h',
  onClose,
  onConfirm,
}: TimePickerSheetProps) {
  const [hour12, setHour12] = useState(12);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState<'am' | 'pm'>('pm');

  useEffect(() => {
    if (!visible) {
      return;
    }

    const next = parseTime(value);
    setHour12(next.hour12);
    setMinute(next.minute);
    setPeriod(next.period);
  }, [visible, value]);

  function stepHour(delta: number) {
    setHour12((current) => {
      const next = current + delta;
      if (next < 1) {
        return 12;
      }
      if (next > 12) {
        return 1;
      }
      return next;
    });
  }

  function stepMinute(delta: number) {
    setMinute((current) => {
      const index = MINUTES.indexOf(current as (typeof MINUTES)[number]);
      const safeIndex = index === -1 ? 0 : index;
      const nextIndex = (safeIndex + delta + MINUTES.length) % MINUTES.length;
      return MINUTES[nextIndex];
    });
  }

  function handleConfirm() {
    const next =
      outputFormat === '12h'
        ? toTwelveHour(hour12, minute, period)
        : toTwentyFourHour(hour12, minute, period);
    onConfirm(next);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />

        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.pickers}>
            <Stepper
              label="Hour"
              display={String(hour12)}
              onMinus={() => stepHour(-1)}
              onPlus={() => stepHour(1)}
            />
            <Text style={styles.colon}>:</Text>
            <Stepper
              label="Min"
              display={String(minute).padStart(2, '0')}
              onMinus={() => stepMinute(-1)}
              onPlus={() => stepMinute(1)}
            />
          </View>

          <View style={styles.periodRow}>
            {(['am', 'pm'] as const).map((option) => {
              const selected = period === option;

              return (
                <Pressable
                  key={option}
                  onPress={() => setPeriod(option)}
                  android_ripple={ANDROID_RIPPLE}
                  style={({ pressed }) => [
                    styles.periodButton,
                    selected && styles.periodButtonSelected,
                    pressed && styles.pressed,
                  ]}>
                  <Text
                    style={[
                      styles.periodButtonText,
                      selected && styles.periodButtonTextSelected,
                    ]}>
                    {option.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              android_ripple={ANDROID_RIPPLE}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              android_ripple={ANDROID_RIPPLE}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
              <Text style={styles.primaryButtonText}>Done</Text>
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
    gap: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  pickers: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  colon: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginTop: 18,
  },
  stepper: {
    alignItems: 'center',
    gap: 8,
  },
  stepperLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonText: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 24,
  },
  stepperValue: {
    minWidth: 36,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  periodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignSelf: 'center',
  },
  periodButton: {
    minWidth: 72,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
  },
  periodButtonSelected: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  periodButtonTextSelected: {
    color: colors.white,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  primaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  pressed: {
    opacity: 0.85,
  },
});
