import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SchoolsMapChrome } from '../../components/schools/schools-map-chrome';
import { SchoolsMapView } from '../../components/schools/schools-map-view';
import { colors, spacing } from '../../constants/theme';
import { searchSchools } from '../../services/schools';
import type { School } from '../../types/school';
import { goBackOr } from '../../utils/navigation';

export default function SchoolsMapScreen() {
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const results = await searchSchools(q ?? '');
        if (!cancelled) {
          setSchools(results);
        }
      } catch {
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
  }, [q]);

  function handleSchoolPress(schoolId: string) {
    setSelectedSchoolId(schoolId);
    router.push(`/dashboard/school/${schoolId}`);
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.emptySafeArea} edges={['top', 'bottom']}>
        <SchoolsMapChrome onBack={() => goBackOr('/dashboard')} />
        <View style={styles.emptyState}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.emptySubtitle}>Loading schools…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screen}>
      {schools.length > 0 ? (
        <>
          <SchoolsMapView
            schools={schools}
            selectedSchoolId={selectedSchoolId}
            onSelectSchool={handleSchoolPress}
          />
          <SchoolsMapChrome onBack={() => goBackOr('/dashboard')} />
        </>
      ) : (
        <SafeAreaView style={styles.emptySafeArea} edges={['top', 'bottom']}>
          <SchoolsMapChrome onBack={() => goBackOr('/dashboard')} />
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
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
