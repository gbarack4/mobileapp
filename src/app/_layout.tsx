import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-expo";
import { getSuprSendClient } from "@/services/suprsend";
import { SiteLoaderGate } from "@/components/site-loader/site-loader-gate";
import { DEV_BYPASS_AUTH } from "@/constants/dev";
import { colors } from "@/constants/theme";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SecureStore from "expo-secure-store";
import * as SystemUI from "expo-system-ui";
import { useEffect, useRef } from "react";
import { Platform, StatusBar, View } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getInstructorAccountStatus } from "@/services/instructor-account";

const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync().catch(() => {});
SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});

const tokenCache =
  Platform.OS !== "web"
    ? {
        async getToken(key: string) {
          try {
            return await SecureStore.getItemAsync(key);
          } catch (err) {
            console.error("SecureStore get item error: ", err);
            return null;
          }
        },
        async saveToken(key: string, value: string) {
          try {
            return await SecureStore.setItemAsync(key, value);
          } catch (err) {
            console.error("SecureStore save item error: ", err);
          }
        },
      }
    : undefined;

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env");
}

function RootLayoutNav() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
getTokenRef.current = getToken;
  const { user } = useUser();

 const segments = useSegments();
 const router = useRouter();
const rootSegment = segments[0];

useEffect(() => {
  if (DEV_BYPASS_AUTH) return;
  if (!isLoaded) return;

  let cancelled = false;

  const inPublicGroup =
    rootSegment === "login" ||
    rootSegment === "signup" ||
    rootSegment === "sso-callback" ||
    rootSegment === "invite";

  const inRecoveryScreen = rootSegment === "account-recovery";
  const inOnboardingScreen = rootSegment === "onboarding";

  if (!isSignedIn) {
    if (!inPublicGroup) {
      router.replace("/login");
    }

    return;
  }

  async function resolveSignedInRoute() {
    try {
      const token = await getTokenRef.current();

      if (!token || cancelled) {
        return;
      }

      const accountStatus = await getInstructorAccountStatus(token);

      if (cancelled) {
        return;
      }

      if (accountStatus.status === "onboarding_required") {
        if (!inOnboardingScreen) {
          router.replace("/onboarding");
        }

        return;
      }

      if (
        accountStatus.status === "deletion_requested" ||
        accountStatus.status === "recovery_expired"
      ) {
        if (!inRecoveryScreen) {
          router.replace("/account-recovery");
        }

        return;
      }

      if (
        inPublicGroup ||
        inRecoveryScreen ||
        inOnboardingScreen
      ) {
        router.replace("/dashboard");
      }
    } catch (error) {
      if (cancelled) {
        return;
      }

      console.error(
        "Failed to resolve instructor account status:",
        error,
      );
    }
  }

  void resolveSignedInRoute();

  return () => {
    cancelled = true;
  };
}, [ 
  isLoaded,
  isSignedIn,
  rootSegment,
  router,
]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    if (typeof window === "undefined") return;

    const email = user.primaryEmailAddress?.emailAddress;

    if (!email) {
      console.warn("Clerk user does not have a primary email.");
      return;
    }

    try {
      const suprSend = getSuprSendClient();

      suprSend.identify(email);
    } catch (error) {
      console.error("Failed to identify user in SuprSend:", error);
    }
  }, [isLoaded, isSignedIn, user]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </View>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <SiteLoaderGate>
          <RootLayoutNav />
        </SiteLoaderGate>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
