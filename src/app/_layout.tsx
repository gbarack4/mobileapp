import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-expo";
import { getSuprSendClient } from "@/services/suprsend";
import { SiteLoaderGate } from "@/components/site-loader/site-loader-gate";
import { DEV_BYPASS_AUTH } from "@/constants/dev";
import { colors } from "@/constants/theme";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SecureStore from "expo-secure-store";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { Platform, StatusBar, View } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync().catch(() => {});
SystemUI.setBackgroundColorAsync(colors.primary).catch(() => {});

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
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (DEV_BYPASS_AUTH) return;
    if (!isLoaded) return;

    const inAuthGroup =
      segments[0] === "login" ||
      segments[0] === "signup" ||
      segments[0] === "sso-callback";

    const isSharedRoute = segments[0] === "invite";

    if (!isSignedIn && !inAuthGroup && !isSharedRoute) {
      router.replace("/login");
    } else if (isSignedIn && inAuthGroup) {
      router.replace("/dashboard");
    }
  }, [isSignedIn, isLoaded, segments, router]);

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
