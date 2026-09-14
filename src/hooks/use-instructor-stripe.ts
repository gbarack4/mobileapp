import { useAuth } from "@clerk/clerk-expo";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Linking } from "react-native";

import {
  createInstructorStripeOnboarding,
  disconnectInstructorStripeSchool,
  getInstructorStripeSchools,
  getInstructorStripeStatus,
  reconnectInstructorStripeSchool,
} from "@/services/instructor-stripe";
import type {
  InstructorStripeSchool,
  SchoolStripeConnection,
  SchoolStripeStatus,
} from "@/types/payment";

const AVATAR_COLORS = ["#2563eb", "#7c3aed", "#0f766e", "#b45309"] as const;

function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "S";
}

function getAvatarColor(schoolId: string): string {
  let hash = 0;

  for (let index = 0; index < schoolId.length; index += 1) {
    hash = (hash * 31 + schoolId.charCodeAt(index)) >>> 0;
  }

  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function mapStripeStatus(
  connection: InstructorStripeSchool,
): SchoolStripeStatus {
  if (connection.payoutConnectionStatus === "disconnected") {
    return "disconnected";
  }

  if (
    connection.payoutConnectionStatus === "connected" &&
    connection.stripeRecipientStatus === "active"
  ) {
    return "connected";
  }

  if (
    connection.payoutConnectionStatus === "pending" ||
    (connection.payoutConnectionStatus === "connected" &&
      (connection.stripeRecipientStatus === "pending" ||
        connection.stripeRecipientStatus === "restricted"))
  ) {
    return "pending";
  }

  return "not_connected";
}

function mapSchoolConnection(
  connection: InstructorStripeSchool,
): SchoolStripeConnection {
  return {
    schoolId: connection.schoolId,
    name: connection.name,
    initials: getInitials(connection.name),
    avatarColor: getAvatarColor(connection.schoolId),
    stripeStatus: mapStripeStatus(connection),
  };
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function useInstructorStripe() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const params = useLocalSearchParams<{
    stripe?: string | string[];
    schoolId?: string | string[];
  }>();

  const [connections, setConnections] = useState<SchoolStripeConnection[]>([]);

  const [connectingSchoolId, setConnectingSchoolId] = useState<string | null>(
    null,
  );

  const [disconnectingSchoolId, setDisconnectingSchoolId] = useState<
    string | null
  >(null);

  const [reconnectingSchoolId, setReconnectingSchoolId] = useState<
    string | null
  >(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handledRedirectRef = useRef<string | null>(null);

  const connectedCount = useMemo(
    () =>
      connections.filter(
        (connection) => connection.stripeStatus === "connected",
      ).length,
    [connections],
  );

  const loadSchools = useCallback(async () => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      setConnections([]);
      setError("Please sign in to manage Stripe payouts.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();

      if (!token) {
        throw new Error("Authentication required.");
      }

      const schools = await getInstructorStripeSchools(token);

      setConnections(schools.map(mapSchoolConnection));
    } catch (requestError) {
      setConnections([]);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load Stripe connections.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  const connect = useCallback(
    async (schoolId: string) => {
      if (connectingSchoolId) {
        return;
      }

      setConnectingSchoolId(schoolId);
      setError(null);

      setConnections((current) =>
        current.map((connection) =>
          connection.schoolId === schoolId
            ? {
                ...connection,
                stripeStatus: "pending",
              }
            : connection,
        ),
      );

      try {
        const token = await getToken();

        if (!token) {
          throw new Error("Authentication required.");
        }

        const result = await createInstructorStripeOnboarding(schoolId, token);

        if (!result.url) {
          throw new Error("Stripe onboarding URL was not returned.");
        }

        await Linking.openURL(result.url);
      } catch (requestError) {
        await loadSchools();

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to start Stripe onboarding.",
        );
      } finally {
        setConnectingSchoolId(null);
      }
    },
    [connectingSchoolId, getToken, loadSchools],
  );

  const disconnect = useCallback(
    async (schoolId: string) => {
      if (disconnectingSchoolId) {
        return;
      }

      setDisconnectingSchoolId(schoolId);
      setError(null);

      try {
        const token = await getToken();

        if (!token) {
          throw new Error("Authentication required.");
        }

        await disconnectInstructorStripeSchool(schoolId, token);

        await loadSchools();
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to disconnect Stripe from this school.",
        );
      } finally {
        setDisconnectingSchoolId(null);
      }
    },
    [disconnectingSchoolId, loadSchools],
  );

  const reconnect = useCallback(
    async (schoolId: string) => {
      if (reconnectingSchoolId) {
        return;
      }

      setReconnectingSchoolId(schoolId);
      setError(null);

      try {
        const token = await getToken();

        if (!token) {
          throw new Error("Authentication required.");
        }

        const result = await reconnectInstructorStripeSchool(schoolId, token);

        if (result.url) {
          await Linking.openURL(result.url);
          return;
        }

        await loadSchools();
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to reconnect Stripe to this school.",
        );
      } finally {
        setReconnectingSchoolId(null);
      }
    },
    [loadSchools, reconnectingSchoolId],
  );

  const syncStatus = useCallback(
    async (schoolId: string) => {
      const token = await getToken();

      if (!token) {
        throw new Error("Authentication required.");
      }

      await getInstructorStripeStatus(schoolId, token);
      await loadSchools();
    },
    [loadSchools],
  );

  useEffect(() => {
    void loadSchools();
  }, [loadSchools]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    const stripeAction = firstParam(params.stripe);
    const schoolId = firstParam(params.schoolId);

    if (!stripeAction || !schoolId) {
      return;
    }

    if (stripeAction !== "return" && stripeAction !== "refresh") {
      return;
    }

    const redirectKey = `${stripeAction}:${schoolId}`;

    if (handledRedirectRef.current === redirectKey) {
      return;
    }

    handledRedirectRef.current = redirectKey;

    if (stripeAction === "refresh") {
      void connect(schoolId);
      return;
    }

    void (async () => {
      setError(null);

      try {
        await syncStatus(schoolId);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to refresh Stripe connection status.",
        );
      }
    })();
  }, [
    connect,
    isLoaded,
    isSignedIn,
    params.schoolId,
    params.stripe,
    syncStatus,
  ]);

  return {
    connections,
    connectedCount,
    totalCount: connections.length,

    connectingSchoolId,
    disconnectingSchoolId,
    reconnectingSchoolId,

    isLoading,
    error,

    connect,
    disconnect,
    reconnect,

    refetch: loadSchools,
    clearError: () => setError(null),
  };
}
