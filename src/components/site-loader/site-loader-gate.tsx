import * as SplashScreen from "expo-splash-screen";
import { type ReactNode, useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";

import { colors } from "@/constants/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

const SPLASH_MS = 2000;

type SiteLoaderGateProps = Readonly<{
  children: ReactNode;
}>;

/**
 * Single splash only: keep the native splash visible for 2 seconds.
 */
export function SiteLoaderGate({ children }: SiteLoaderGateProps) {
  const nativeHidden = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (nativeHidden.current) return;
      nativeHidden.current = true;
      SplashScreen.hideAsync().catch(() => {});
    }, SPLASH_MS);

    return () => clearTimeout(t);
  }, []);

  // box-none: this wrapper must never intercept login/button presses.
  return (
    <View style={styles.root} pointerEvents="box-none">
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary,
  },
});
