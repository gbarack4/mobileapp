import { SiteLoaderGate } from "@/components/site-loader/site-loader-gate";
import { DEV_BYPASS_AUTH } from "@/constants/dev";
import { colors } from "@/constants/theme";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SecureStore from "expo-secure-store";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { Platform, StatusBar } from "react-native";

// Keep the native splash up until our blue loader has painted.
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
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (DEV_BYPASS_AUTH) return;
    if (!isLoaded) return;

    const inPublicGroup =
      segments[0] === "login" ||
      segments[0] === "signup" ||
      segments[0] === "sso-callback" ||
      segments[0] === "invite";

    if (!isSignedIn && !inPublicGroup) {
      router.replace("/login");
    } else if (isSignedIn && inPublicGroup) {
      router.replace("/dashboard");
    }
  }, [isSignedIn, isLoaded, segments, router]);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <SiteLoaderGate>
        <RootLayoutNav />
      </SiteLoaderGate>
    </ClerkProvider>
  );
}
