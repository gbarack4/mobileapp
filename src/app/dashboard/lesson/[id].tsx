import { useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  RescheduleLessonSheet,
  type RescheduleSelection,
} from '../../../components/dashboard/reschedule-lesson-sheet';
import { LessonMap } from '../../../components/dashboard/lesson-map';
import { CloseIcon, DirectionsIcon, PhoneIcon } from '../../../components/icons/lesson-detail-icons';
import { colors, spacing } from '../../../constants/theme';
import type { Lesson, LessonStatus } from '../../../types/dashboard';
import { getLessonById } from '../../../utils/lessons';
import { goBackOr } from '../../../utils/navigation';

type PressableState = {
  pressed: boolean;
  hovered?: boolean;
};

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 94, 255, 0.1)' } : undefined;

function statusLabel(status: LessonStatus) {
  switch (status) {
    case 'upcoming':
      return 'Upcoming';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

function statusTextStyle(status: LessonStatus) {
  switch (status) {
    case 'completed':
      return styles.statusTextCompleted;
    case 'cancelled':
      return styles.statusTextCancelled;
    default:
      return styles.statusTextUpcoming;
  }
}

function formatLessonDate(lesson: Lesson) {
  return `${lesson.dayOfWeek} ${lesson.day} ${lesson.month} ${lesson.year}`;
}

export default function LessonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = getLessonById(id ?? '');
  const [rescheduleSheetVisible, setRescheduleSheetVisible] = useState(false);

  if (!lesson) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.missingState}>
          <Text style={styles.missingTitle}>Lesson not found</Text>
          <Pressable onPress={() => goBackOr('/dashboard')} style={styles.missingButton}>
            <Text style={styles.missingButtonText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const activeLesson = lesson;

  function handleCallStudent() {
    const phoneNumber = activeLesson.studentPhone.replace(/\s/g, '');
    Linking.openURL(`tel:${phoneNumber}`);
  }

  function handleGetDirections() {
    const destination = `${activeLesson.latitude},${activeLesson.longitude}`;
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${destination}`,
      android: `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
    });

    if (url) {
      Linking.openURL(url);
    }
  }

  function handleConfirmReschedule(_selection: RescheduleSelection) {
    // TODO: connect to NestJS reschedule API
    setRescheduleSheetVisible(false);
    goBackOr('/dashboard');
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            onPress={() => goBackOr('/dashboard')}
            android_ripple={ANDROID_RIPPLE}
            hitSlop={8}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
            <CloseIcon />
          </Pressable>

          <Text style={styles.headerTitle}>Lesson Details</Text>

          <View style={styles.statusBadge}>
            <Text style={[styles.statusText, statusTextStyle(activeLesson.status)]}>
              {statusLabel(activeLesson.status)}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <LessonMap
            latitude={activeLesson.latitude}
            longitude={activeLesson.longitude}
            locationName={activeLesson.locationName}
          />

          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{activeLesson.studentInitials}</Text>
            </View>

            <View style={styles.profileText}>
              <Text style={styles.profileLabel}>Student</Text>
              <Text style={styles.profileName}>{activeLesson.studentName}</Text>
              <Text style={styles.profileSubtitle}>{activeLesson.studentSubtitle}</Text>
            </View>

            <Pressable
              onPress={handleCallStudent}
              android_ripple={ANDROID_RIPPLE}
              style={({ pressed }) => [styles.callButton, pressed && styles.pressed]}>
              <PhoneIcon />
            </Pressable>
          </View>

          <View style={styles.detailsCard}>
            <DetailRow label="Date" value={formatLessonDate(activeLesson)} />
            <DetailRow label="Time" value={activeLesson.time} />
            <DetailRow label="Duration" value={activeLesson.duration} />
            <DetailRow label="Lesson type" value={activeLesson.transmission} />
            <DetailRow label="Address" value={activeLesson.locationAddress} multiline />
            <DetailRow label="Lesson price" value={activeLesson.lessonPrice} isLast />
          </View>
        </ScrollView>

        {activeLesson.status === 'upcoming' ? (
          <View style={styles.footer}>
            <Pressable
              onPress={() => setRescheduleSheetVisible(true)}
              android_ripple={ANDROID_RIPPLE}
              style={({ pressed, hovered }: PressableState) => [
                styles.secondaryButton,
                hovered && !pressed && styles.secondaryButtonHovered,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.secondaryButtonText}>Reschedule</Text>
            </Pressable>

            <Pressable
              onPress={handleGetDirections}
              android_ripple={ANDROID_RIPPLE}
              style={({ pressed, hovered }: PressableState) => [
                styles.primaryButton,
                hovered && !pressed && styles.primaryButtonHovered,
                pressed && styles.pressed,
              ]}>
              <DirectionsIcon />
              <Text style={styles.primaryButtonText}>Get directions</Text>
            </Pressable>
          </View>
        ) : null}

        {activeLesson.status === 'upcoming' ? (
          <RescheduleLessonSheet
            visible={rescheduleSheetVisible}
            lesson={activeLesson}
            onClose={() => setRescheduleSheetVisible(false)}
            onConfirm={handleConfirmReschedule}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

type DetailRowProps = {
  label: string;
  value: string;
  isLast?: boolean;
  multiline?: boolean;
};

function DetailRow({ label, value, isLast, multiline }: DetailRowProps) {
  return (
    <View style={[styles.detailRow, !isLast && styles.detailRowBorder]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, multiline && styles.detailValueMultiline]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  statusBadge: {
    backgroundColor: colors.inputBackground,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 84,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusTextUpcoming: {
    color: colors.primary,
  },
  statusTextCompleted: {
    color: '#059669',
  },
  statusTextCancelled: {
    color: colors.error,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
    paddingBottom: spacing.lg,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: spacing.lg,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#e8f1ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  profileText: {
    flex: 1,
    gap: 2,
  },
  profileLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  profileSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
    gap: spacing.lg,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#eceff3',
  },
  detailLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'right',
    flex: 1,
  },
  detailValueMultiline: {
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? ({ outlineStyle: 'none', transition: 'background-color 0.15s ease' } as object)
      : {}),
  },
  secondaryButtonHovered: {
    backgroundColor: colors.inputBackgroundHover,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  primaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...(Platform.OS === 'web'
      ? ({ outlineStyle: 'none', transition: 'background-color 0.15s ease' } as object)
      : {}),
  },
  primaryButtonHovered: {
    backgroundColor: colors.primaryHover,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  pressed: {
    opacity: 0.85,
  },
  missingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  missingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  missingButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  missingButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
});
