import { useEffect, useCallback, type ReactNode } from "react";
import { AppState, Platform, View } from "react-native";
import {
  expireInactiveSession,
  getSessionIdleRemaining,
  recordSessionActivity,
} from "./session-manager";

type Props = Readonly<{
  enabled: boolean;
  onError: (error: unknown) => void;
  children: ReactNode;
}>;

export function SessionActivityGuard({ enabled, onError, children }: Props) {
  const recordTouch = useCallback(() => {
    if (enabled) void recordSessionActivity().catch(onError);
    return false;
  }, [enabled, onError]);

  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    
    function check() {
      if (disposed) return;
      if (timer) clearTimeout(timer);
      const remaining = getSessionIdleRemaining();
      if (remaining === null) return;
      if (remaining === 0) {
        void expireInactiveSession().catch(onError);
      } else {
        timer = setTimeout(check, remaining);
      }
    }

    function activity(event: Event) {
      if (!event.isTrusted || document.visibilityState !== "visible") return;
      void recordSessionActivity().then(check).catch(onError);
    }

    function visibility() {
      if (document.visibilityState === "visible") check();
    }

    check();
    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    if (Platform.OS === "web") {
      for (const event of events) {
        window.addEventListener(event, activity, {
          capture: true,
          passive: true,
        });
      }
      document.addEventListener("visibilitychange", visibility);
      window.addEventListener("pageshow", check);
      return () => {
        disposed = true;
        if (timer) clearTimeout(timer);
        for (const event of events)
          window.removeEventListener(event, activity, true);
        document.removeEventListener("visibilitychange", visibility);
        window.removeEventListener("pageshow", check);
      };
    }

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") check();
    });
    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      subscription.remove();
    };
  }, [enabled, onError]);

  if (Platform.OS === "web") return <>{children}</>;
  return (
    <View
      style={{ flex: 1 }}
      onStartShouldSetResponderCapture={recordTouch}
      onMoveShouldSetResponderCapture={recordTouch}
    >
      {children}
    </View>
  );
}
