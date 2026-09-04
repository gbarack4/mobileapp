import { useUser } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import { router, usePathname } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AccountScreen } from "../../components/account/account-screen";
import { DashboardBottomNav } from "../../components/dashboard/dashboard-bottom-nav";
import { LessonCard } from "../../components/dashboard/lesson-card";
import { LessonTabs } from "../../components/dashboard/lesson-tabs";
import { SearchBar } from "../../components/dashboard/search-bar";
import { CalendarIcon } from "../../components/icons/dashboard-icons";
import { WeeklyEarningsScreen } from "../../components/earnings/weekly-earnings-screen";
import { InboxScreen } from "../../components/inbox/inbox-screen";
import { SchoolsScreen } from "../../components/schools/schools-screen";
import { colors, spacing } from "../../constants/theme";
import { useBottomNavScroll } from "../../hooks/use-bottom-nav-scroll";
import { useInstructorBookings } from "../../hooks/use-instructor-bookings";
import { getSuprSendClient } from "../../services/suprsend";
import type { DashboardTab, Lesson, LessonTab } from "../../types/dashboard";
import type { InstructorBooking } from "../../types/instructor-bookings";

const SECTION_TITLES: Record<LessonTab, string> = {
  upcoming: "Upcoming lessons",
  completed: "Completed lessons",
  cancelled: "Cancelled lessons",
};

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 94, 255, 0.08)" } : undefined;

const FADE_OUT_MS = 120;
const FADE_IN_MS = 160;
const USE_NATIVE_DRIVER = Platform.OS !== "web";

function formatInTimeZone(
  date: Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      ...options,
      timeZone,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-US", options).format(date);
  }
}

function formatDuration(startDatetime: string, endDatetime: string): string {
  const start = new Date(startDatetime).getTime();
  const end = new Date(endDatetime).getTime();
  const minutes = Math.max(0, Math.round((end - start) / 60_000));

  if (minutes < 60) {
    return `${minutes} min`;
  }

  if (minutes % 60 === 0) {
    const hours = minutes / 60;

    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  const hours = minutes / 60;

  return `${Number(hours.toFixed(2))} hours`;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getPickupLocation(booking: InstructorBooking): string {
  const address = booking.pickupAddress?.trim();

  if (address) {
    return address;
  }

  const suburb = booking.pickupSuburb?.trim();
  const postcode = booking.pickupPostcode?.trim();

  const location = [suburb, postcode].filter(Boolean).join(" ");

  return location || "Pickup location unavailable";
}

function mapInstructorBookingToLesson(booking: InstructorBooking): Lesson {
  const start = new Date(booking.startDatetime);
  const timeZone = booking.school.timezone;

  const dayOfWeek = formatInTimeZone(start, timeZone, {
    weekday: "short",
  }).toUpperCase();

  const day = formatInTimeZone(start, timeZone, {
    day: "numeric",
  });

  const month = formatInTimeZone(start, timeZone, {
    month: "short",
  }).toUpperCase();

  const year = formatInTimeZone(start, timeZone, {
    year: "numeric",
  });

  const time = formatInTimeZone(start, timeZone, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).toUpperCase();

  return {
    id: booking.id,
    dayOfWeek,
    day,
    month,
    year,
    time,
    title: booking.school.name,
    duration: formatDuration(booking.startDatetime, booking.endDatetime),
    status: booking.status === "confirmed" ? "upcoming" : booking.status,
    locationName: booking.school.name,
    locationAddress: getPickupLocation(booking),
    latitude: 0,
    longitude: 0,
    schoolLogoUrl: booking.school.logoUrl ?? undefined,
    studentInitials: getInitials(booking.student.name),
    studentName: booking.student.name,
    studentEmail: booking.student.email ?? "",
    studentPhone: booking.student.phone ?? "",
    studentSubtitle: "",
    studentAvatarUrl: undefined,
  };
}

export default function DashboardScreen() {
  const pathname = usePathname();

  const [lessonTab, setLessonTab] = useState<LessonTab>("upcoming");
  const [activeTab, setActiveTab] = useState<DashboardTab>("bookings");
  const [displayedTab, setDisplayedTab] = useState<DashboardTab>("bookings");
  const [searchQuery, setSearchQuery] = useState("");

  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslateY = useRef(new Animated.Value(0)).current;

  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const isAnimatingRef = useRef(false);
  const pendingTabRef = useRef<DashboardTab | null>(null);
  const displayedTabRef = useRef<DashboardTab>("bookings");

  const {
    translateY: bottomNavTranslateY,
    onScroll: onBottomNavScroll,
    resetNav,
  } = useBottomNavScroll();

  const {
    bookings,
    loading: bookingsLoading,
    error: bookingsError,
    refetch: refetchBookings,
  } = useInstructorBookings();

  const isDashboardRoot =
    pathname === "/dashboard" || pathname === "/dashboard/";

  const showBottomNav =
    isDashboardRoot && activeTab !== "profile" && displayedTab !== "profile";

  const { user } = useUser();
  const queryClient = useQueryClient();
  const email = user?.primaryEmailAddress?.emailAddress;

  useEffect(() => {
    if (!email || Platform.OS !== "web") {
      return;
    }

    let feedClient: ReturnType<
      ReturnType<typeof getSuprSendClient>["feeds"]["initialize"]
    > | null = null;

    const handleStoreUpdate = () => {
      queryClient.invalidateQueries({
        queryKey: ["instructor-invites"],
      });
    };

    const setup = async () => {
      try {
        const suprSend = getSuprSendClient();

        await suprSend.identify(email);

        feedClient = suprSend.feeds.initialize();

        feedClient.emitter.on("feed.store_update", handleStoreUpdate);

        feedClient.initializeSocketConnection();
      } catch (error) {
        console.error("[SuprSend] Failed to init:", error);
      }
    };

    void setup();

    return () => {
      feedClient?.emitter.off("feed.store_update", handleStoreUpdate);

      feedClient?.remove();
    };
  }, [email, queryClient]);

  const allLessons = useMemo(
    () => bookings.map(mapInstructorBookingToLesson),
    [bookings],
  );

  const lessons = useMemo(() => {
    const tabLessons = allLessons.filter(
      (lesson) => lesson.status === lessonTab,
    );

    const trimmedQuery = searchQuery.trim().toLowerCase();

    if (!trimmedQuery) {
      return tabLessons;
    }

    return tabLessons.filter((lesson) => {
      const searchableText = [
        lesson.title,
        lesson.studentName,
        lesson.studentEmail,
        lesson.studentPhone,
        lesson.locationAddress,
        lesson.locationName,
        lesson.time,
        lesson.duration,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(trimmedQuery);
    });
  }, [allLessons, lessonTab, searchQuery]);

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

  function renderBookingsContent() {
    if (bookingsLoading) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading lessons...</Text>
        </View>
      );
    }

    if (bookingsError) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.errorTitle}>Unable to load lessons</Text>

          <Text style={styles.emptySubtitle}>{bookingsError}</Text>

          <Pressable
            onPress={() => void refetchBookings()}
            android_ripple={ANDROID_RIPPLE}
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.retryButtonText}>Try again</Text>
          </Pressable>
        </View>
      );
    }

    if (lessons.length > 0) {
      return lessons.map((lesson) => (
        <LessonCard key={lesson.id} lesson={lesson} />
      ));
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>
          {searchQuery.trim()
            ? "No matching lessons"
            : `No ${lessonTab} lessons`}
        </Text>

        <Text style={styles.emptySubtitle}>
          {searchQuery.trim()
            ? "Try a different search term."
            : "Lessons will appear here once scheduled."}
        </Text>
      </View>
    );
  }

  function renderTab(tab: DashboardTab) {
    switch (tab) {
      case "school":
        return <SchoolsScreen onScroll={onBottomNavScroll} />;

      case "bookings":
        return (
          <View style={styles.screen}>
            <View style={styles.header}>
              <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

              <LessonTabs activeTab={lessonTab} onTabChange={setLessonTab} />

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {SECTION_TITLES[lessonTab]}
                </Text>

                <Pressable
                  onPress={() => router.push("/dashboard/calendar")}
                  android_ripple={ANDROID_RIPPLE}
                  style={styles.calendarLink}
                >
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
              scrollEventThrottle={8}
            >
              {renderBookingsContent()}
            </ScrollView>
          </View>
        );

      case "inbox":
        return <InboxScreen onScroll={onBottomNavScroll} />;

      case "earnings":
        return <WeeklyEarningsScreen onScroll={onBottomNavScroll} />;

      case "profile":
        return <AccountScreen onClose={() => transitionToTab("bookings")} />;
    }
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
      pointerEvents={isDashboardRoot ? "auto" : "none"}
    >
      <View
        style={styles.content}
        pointerEvents={isDashboardRoot ? "auto" : "none"}
      >
        <Animated.View
          pointerEvents={isDashboardRoot ? "auto" : "none"}
          style={[
            styles.animatedContent,
            {
              opacity: contentOpacity,
              transform: [
                {
                  translateY: contentTranslateY,
                },
              ],
            },
          ]}
        >
          {renderTab(displayedTab)}
        </Animated.View>
      </View>

      {showBottomNav ? (
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
    position: "relative",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
    letterSpacing: -0.1,
  },
  calendarLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  calendarText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  loadingState: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyState: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eef2f7",
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.error,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  retryButton: {
    marginTop: spacing.sm,
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.white,
  },
  pressed: {
    opacity: 0.85,
  },
});
