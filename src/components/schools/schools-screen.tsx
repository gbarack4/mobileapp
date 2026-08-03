import { useAuth } from "@clerk/clerk-expo";
import * as Location from "expo-location";
import { router } from "expo-router";
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
import { requestSchoolJoin } from "../../services/school-membership";
import { searchSchools } from "../../services/schools";
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
    async (query: string, location: { lat: number; lng: number } | null) => {
      setIsLoading(true);
      setError(null);

      try {
        const results = await searchSchools(
          {
            q: query.trim(),
            originLat: location?.lat,
            originLng: location?.lng,
            radiusKm: 5,
          },
          () => getTokenRef.current(),
        );
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

  useEffect(() => {
    if (!isLocationReady) return;
    void loadSchools(searchInput, userLocation);
  }, [loadSchools, searchInput, userLocation, isLocationReady]);

  function handleSelectSuggestion(school: School) {
    setSearchInput(school.name);
  }

  function handleJoin(school: School) {
    requestSchoolJoin(school.id);
  }

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
            onPress={() => void loadSchools(searchInput, userLocation)}
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
        <Text style={styles.emptySubtitle}>
          {searchInput.trim()
            ? "Try a different school name."
            : "No active schools nearby."}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <SchoolSearchBar
          value={searchInput}
          onChangeText={setSearchInput}
          onSearch={() => void loadSchools(searchInput, userLocation)}
          onSelectSuggestion={handleSelectSuggestion}
        />

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
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={8}
      >
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
  mapLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
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
});
