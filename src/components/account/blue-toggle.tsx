import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { colors } from '../../constants/theme';

type BlueToggleProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel?: string;
};

export function BlueToggle({
  value,
  onValueChange,
  accessibilityLabel,
}: BlueToggleProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => [
        styles.track,
        value ? styles.trackOn : styles.trackOff,
        pressed && styles.pressed,
      ]}>
      <View style={[styles.thumb, value ? styles.thumbOn : styles.thumbOff]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 52,
    height: 32,
    borderRadius: 16,
    padding: 3,
    justifyContent: 'center',
  },
  trackOff: {
    backgroundColor: '#d1d5db',
  },
  trackOn: {
    backgroundColor: colors.primary,
  },
  thumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.white,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 1px 3px rgba(15, 23, 42, 0.2)' } as object)
      : {
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.18,
          shadowRadius: 2,
          elevation: 2,
        }),
  },
  thumbOff: {
    alignSelf: 'flex-start',
  },
  thumbOn: {
    alignSelf: 'flex-end',
  },
  pressed: {
    opacity: 0.9,
  },
});
