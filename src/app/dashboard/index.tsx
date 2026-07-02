import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreen } from '../../components/account/account-screen';
import { DashboardBottomNav } from '../../components/dashboard/dashboard-bottom-nav';
import { LessonCard } from '../../components/dashboard/lesson-card';
import { LessonTabs } from '../../components/dashboard/lesson-tabs';
import { SearchBar } from '../../components/dashboard/search-bar';
import { SchoolsScreen } from '../../components/schools/schools-screen';
import { CalendarIcon } from '../../components/icons/dashboard-icons';
import { colors, spacing } from '../../constants/theme';
import { MOCK_LESSONS } from '../../data/mock-lessons';
import type { DashboardTab, LessonTab } from '../../types/dashboard';

const SECTION_TITLES: Record<LessonTab, string> = {
  upcoming: 'Upcoming lessons',
  completed: 'Completed lessons',
  cancelled: 'Cancelled lessons',
};

const DASHBOARD_TAB_TITLES: Record<DashboardTab, string> = {
  school: 'School',
  bookings: 'Bookings',
  earnings: 'Earnings',
  profile: 'Account',
};

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 94, 255, 0.08)' } : undefined;

const TAB_FADE_DURATION = 220;

export default function DashboardScreen() {
  const [lessonTab, setLessonTab] = useState<LessonTab>('upcoming');
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('bookings');
  const [searchQuery, setSearchQuery] = useState('');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: TAB_FADE_DURATION,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [dashboardTab, fadeAnim]);

  const lessons = useMemo(() => {
    const tabLessons = MOCK_LESSONS.filter((lesson) => lesson.status === lessonTab);
    const trimmedQuery = searchQuery.trim().toLowerCase();

    if (!trimmedQuery) {
      return tabLessons;
    }

    return tabLessons.filter((lesson) => {
      const searchableText = [
        lesson.title,
        lesson.studentName,
        lesson.studentEmail,
        lesson.locationAddress,
        lesson.locationName,
        lesson.transmission,
        lesson.time,
        lesson.duration,
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(trimmedQuery);
    });
  }, [lessonTab, searchQuery]);

  if (dashboardTab === 'profile') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Animated.View style={[styles.fadeContainer, { opacity: fadeAnim }]}>
          <AccountScreen onClose={() => setDashboardTab('bookings')} />
        </Animated.View>
        <DashboardBottomNav activeTab={dashboardTab} onTabChange={setDashboardTab} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Animated.View style={[styles.fadeContainer, { opacity: fadeAnim }]}>
        {dashboardTab === 'school' ? (
          <SchoolsScreen />
        ) : dashboardTab === 'bookings' ? (
          <View style={styles.screen}>
            <View style={styles.header}>
              <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

              <LessonTabs activeTab={lessonTab} onTabChange={setLessonTab} />

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{SECTION_TITLES[lessonTab]}</Text>
                <Pressable
                  onPress={() => router.push('/dashboard/calendar')}
                  android_ripple={ANDROID_RIPPLE}
                  style={styles.calendarLink}>
                  <Text style={styles.calendarText}>View calendar</Text>
                  <CalendarIcon />
                </Pressable>
              </View>
            </View>

            <ScrollView
              key={lessonTab}
              style={styles.lessonScroll}
              contentContainerStyle={styles.lessonScrollContent}
              showsVerticalScrollIndicator={false}>
              {lessons.length > 0 ? (
                lessons.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} />)
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>
                    {searchQuery.trim() ? 'No matching lessons' : `No ${lessonTab} lessons`}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {searchQuery.trim()
                      ? 'Try a different search term.'
                      : 'Lessons will appear here once scheduled.'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.placeholderScreen}>
            <Text style={styles.placeholderTitle}>
              {DASHBOARD_TAB_TITLES[dashboardTab]}
            </Text>
            <Text style={styles.placeholderSubtitle}>Coming soon</Text>
          </View>
        )}
      </Animated.View>

      <DashboardBottomNav activeTab={dashboardTab} onTabChange={setDashboardTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fadeContainer: {
    flex: 1,
  },
  screen: {
    flex: 1,
    position: 'relative',
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  lessonScroll: {
    flex: 1,
  },
  lessonScrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: 96,
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.1,
  },
  calendarLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  calendarText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyState: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eef2f7',
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
  placeholderScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  placeholderSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
  },
});
