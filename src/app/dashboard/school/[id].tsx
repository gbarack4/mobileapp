import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SchoolDetailProfile } from '../../../components/schools/school-detail-profile';
import { colors, spacing } from '../../../constants/theme';
import { getSchool } from '../../../services/schools';
import type { School } from '../../../types/school';
import { goBackOr } from '../../../utils/navigation';

export default function SchoolDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [school, setSchool] = useState<School | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id) {
        setError('School not found');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await getSchool(id);
        if (!cancelled) {
          setSchool(result);
        }
      } catch (err) {
        if (!cancelled) {
          setSchool(null);
          setError(err instanceof Error ? err.message : 'School not found');
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
  }, [id]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.missingState}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.missingSubtitle}>Loading school…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!school) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.missingState}>
          <Text style={styles.missingTitle}>School not found</Text>
          {error ? <Text style={styles.missingSubtitle}>{error}</Text> : null}
          <Pressable onPress={() => goBackOr('/dashboard')} style={styles.missingButton}>
            <Text style={styles.missingButtonText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  function handleJoin() {
    // TODO: connect to NestJS join-school API
    goBackOr('/dashboard');
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <SchoolDetailProfile
        school={school}
        onClose={() => goBackOr('/dashboard')}
        onJoin={handleJoin}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
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
  missingSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
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
