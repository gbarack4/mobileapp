import { useAuth } from "@clerk/clerk-expo";
import { useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { InstructorAccessDenied } from "./instructor-access-denied";

export function RoleGuard({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  const [accessDenied, setAccessDenied] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (segments[0] !== "dashboard") return;

    if (!isSignedIn) {
      router.replace("/login");
      return;
    }

    const verifyAccess = async () => {
      try {
        const token = await getToken();
        const apiUrl = process.env.EXPO_PUBLIC_API_URL;

        const res = await fetch(
          `${apiUrl}/auth/verify-access?app=instructor_app`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!res.ok) {
          setAccessDenied(true);
        }
      } catch (error) {
        console.error("RoleGuard fetch error:", error);
        setAccessDenied(true);
      } finally {
        setIsFetching(false);
      }
    };

    verifyAccess();
  }, [isLoaded, isSignedIn, getToken, segments, router]);

  if (!isLoaded || isFetching) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (accessDenied) {
    return <InstructorAccessDenied />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
});
