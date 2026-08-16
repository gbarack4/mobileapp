import { useAuth } from "@clerk/clerk-expo";
import * as Location from "expo-location";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors, spacing } from "../../constants/theme";

import {
  requestSchoolJoin,
  searchSchools,
  getJoinedSchools,
} from "../../services/schools";
import type { School } from "../../types/school";
import { FoldedMapIcon } from "../icons/school-icons";
import { SchoolCard } from "./school-card";
import { SchoolSearchBar } from "./school-search-bar";

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 94, 255, 0.08)" } : undefined;

export function SchoolsScreen({
  onScroll,
}: Readonly<{
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}>) {
  const { getToken } = useAuth();
  const [isLocationReady, setIsLocationReady] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const [isManageMode, setIsManageMode] = useState(false);

  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setIsLocationReady(true);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setUserLocation({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });
      } catch (err) {
        console.warn("Failed to get location:", err);
      } finally {
        setIsLocationReady(true);
      }
    })();
  }, []);

  const loadSchools = useCallback(
    async (
      query: string,
      location: { lat: number; lng: number } | null,
      manageMode: boolean,
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        let results: School[];

        if (manageMode) {
          results = await getJoinedSchools(query, () => getTokenRef.current());
        } else {
          results = await searchSchools(
            {
              q: query.trim(),
              originLat: location?.lat,
              originLng: location?.lng,
              radiusKm: query.trim() ? undefined : 5,
            },
            () => getTokenRef.current(),
          );
        }

        setSchools(results);
      } catch (err) {
        setSchools([]);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load schools from the database.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      if (!isLocationReady) return;
      void loadSchools(searchInput, userLocation, isManageMode);
    }, [loadSchools, searchInput, userLocation, isLocationReady, isManageMode]),
  );

  function handleSelectSuggestion(school: School) {
    setSearchInput(school.name);
  }

  async function handleJoin(school: School) {
    setJoinError(null);
    setIsLoading(true);
    try {
      await requestSchoolJoin(school.id, () => getTokenRef.current());
      await loadSchools(searchInput, userLocation, isManageMode);
    } catch (err) {
      console.error("Failed to join school:", err);
      setJoinError(
        err instanceof Error
          ? err.message
          : "Failed to send request. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function toggleManageMode() {
    setIsManageMode((prev) => !prev);
  }

  const getEmptySubtitle = () => {
    if (isManageMode) {
      return "You haven't joined any schools matching this search.";
    }
    if (searchInput.trim()) {
      return "Try a different school name.";
    }
    return "No active schools nearby.";
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.emptySubtitle}>Loading schools…</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Couldn’t load schools</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <Pressable
            onPress={() =>
              void loadSchools(searchInput, userLocation, isManageMode)
            }
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Try again</Text>
          </Pressable>
        </View>
      );
    }

    if (schools.length > 0) {
      return schools.map((school) => (
        <SchoolCard
          key={school.locationId ?? school.id}
          school={school}
          onJoin={handleJoin}
        />
      ));
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No schools found</Text>
        <Text style={styles.emptySubtitle}>{getEmptySubtitle()}</Text>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <SchoolSearchBar
          value={searchInput}
          onChangeText={(text) => {
            setSearchInput(text);
            if (joinError) setJoinError(null);
          }}
          onSearch={() =>
            void loadSchools(searchInput, userLocation, isManageMode)
          }
          onSelectSuggestion={handleSelectSuggestion}
        />

        <View style={styles.headerLinks}>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/dashboard/schools-map",
                params: searchInput.trim() ? { q: searchInput.trim() } : {},
              })
            }
            android_ripple={ANDROID_RIPPLE}
            style={styles.mapLink}
          >
            <Text style={styles.mapLinkText}>View map</Text>
            <FoldedMapIcon />
          </Pressable>

          <Pressable onPress={toggleManageMode} android_ripple={ANDROID_RIPPLE}>
            <Text style={styles.mapLinkText}>
              {isManageMode ? "View all" : "Manage school"}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={8}
      >
        {joinError ? (
          <View style={styles.joinErrorBanner}>
            <Text style={styles.joinErrorText}>{joinError}</Text>
          </View>
        ) : null}
        {renderContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  headerLinks: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  mapLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 2,
  },
  mapLinkText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: 96,
    gap: spacing.md,
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
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  retryButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 14,
  },
  joinErrorBanner: {
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    padding: spacing.md,
  },
  joinErrorText: {
    fontSize: 14,
    color: "#dc2626",
  },
});
