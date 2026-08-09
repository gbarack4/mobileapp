import {
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Logo } from "@/components/logo";
import { colors } from "@/constants/theme";

type SiteLoaderProps = Readonly<{
  label?: string;
  onReady?: () => void;
}>;

function SplashContent({
  label,
  onReady,
}: Readonly<{ label: string; onReady?: () => void }>) {
  return (
    <View
      style={styles.screen}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      onLayout={() => onReady?.()}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={styles.content}>
        <Logo size={88} variant="inverse" />
        <Text style={styles.brand}>Instructor Hub</Text>
      </View>
    </View>
  );
}

export function SiteLoader({
  label = "Loading",
  onReady,
}: SiteLoaderProps) {
  // Web: plain full-screen view (Modal can flash).
  if (Platform.OS === "web") {
    return <SplashContent label={label} onReady={onReady} />;
  }

  // Native: Modal with no animation sits above the native stack (which is white).
  return (
    <Modal
      visible
      animationType="none"
      transparent={false}
      statusBarTranslucent
      presentationStyle="fullScreen"
    >
      <SplashContent label={label} onReady={onReady} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    gap: 20,
  },
  brand: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: -0.3,
  },
});
