import { AuthStatus } from "@/components/auth/auth-status";
import { SiteLoaderGate } from "@/components/site-loader/site-loader-gate";
import { DEV_BYPASS_AUTH } from "@/constants/dev";
import { colors } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/lib/auth/auth-provider";
import { getInstructorAccountStatus } from "@/services/instructor-account";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { useEffect, useState } from "react";
import { StatusBar, StyleSheet, View } from "react-native";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60_000, retry: 2 } },
});
SplashScreen.preventAutoHideAsync().catch(() => {});
SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});

function RootLayoutNav() {
  const {
    getToken,
    isLoaded,
    isSignedIn,
    userId,
    initializationError,
    retryInitialization,
    signOut,
    signOutError,
  } = useAuth();
  const segments = useSegments();
  const rootSegment = segments[0];
  const router = useRouter();
  const navigation = useRootNavigationState();
  const [attempt, setAttempt] = useState(0);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [checkingRoute, setCheckingRoute] = useState(false);

  useEffect(() => {
    if (DEV_BYPASS_AUTH || !isLoaded || !navigation?.key) return;
    let cancelled = false;
    setRouteError(null);
    const isPublic = ["login", "signup", "sso-callback", "invite"].includes(
      rootSegment ?? "",
    );
    if (!isSignedIn) {
      setCheckingRoute(false);
      if (!isPublic) router.replace("/login");
      return;
    }
    setCheckingRoute(true);
    void (async () => {
      try {
        const token = await getToken();
        if (cancelled || !token) return;
        const account = await getInstructorAccountStatus(token);
        if (cancelled) return;
        if (account.status === "onboarding_required") {
          if (rootSegment !== "onboarding") router.replace("/onboarding");
        } else if (
          account.status === "deletion_requested" ||
          account.status === "recovery_expired"
        ) {
          if (rootSegment !== "account-recovery")
            router.replace("/account-recovery");
        } else if (
          isPublic ||
          rootSegment === "onboarding" ||
          rootSegment === "account-recovery"
        ) {
          router.replace("/dashboard");
        }
      } catch {
        if (!cancelled)
          setRouteError(
            "Unable to check your account status. Please try again.",
          );
      } finally {
        if (!cancelled) setCheckingRoute(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    isLoaded,
    isSignedIn,
    userId,
    rootSegment,
    router,
    navigation?.key,
    getToken,
    attempt,
  ]);

  const message =
    signOutError?.message ?? initializationError?.message ?? routeError;
  const blocked = !DEV_BYPASS_AUTH && (!isLoaded || checkingRoute || !!message);
  const retry = signOutError
    ? signOut
    : initializationError
      ? retryInitialization
      : () => setAttempt((value) => value + 1);
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      {/* Keep the navigator mounted before route resolution calls replace(). */}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      {blocked ? (
        <View style={StyleSheet.absoluteFill}>
          <AuthStatus
            message={message ?? undefined}
            onRetry={
              message
                ? () => {
                    void retry();
                  }
                : undefined
            }
            onSignOut={
              !signOutError && (initializationError || routeError)
                ? () => {
                    void signOut();
                  }
                : undefined
            }
          />
        </View>
      ) : null}
    </View>
  );
}
export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SiteLoaderGate>
          <RootLayoutNav />
        </SiteLoaderGate>
      </AuthProvider>
    </QueryClientProvider>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
