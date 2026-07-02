import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../../constants/theme';

type ProfilePhotoPickerProps = {
  photoUri: string | null;
  onPress: () => void;
};

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 94, 255, 0.14)' } : undefined;

export function ProfilePhotoPicker({ photoUri, onPress }: ProfilePhotoPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Profile photo</Text>
      <Pressable
        onPress={onPress}
        android_ripple={ANDROID_RIPPLE}
        style={({ pressed }) => [styles.photoButton, pressed && styles.pressed]}>
        <View style={styles.photoCircle}>
          <Text style={styles.photoInitial}>{photoUri ? '✓' : '+'}</Text>
        </View>
        <Text style={styles.photoText}>{photoUri ? 'Photo selected' : 'Add profile photo'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  label: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  photoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitial: {
    fontSize: 28,
    color: colors.primary,
    fontWeight: '600',
  },
  photoText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  pressed: {
    opacity: 0.85,
  },
});
