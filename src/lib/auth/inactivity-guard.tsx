import { useEffect, useRef, type ReactNode } from "react";
import {
  AppState,
  Platform,
  StyleSheet,
  View,
  type AppStateStatus,
} from "react-native";

import {
  flushLastActivity,
  getLastActivityAt,
  hasInactivityExpired,
  hydrateLastActivity,
  noteUserActivity,
  remainingInactivityMs,
  syncLastActivityFromStorage,
} from "./inactivity";

const WEB_ACTIVITY_EVENTS = [
  "pointerdown",
  "keydown",
  "touchstart",
  "wheel",
] as const;

type InactivityGuardProps = {
  enabled: boolean;
  onExpire: () => Promise<void>;
  children: ReactNode;
};

export function InactivityGuard({
  enabled,
  onExpire,
  children,
}: Readonly<InactivityGuardProps>) {
  const expireRef = useRef(onExpire);
  expireRef.current = onExpire;
  const handleActivityRef = useRef(() => {});

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    function clearTimer() {
      if (!timer) {
        return;
      }

      clearTimeout(timer);
      timer = null;
    }

    function schedule() {
      clearTimer();
      timer = setTimeout(() => {
        void expireRef.current();
      }, remainingInactivityMs());
    }

    async function checkForeground() {
      await syncLastActivityFromStorage();

      if (cancelled) {
        return;
      }

      if (hasInactivityExpired()) {
        await expireRef.current();
        return;
      }

      schedule();
    }

    function handleActivity() {
      noteUserActivity();
      schedule();
    }

    handleActivityRef.current = handleActivity;

    function handleAppState(state: AppStateStatus) {
      if (state === "active") {
        void checkForeground();
        return;
      }

      if (state === "background" || state === "inactive") {
        void flushLastActivity();
      }
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        void checkForeground();
        return;
      }

      void flushLastActivity();
    }

    void (async () => {
      await hydrateLastActivity();

      if (cancelled) {
        return;
      }

      if (hasInactivityExpired()) {
        await expireRef.current();
        return;
      }

      if (getLastActivityAt() == null) {
        noteUserActivity();
      }

      schedule();
    })();

    const appSubscription = AppState.addEventListener("change", handleAppState);

    if (Platform.OS === "web" && typeof window !== "undefined") {
      for (const event of WEB_ACTIVITY_EVENTS) {
        window.addEventListener(event, handleActivity, {
          capture: true,
          passive: true,
        });
      }

      document.addEventListener("visibilitychange", handleVisibility);
    }

    return () => {
      cancelled = true;
      handleActivityRef.current = () => {};
      clearTimer();
      appSubscription.remove();

      if (Platform.OS === "web" && typeof window !== "undefined") {
        for (const event of WEB_ACTIVITY_EVENTS) {
          window.removeEventListener(event, handleActivity, true);
        }

        document.removeEventListener("visibilitychange", handleVisibility);
      }
    };
  }, [enabled]);

  return (
    <View
      style={styles.wrap}
      collapsable={false}
      onTouchStart={enabled ? () => handleActivityRef.current() : undefined}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
});
