import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AuthenticatorIcon,
  ChatIcon,
  CloseIcon,
  PhoneIcon,
} from '../icons/auth-icons';
import { colors, spacing } from '../../constants/theme';

export type VerificationMethod = 'phone' | 'whatsapp' | 'authenticator';

type VerificationOptionsSheetProps = {
  visible: boolean;
  identifier: string;
  onClose: () => void;
  onSelectMethod: (method: VerificationMethod) => void;
};

const SHEET_SLIDE_DISTANCE = 420;
const FADE_DURATION = 220;
const SLIDE_DURATION = 320;

function maskPhone(identifier: string): string {
  const digits = identifier.replace(/\D/g, '');
  if (digits.length >= 4) {
    return `******${digits.slice(-4)}`;
  }

  return '******4879';
}

type PressableState = {
  pressed: boolean;
};

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 94, 255, 0.14)' } : undefined;

export function VerificationOptionsSheet({
  visible,
  identifier,
  onClose,
  onSelectMethod,
}: VerificationOptionsSheetProps) {
  const insets = useSafeAreaInsets();
  const maskedPhone = maskPhone(identifier);
  const [mounted, setMounted] = useState(visible);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SHEET_SLIDE_DISTANCE)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
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

  const options: { id: VerificationMethod; label: string; icon: ReactNode }[] = [
    {
      id: 'phone',
      label: `Phone call to ${maskedPhone}`,
      icon: <PhoneIcon />,
    },
    {
      id: 'whatsapp',
      label: 'Send code via WhatsApp',
      icon: <ChatIcon />,
    },
    {
      id: 'authenticator',
      label: 'Authenticator app',
      icon: <AuthenticatorIcon />,
    },
  ];

  if (!mounted) {
    return null;
  }

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={styles.backdropPressable} onPress={onClose} accessibilityLabel="Close options" />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
            { transform: [{ translateY: slideAnim }] },
          ]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>More options</Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              android_ripple={ANDROID_RIPPLE}
              accessibilityLabel="Close"
              style={({ pressed }: PressableState) => [styles.closeButton, pressed && styles.pressed]}>
              <CloseIcon />
            </Pressable>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Choose another way to verify</Text>

          <View style={styles.optionsList}>
            {options.map((option, index) => (
              <View key={option.id}>
                <Pressable
                  onPress={() => {
                    onSelectMethod(option.id);
                    onClose();
                  }}
                  android_ripple={ANDROID_RIPPLE}
                  style={({ pressed }: PressableState) => [
                    styles.optionRow,
                    pressed && styles.pressed,
                  ]}>
                  <View style={styles.optionIcon}>{option.icon}</View>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                </Pressable>
                {index < options.length - 1 ? <View style={styles.optionDivider} /> : null}
              </View>
            ))}
          </View>
        </Animated.View>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  optionsList: {
    gap: 0,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  optionIcon: {
    width: 28,
    alignItems: 'center',
  },
  optionLabel: {
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
    color: colors.text,
  },
  optionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  pressed: {
    opacity: 0.7,
  },
});
