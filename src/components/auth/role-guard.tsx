import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth, useClerk } from "@clerk/clerk-expo";

export function RoleGuard({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();

  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

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

        const status = res.status;
        const body = await res.text();
        console.log(`DEBUG SERVER RESPONSE: Status: ${status}, Body:`, body);

        if (res.ok) {
          setIsAuthorized(true);
        } else {
          await signOut();
          router.replace("/login");
        }
      } catch (error) {
        console.error("RoleGuard fetch error:", error);
        await signOut();
        router.replace("/login");
      }
    };

    verifyAccess();
  }, [isLoaded, isSignedIn, getToken, signOut, router]);

  if (!isLoaded || !isAuthorized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
});
