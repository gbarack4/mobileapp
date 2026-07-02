import { type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ChevronRightIcon } from '../icons/dashboard-icons';
import { colors, spacing } from '../../constants/theme';

type AccountMenuRowProps = {
  label: string;
  subtitle?: string;
  icon: ReactNode;
  onPress?: () => void;
  showDivider?: boolean;
};

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 0, 0, 0.04)' } : undefined;

export function AccountMenuRow({
  label,
  subtitle,
  icon,
  onPress,
  showDivider = true,
}: AccountMenuRowProps) {
  return (
    <View>
      <Pressable
        onPress={onPress}
        android_ripple={ANDROID_RIPPLE}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <View style={styles.iconWrap}>{icon}</View>

        <View style={styles.textWrap}>
          <Text style={styles.label}>{label}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        <ChevronRightIcon size={18} color={colors.textMuted} />
      </Pressable>

      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: 18,
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    width: 28,
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.xl,
  },
  pressed: {
    opacity: 0.85,
  },
});
