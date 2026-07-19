import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

import { FoldedMapIcon } from "../icons/school-icons";
import { colors, spacing } from "../../constants/theme";
import { searchSchools } from "../../services/schools";
import type { School } from "../../types/school";
import { SchoolCard } from "./school-card";
import { SchoolSearchBar } from "./school-search-bar";

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 94, 255, 0.08)" } : undefined;

export function SchoolsScreen({
  onScroll,
}: Readonly<{
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}>) {
  const [searchInput, setSearchInput] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSchools = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await searchSchools(query);
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
  }, []);

  useEffect(() => {
    void loadSchools(submittedQuery);
  }, [loadSchools, submittedQuery]);

  function handleSearch() {
    setSubmittedQuery(searchInput.trim());
  }

  function handleSelectSuggestion(school: School) {
    setSearchInput(school.name);
    setSubmittedQuery(school.name);
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
          onSelectSuggestion={handleSelectSuggestion}
        />

        <Pressable
          onPress={() =>
            router.push({
              pathname: "/dashboard/schools-map",
              params: submittedQuery ? { q: submittedQuery } : {},
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
        {isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.emptySubtitle}>Loading schools…</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Couldn’t load schools</Text>
            <Text style={styles.emptySubtitle}>{error}</Text>
            <Pressable
              onPress={() => void loadSchools(submittedQuery)}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : schools.length > 0 ? (
          schools.map((school) => (
            <SchoolCard key={school.id} school={school} onJoin={handleJoin} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No schools found</Text>
            <Text style={styles.emptySubtitle}>
              {submittedQuery
                ? "Try a different school name."
                : "No active schools in the database yet."}
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
