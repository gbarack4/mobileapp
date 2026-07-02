import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../constants/theme';
import type { School } from '../../types/school';

type SchoolMapListItemProps = {
  school: School;
  selected: boolean;
  onPress: (school: School) => void;
};

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 94, 255, 0.08)' } : undefined;

export function SchoolMapListItem({ school, selected, onPress }: SchoolMapListItemProps) {
  return (
    <Pressable
      onPress={() => onPress(school)}
      android_ripple={ANDROID_RIPPLE}
      style={[styles.item, selected && styles.itemSelected]}>
      <View style={[styles.avatar, { backgroundColor: school.avatarColor }]}>
        <Text style={styles.avatarText}>{school.initials}</Text>
      </View>

      <View style={styles.text}>
        <Text style={styles.name}>{school.name}</Text>
        <Text style={styles.location}>
          {school.address}, {school.suburb}
        </Text>
      </View>

      <Text style={styles.rating}>{school.rating}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  itemSelected: {
    backgroundColor: '#f0f6ff',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  location: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  rating: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
});
