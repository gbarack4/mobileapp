import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";

import { SchoolInviteAcceptScreen } from "@/components/invite/school-invite-accept-screen";
import { colors } from "@/constants/theme";
import {
  acceptSchoolInvite,
  declineSchoolInvite,
  getSchoolInvite,
} from "@/services/school-invite";

export default function InviteRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: invite,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["school-invite", id],
    queryFn: async () => {
      const token = await getToken();
      return getSchoolInvite(id!, token);
    },
    enabled: !!id,
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return acceptSchoolInvite(id!, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-invite"] });
      queryClient.invalidateQueries({ queryKey: ["instructor-schools"] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return declineSchoolInvite(id!, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-invite"] });
    },
  });

  if (!id) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          This invitation link is missing an ID.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !invite) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          Failed to load invitation. It may have expired or you don't have
          access.
        </Text>
      </View>
    );
  }

  return (
    <SchoolInviteAcceptScreen
      invite={invite}
      accepting={acceptMutation.isPending}
      declining={declineMutation.isPending}
      onAccept={() => acceptMutation.mutateAsync()}
      onDecline={() => declineMutation.mutateAsync()}
      onClose={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace("/dashboard");
        }
      }}
      onSuccessContinue={() => router.replace("/dashboard")}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: 24,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: "center",
  },
});
