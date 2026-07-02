import { goBackOr } from '../../utils/navigation';
import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LessonCard } from '../../components/dashboard/lesson-card';
import { MonthCalendar } from '../../components/dashboard/month-calendar';
import { CloseIcon } from '../../components/icons/lesson-detail-icons';
import { colors, spacing } from '../../constants/theme';
import { MOCK_LESSONS } from '../../data/mock-lessons';
import {
  formatSelectedDayLabel,
  getLessonCountsInMonth,
  getLessonsForDate,
  shiftMonth,
} from '../../utils/lesson-dates';

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 94, 255, 0.08)' } : undefined;

const DEFAULT_MONTH = new Date(2026, 4, 1);
const DEFAULT_SELECTED_DATE = new Date(2026, 4, 7);

export default function CalendarScreen() {
  const [visibleMonth, setVisibleMonth] = useState(DEFAULT_MONTH);
  const [selectedDate, setSelectedDate] = useState(DEFAULT_SELECTED_DATE);

  const lessonCounts = useMemo(
    () =>
      getLessonCountsInMonth(
        MOCK_LESSONS,
        visibleMonth.getFullYear(),
        visibleMonth.getMonth(),
      ),
    [visibleMonth],
  );

  const selectedLessons = useMemo(
    () => getLessonsForDate(MOCK_LESSONS, selectedDate),
    [selectedDate],
  );

  function handlePreviousMonth() {
    const nextMonth = shiftMonth(visibleMonth, -1);
    setVisibleMonth(nextMonth);
    setSelectedDate(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1));
  }

  function handleNextMonth() {
    const nextMonth = shiftMonth(visibleMonth, 1);
    setVisibleMonth(nextMonth);
    setSelectedDate(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1));
  }

  function handleSelectDate(date: Date) {
    setSelectedDate(date);
    if (
      date.getMonth() !== visibleMonth.getMonth() ||
      date.getFullYear() !== visibleMonth.getFullYear()
    ) {
      setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
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
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <MonthCalendar
            visibleMonth={visibleMonth}
            selectedDate={selectedDate}
            lessonCounts={lessonCounts}
            onSelectDate={handleSelectDate}
            onPreviousMonth={handlePreviousMonth}
            onNextMonth={handleNextMonth}
          />

          <View style={styles.divider} />

          <Text style={styles.dayLabel}>{formatSelectedDayLabel(selectedDate)}</Text>

          <View style={styles.lessonList}>
            {selectedLessons.length > 0 ? (
              selectedLessons.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} />)
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No lessons scheduled</Text>
                <Text style={styles.emptySubtitle}>Pick another day to view lessons.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  lessonList: {
    gap: spacing.md,
  },
  emptyState: {
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
