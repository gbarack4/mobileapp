import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Logo } from "../../components/logo";
import { CongratulationsPieces } from "../../components/onboarding/congratulations-pieces";
import { colors, radius, spacing } from "../../constants/theme";

type PressableState = {
  pressed: boolean;
  hovered?: boolean;
};

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 94, 255, 0.14)" } : undefined;
const USE_NATIVE_DRIVER = Platform.OS !== "web";
const EASE_OUT = Easing.out(Easing.cubic);

export default function OnboardingWelcomeScreen() {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.78)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(18)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 480,
        easing: EASE_OUT,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 68,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 420,
        delay: 140,
        easing: EASE_OUT,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(titleTranslateY, {
        toValue: 0,
        duration: 420,
        delay: 140,
        easing: EASE_OUT,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 420,
        delay: 240,
        easing: EASE_OUT,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(subtitleTranslateY, {
        toValue: 0,
        duration: 420,
        delay: 240,
        easing: EASE_OUT,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 440,
        delay: 360,
        easing: EASE_OUT,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(buttonTranslateY, {
        toValue: 0,
        duration: 440,
        delay: 360,
        easing: EASE_OUT,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [
    buttonOpacity,
    buttonTranslateY,
    logoOpacity,
    logoScale,
    subtitleOpacity,
    subtitleTranslateY,
    titleOpacity,
    titleTranslateY,
  ]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <CongratulationsPieces />

      <View style={styles.content}>
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          }}
        >
          <Logo size={64} />
        </Animated.View>

        <View style={styles.copy}>
          <Animated.Text
            style={[
              styles.title,
              {
                opacity: titleOpacity,
                transform: [{ translateY: titleTranslateY }],
              },
            ]}
          >
            Welcome to Instructors Hub
          </Animated.Text>
          <Animated.Text
            style={[
              styles.subtitle,
              {
                opacity: subtitleOpacity,
                transform: [{ translateY: subtitleTranslateY }],
              },
            ]}
          >
            Your success begins here.
          </Animated.Text>
        </View>

        <Animated.View
          style={[
            styles.buttonWrap,
            {
              opacity: buttonOpacity,
              transform: [{ translateY: buttonTranslateY }],
            },
          ]}
        >
          <Pressable
            onPress={() => router.replace("/dashboard")}
            android_ripple={ANDROID_RIPPLE}
            style={({ pressed, hovered }: PressableState) => [
              styles.primaryButton,
              hovered && !pressed && styles.primaryButtonHovered,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Access dashboard</Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.xxl,
  },
  copy: {
    gap: spacing.md,
    alignSelf: "stretch",
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: "center",
  },
  buttonWrap: {
    alignSelf: "stretch",
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web"
      ? ({
          outlineStyle: "none",
          transition: "background-color 0.15s ease",
        } as object)
      : {}),
  },
  primaryButtonHovered: {
    backgroundColor: colors.primaryHover,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "600",
  },
  buttonPressed: {
    opacity: 0.9,
  },
});
