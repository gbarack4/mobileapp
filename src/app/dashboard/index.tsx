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
import { WeeklyEarningsScreen } from '../../components/earnings/weekly-earnings-screen';
import { SchoolsScreen } from '../../components/schools/schools-screen';
import { CalendarIcon } from '../../components/icons/dashboard-icons';
import { colors, spacing } from '../../constants/theme';
import { useBottomNavScroll } from '../../hooks/use-bottom-nav-scroll';
import { MOCK_LESSONS } from '../../data/mock-lessons';
import type { DashboardTab, LessonTab } from '../../types/dashboard';

const SECTION_TITLES: Record<LessonTab, string> = {
  upcoming: 'Upcoming lessons',
  completed: 'Completed lessons',
  cancelled: 'Cancelled lessons',
};

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 94, 255, 0.08)' } : undefined;

const FADE_OUT_MS = 120;
const FADE_IN_MS = 160;
/** Native-driver opacity on web often leaves the pane unclickable after tab fades. */
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export default function DashboardScreen() {
  const [lessonTab, setLessonTab] = useState<LessonTab>('upcoming');
  const [activeTab, setActiveTab] = useState<DashboardTab>('bookings');
  const [displayedTab, setDisplayedTab] = useState<DashboardTab>('bookings');
  const [searchQuery, setSearchQuery] = useState('');
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslateY = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const isAnimatingRef = useRef(false);
  const pendingTabRef = useRef<DashboardTab | null>(null);
  const displayedTabRef = useRef<DashboardTab>('bookings');
  const { translateY: bottomNavTranslateY, onScroll: onBottomNavScroll, resetNav } =
    useBottomNavScroll();

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

  useEffect(() => {
    return () => {
      animationRef.current?.stop();
    };
  }, []);

  function settleContentInteractive() {
    contentOpacity.setValue(1);
    contentTranslateY.setValue(0);
    isAnimatingRef.current = false;
  }

  function runFadeIn() {
    contentTranslateY.setValue(6);
    animationRef.current = Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: FADE_IN_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: FADE_IN_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]);
    animationRef.current.start(({ finished }) => {
      settleContentInteractive();

      if (!finished) {
        return;
      }

      const pending = pendingTabRef.current;
      pendingTabRef.current = null;
      if (pending && pending !== displayedTabRef.current) {
        transitionToTab(pending);
      }
    });
  }

  function transitionToTab(nextTab: DashboardTab) {
    if (nextTab === displayedTabRef.current && !isAnimatingRef.current) {
      setActiveTab(nextTab);
      settleContentInteractive();
      return;
    }

    if (isAnimatingRef.current) {
      pendingTabRef.current = nextTab;
      setActiveTab(nextTab);
      return;
    }

    isAnimatingRef.current = true;
    setActiveTab(nextTab);
    resetNav();
    animationRef.current?.stop();

    animationRef.current = Animated.timing(contentOpacity, {
      toValue: 0,
      duration: FADE_OUT_MS,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    });

    animationRef.current.start(({ finished }) => {
      if (!finished) {
        settleContentInteractive();
        return;
      }

      const tabToShow = pendingTabRef.current ?? nextTab;
      pendingTabRef.current = null;
      displayedTabRef.current = tabToShow;
      setDisplayedTab(tabToShow);
      setActiveTab(tabToShow);
      resetNav();
      runFadeIn();
    });
  }

  function renderTab(tab: DashboardTab) {
    switch (tab) {
      case 'school':
        return <SchoolsScreen onScroll={onBottomNavScroll} />;
      case 'bookings':
        return (
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
              showsVerticalScrollIndicator={false}
              onScroll={onBottomNavScroll}
              scrollEventThrottle={8}>
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
        );
      case 'earnings':
        return <WeeklyEarningsScreen onScroll={onBottomNavScroll} />;
      case 'profile':
        return <AccountScreen onClose={() => transitionToTab('bookings')} />;
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.content}>
        <Animated.View
          pointerEvents="auto"
          style={[
            styles.animatedContent,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslateY }],
            },
          ]}>
          {renderTab(displayedTab)}
        </Animated.View>
      </View>

      {activeTab !== 'profile' && displayedTab !== 'profile' ? (
        <DashboardBottomNav
          activeTab={activeTab}
          onTabChange={transitionToTab}
          translateY={bottomNavTranslateY}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  animatedContent: {
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
});
