import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useClerk } from "@clerk/clerk-expo";

export function InstructorAccessDenied() {
  const router = useRouter();
  const { signOut } = useClerk();

  return (
    <View style={styles.centered}>
      <Text style={styles.title}>Instructor Access Required</Text>
      <Text style={styles.subtitle}>
        Your account is active, but you haven't completed the instructor profile
        yet.
      </Text>

      <Pressable
        style={styles.primaryButton}
        onPress={() => router.push("/onboarding")}
      >
        <Text style={styles.primaryButtonText}>
          Complete Instructor Profile
        </Text>
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={async () => {
          await signOut();
          router.replace("/login");
        }}
      >
        <Text style={styles.secondaryButtonText}>
          Sign out / Use another account
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#4B5563",
    fontSize: 15,
    fontWeight: "500",
  },
});
