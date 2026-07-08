import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import { FoldedMapIcon } from '../icons/school-icons';
import { MOCK_SCHOOLS } from '../../data/mock-schools';
import { colors, spacing } from '../../constants/theme';
import type { School } from '../../types/school';
import { filterSchools } from '../../utils/schools';
import { SchoolCard } from './school-card';
import { SchoolSearchBar } from './school-search-bar';

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 94, 255, 0.08)' } : undefined;

export function SchoolsScreen({
  onScroll,
}: {
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}) {
  const [searchInput, setSearchInput] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');

  const schools = useMemo(
    () => filterSchools(MOCK_SCHOOLS, submittedQuery),
    [submittedQuery],
  );

  function handleSearch() {
    setSubmittedQuery(searchInput.trim());
  }

  function handleJoin(school: School) {
    // TODO: connect to NestJS join-school API
    router.push(`/dashboard/school/${school.id}`);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <SchoolSearchBar
          value={searchInput}
          onChangeText={setSearchInput}
          onSearch={handleSearch}
        />

        <Pressable
          onPress={() =>
            router.push({
              pathname: '/dashboard/schools-map',
              params: submittedQuery ? { q: submittedQuery } : {},
            })
          }
          android_ripple={ANDROID_RIPPLE}
          style={styles.mapLink}>
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
        scrollEventThrottle={8}>
        {schools.length > 0 ? (
          schools.map((school) => (
            <SchoolCard key={school.id} school={school} onJoin={handleJoin} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No schools found</Text>
            <Text style={styles.emptySubtitle}>
              Try a different suburb or postcode.
            </Text>
          </View>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  mapLinkText: {
    fontSize: 15,
    fontWeight: '600',
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
  pressed: {
    opacity: 0.85,
  },
});
