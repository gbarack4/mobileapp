import { router } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { MapPinIcon } from '../icons/dashboard-icons';
import { colors, spacing } from '../../constants/theme';
import type { School } from '../../types/school';
import { StarRating } from './star-rating';

type SchoolCardProps = {
  school: School;
  onJoin: (school: School) => void;
};

type PressableState = {
  pressed: boolean;
  hovered?: boolean;
};

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 94, 255, 0.08)' } : undefined;

export function SchoolCard({ school, onJoin }: SchoolCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.avatar, { backgroundColor: school.avatarColor }]}>
          <Text style={styles.avatarText}>{school.initials}</Text>
        </View>

        <View style={styles.headerText}>
          <Text style={styles.name}>{school.name}</Text>
          <StarRating rating={school.rating} reviewCount={school.reviewCount} />
        </View>
      </View>

      <Text style={styles.serviceTypes}>{school.serviceTypes}</Text>

      <View style={styles.locationRow}>
        <MapPinIcon size={14} color={colors.textMuted} />
        <Text style={styles.locationText}>
          {school.address}, {school.suburb}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => router.push(`/dashboard/school/${school.id}`)}
          android_ripple={ANDROID_RIPPLE}
          style={({ pressed, hovered }: PressableState) => [
            styles.secondaryButton,
            hovered && !pressed && styles.secondaryButtonHovered,
            pressed && styles.pressed,
          ]}>
          <Text style={styles.secondaryButtonText}>View Details</Text>
        </Pressable>

        <Pressable
          onPress={() => onJoin(school)}
          android_ripple={ANDROID_RIPPLE}
          style={({ pressed, hovered }: PressableState) => [
            styles.primaryButton,
            hovered && !pressed && styles.primaryButtonHovered,
            pressed && styles.pressed,
          ]}>
          <Text style={styles.primaryButtonText}>Join</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  serviceTypes: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.text,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? ({ outlineStyle: 'none', transition: 'background-color 0.15s ease' } as object)
      : {}),
  },
  secondaryButtonHovered: {
    backgroundColor: '#f9fafb',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  primaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? ({ outlineStyle: 'none', transition: 'background-color 0.15s ease' } as object)
      : {}),
  },
  primaryButtonHovered: {
    backgroundColor: colors.primaryHover,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  pressed: {
    opacity: 0.88,
  },
});
