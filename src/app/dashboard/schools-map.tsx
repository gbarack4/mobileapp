import { useAuth } from "@clerk/clerk-expo";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SchoolsMapChrome } from "../../components/schools/schools-map-chrome";
import { SchoolsMapView } from "../../components/schools/schools-map-view";
import { colors, spacing } from "../../constants/theme";
import { searchSchools } from "../../services/schools";
import type { School } from "../../types/school";
import { goBackOr } from "../../utils/navigation";

export default function SchoolsMapScreen() {
  const { getToken } = useAuth();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);

  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [hasAttemptedLocation, setHasAttemptedLocation] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setUserLocation({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          });
        }
      } catch (err) {
        console.warn("Failed to get location on map:", err);
      } finally {
        setHasAttemptedLocation(true);
      }
    })();
  }, []);

  const lat = userLocation?.lat;
  const lng = userLocation?.lng;

  useEffect(() => {
    if (!hasAttemptedLocation) return;

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const results = await searchSchools(
          {
            q: q ?? "",
            originLat: lat,
            originLng: lng,
            radiusKm: 5,
          },
          getToken,
        );

        if (!cancelled) {
          setSchools(results);
        }
      } catch (err) {
        console.warn("Failed to load schools for map:", err);
        if (!cancelled) {
          setSchools([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [q, lat, lng, hasAttemptedLocation]);

  function handleSchoolPress(schoolId: string) {
    setSelectedSchoolId(schoolId);
    router.push(`/dashboard/school/${schoolId}`);
  }

  if (isLoading || !hasAttemptedLocation) {
    return (
      <SafeAreaView style={styles.emptySafeArea} edges={["top", "bottom"]}>
        <SchoolsMapChrome onBack={() => goBackOr("/dashboard")} />
        <View style={styles.emptyState}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.emptySubtitle}>Loading map…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screen}>
      {schools.length > 0 || userLocation ? (
        <>
          <SchoolsMapView
            schools={schools}
            selectedSchoolId={selectedSchoolId}
            onSelectSchool={handleSchoolPress}
            userLocation={userLocation}
          />
          <SchoolsMapChrome onBack={() => goBackOr("/dashboard")} />
        </>
      ) : (
        <SafeAreaView style={styles.emptySafeArea} edges={["top", "bottom"]}>
          <SchoolsMapChrome onBack={() => goBackOr("/dashboard")} />
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No schools on map</Text>
            <Text style={styles.emptySubtitle}>
              Try a different school name in search.
            </Text>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptySafeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
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
});
