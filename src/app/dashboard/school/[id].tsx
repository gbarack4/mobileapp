import { useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SchoolDetailProfile } from '../../../components/schools/school-detail-profile';
import { colors, spacing } from '../../../constants/theme';
import { getSchoolById } from '../../../utils/schools';
import { goBackOr } from '../../../utils/navigation';

export default function SchoolDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const school = getSchoolById(id ?? '');

  if (!school) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.missingState}>
          <Text style={styles.missingTitle}>School not found</Text>
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
