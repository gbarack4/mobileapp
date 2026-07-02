import { Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { ChevronRightIcon } from '../icons/dashboard-icons';
import { colors, spacing } from '../../constants/theme';

type HubSettingsRowProps = {
  label: string;
  value?: string;
  subtitle?: string;
  toggle?: boolean;
  enabled?: boolean;
  destructive?: boolean;
  onPress?: () => void;
  onToggle?: (enabled: boolean) => void;
  showDivider?: boolean;
};

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 0, 0, 0.04)' } : undefined;

export function HubSettingsRow({
  label,
  value,
  subtitle,
  toggle = false,
  enabled = false,
  destructive = false,
  onPress,
  onToggle,
  showDivider = true,
}: HubSettingsRowProps) {
  const content = (
    <>
      <View style={styles.textWrap}>
        <Text style={[styles.label, destructive && styles.destructiveLabel]}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {value ? <Text style={styles.value}>{value}</Text> : null}
      </View>

      {toggle ? (
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: '#e5e7eb', true: '#93c5fd' }}
          thumbColor={enabled ? colors.primary : colors.white}
        />
      ) : (
        <ChevronRightIcon size={18} color={colors.textMuted} />
      )}
    </>
  );

  return (
    <View>
      {toggle ? (
        <View style={styles.row}>{content}</View>
      ) : (
        <Pressable
          onPress={onPress}
          android_ripple={ANDROID_RIPPLE}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          {content}
        </Pressable>
      )}

      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 18,
    paddingHorizontal: spacing.xl,
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
  destructiveLabel: {
    color: colors.error,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  value: {
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
