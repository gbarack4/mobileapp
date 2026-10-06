import { useAuth } from "@/lib/auth/auth-provider";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";

import {
  completeStripeConnect,
  startStripeConnect,
  type StripeConnectResult,
} from "@/lib/stripe/connect-flow";
import {
  disconnectInstructorStripeSchool,
  getInstructorStripeSchools,
  getInstructorStripeStatus,
  getInstructorStripeDashboard,
} from "@/services/instructor-stripe";
import type {
  InstructorStripeSchool,
  SchoolStripeConnection,
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

function mapSchoolConnection(
  connection: InstructorStripeSchool,
): SchoolStripeConnection {
  return {
    schoolId: connection.schoolId,
    name: connection.name,
    initials: getInitials(connection.name),
    avatarColor: getAvatarColor(connection.schoolId),
    stripeStatus: connection.payoutConnectionStatus,
  };
}

function singleParam(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}
function resultMessage(result: StripeConnectResult): string {
  if (result === "cancelled")
    return "Stripe connection was cancelled. You can try again.";
  return result.payoutConnectionStatus === "connected"
    ? "Stripe connected successfully."
    : "Stripe account linked. Complete any outstanding requirements in your Stripe Dashboard, then refresh the status.";
}

export function useInstructorStripe() {
  const { getToken, userId, isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{
    schoolId?: string | string[];
    stripeOAuthState?: string | string[];
    stripeOAuthCode?: string | string[];
    stripeOAuthError?: string | string[];
  }>();
  const [connections, setConnections] = useState<SchoolStripeConnection[]>([]);
  const [busySchoolId, setBusySchoolId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const busy = useRef(false);
  const identity = useRef(userId);
  identity.current = userId;
  const handledCallback = useRef<string | null>(null);
  const loadVersion = useRef(0);
  const connectedCount = useMemo(
    () => connections.filter((c) => c.stripeStatus === "connected").length,
    [connections],
  );

  const loadSchools = useCallback(async () => {
    if (!isLoaded) return;
    const version = ++loadVersion.current;
    if (!isSignedIn || !userId) {
      setConnections([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in to manage Stripe payouts.");
      const schools = await getInstructorStripeSchools(token);
      if (identity.current === userId && version === loadVersion.current)
        setConnections(schools.map(mapSchoolConnection));
    } catch (e) {
      if (identity.current === userId && version === loadVersion.current) {
        setError(
          e instanceof Error ? e.message : "Failed to load Stripe connections.",
        );
      }
    } finally {
      if (version === loadVersion.current) setIsLoading(false);
    }
  }, [getToken, isLoaded, isSignedIn, userId]);

  const runAction = useCallback(
    async (schoolId: string, action: () => Promise<void>) => {
      if (busy.current || !userId) return;
      busy.current = true;
      setBusySchoolId(schoolId);
      setError(null);
      setNotice(null);
      try {
        await action();
      } catch (e) {
        if (identity.current === userId)
          setError(
            e instanceof Error
              ? e.message
              : "Stripe request failed. Please try again.",
          );
      } finally {
        busy.current = false;
        setBusySchoolId(null);
      }
    },
    [userId],
  );

  const requireToken = useCallback(async () => {
    const token = await getToken();
    if (!token || identity.current !== userId)
      throw new Error("Please sign in to manage Stripe payouts.");
    return token;
  }, [getToken, userId]);

  const connect = useCallback(
    (schoolId: string) =>
      runAction(schoolId, async () => {
        const result = await startStripeConnect(schoolId);
        if (result !== undefined && identity.current === userId) {
          setNotice(resultMessage(result));
          await loadSchools();
        }
      }),
    [loadSchools, runAction, userId],
  );

  const disconnect = useCallback(
    (schoolId: string) =>
      runAction(schoolId, async () => {
        await disconnectInstructorStripeSchool(schoolId, await requireToken());
        if (identity.current !== userId) return;
        setNotice("Stripe payouts disconnected for this school.");
        await loadSchools();
      }),
    [loadSchools, requireToken, runAction, userId],
  );

  const refreshStatus = useCallback(
    (schoolId: string) =>
      runAction(schoolId, async () => {
        await getInstructorStripeStatus(schoolId, await requireToken());
        await loadSchools();
      }),
    [loadSchools, requireToken, runAction],
  );

  const openDashboard = useCallback(
    (schoolId: string) =>
      runAction(schoolId, async () => {
        const result = await getInstructorStripeDashboard(
          schoolId,
          await requireToken(),
        );
        const url = new URL(result.url);
        if (url.origin !== "https://dashboard.stripe.com")
          throw new Error("Invalid Stripe Dashboard link.");
        if (identity.current !== userId) return;
        if (Platform.OS === "web") {
          window.location.assign(result.url);
        } else {
          await WebBrowser.openBrowserAsync(result.url);
          await getInstructorStripeStatus(schoolId, await requireToken());
          await loadSchools();
        }
      }),
    [loadSchools, requireToken, runAction, userId],
  );

  useEffect(() => {
    void loadSchools();
  }, [loadSchools]);
  
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && !busy.current) void loadSchools();
    });
    return () => subscription.remove();
  }, [loadSchools]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;
    if (
      !params.stripeOAuthState &&
      !params.stripeOAuthCode &&
      !params.stripeOAuthError
    )
      return;
    const callback = {
      schoolId: singleParam(params.schoolId),
      state: singleParam(params.stripeOAuthState),
      code: singleParam(params.stripeOAuthCode),
      error: singleParam(params.stripeOAuthError),
    };
    const key = JSON.stringify([
      userId,
      params.schoolId,
      params.stripeOAuthState,
      params.stripeOAuthCode,
      params.stripeOAuthError,
    ]);
    if (handledCallback.current === key) return;
    handledCallback.current = key;
    setBusySchoolId(callback.schoolId ?? null);
    busy.current = true;
    setError(null);
    setNotice(null);   
    if (Platform.OS === "web")
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname,
      );
    void (async () => {
      try {
        if (
          [
            params.schoolId,
            params.stripeOAuthState,
            params.stripeOAuthCode,
            params.stripeOAuthError,
          ].some(Array.isArray)
        ) {
          throw new Error("Invalid Stripe callback. Please connect again.");
        }
        const result = await completeStripeConnect(callback);
        if (identity.current !== userId) return;
        setNotice(resultMessage(result));
        await loadSchools();
      } catch (e) {
        if (identity.current === userId)
          setError(
            e instanceof Error
              ? e.message
              : "Could not complete Stripe connection. Please connect again.",
          );
      } finally {
        busy.current = false;
        setBusySchoolId(null);
        if (identity.current === userId)
          router.replace("/dashboard/account/payment");
      }
    })();
  }, [
    isLoaded,
    isSignedIn,
    userId,
    params.schoolId,
    params.stripeOAuthState,
    params.stripeOAuthCode,
    params.stripeOAuthError,
    loadSchools,
    router,
  ]);

  return {
    connections,
    connectedCount,
    totalCount: connections.length,
    busySchoolId,
    isLoading,
    error,
    notice,
    connect,
    reconnect: connect,
    disconnect,
    openDashboard,
    refreshStatus,
    refetch: loadSchools,
  };
}
