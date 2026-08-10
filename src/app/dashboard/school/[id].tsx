import { useAuth } from "@clerk/clerk-expo";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SchoolDetailProfile } from "../../../components/schools/school-detail-profile";
import { colors, spacing } from "../../../constants/theme";
import {
  getSchool,
  requestSchoolJoin as requestApiJoin,
} from "../../../services/schools";
import type { SchoolDetail } from "../../../types/school";
import { goBackOr } from "../../../utils/navigation";

export default function SchoolDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getToken } = useAuth();

  const [school, setSchool] = useState<SchoolDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const loadSchool = useCallback(async () => {
    if (!id) {
      setError("School not found");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getSchool(id, () => getTokenRef.current());
      setSchool(result);
    } catch (err) {
      setSchool(null);
      setError(err instanceof Error ? err.message : "School not found");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadSchool();
  }, [loadSchool]);

  if (isLoading && !school) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.missingState}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.missingSubtitle}>Loading school…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!school) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.missingState}>
          <Text style={styles.missingTitle}>School not found</Text>
          {error ? <Text style={styles.missingSubtitle}>{error}</Text> : null}
          <Pressable
            onPress={() => goBackOr("/dashboard")}
            style={styles.missingButton}
          >
            <Text style={styles.missingButtonText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  async function handleJoin() {
    if (!school) return;
    try {
      await requestApiJoin(school.id, () => getTokenRef.current());
      await loadSchool();
    } catch (err) {
      console.error("Failed to join school:", err);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <SchoolDetailProfile
        school={school}
        onClose={() => goBackOr("/dashboard")}
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
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  missingTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  missingSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  missingButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  missingButtonText: {
    color: colors.white,
    fontWeight: "600",
  },
});
