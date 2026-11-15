import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { useAuth } from "../../lib/auth/auth-provider";
import {
  getAuthOperationVersion,
  getSessionSnapshot,
} from "../../lib/auth/session-manager";
import {
  registerIosPushToken,
  unregisterIosPushSession,
} from "../../services/ios-push-registration";

type Props = Readonly<{ enabled: boolean }>;

function validatePushEnvironment(environment: string | null): void {
  if (environment === null) {
    throw new Error(
      "APNs environment is unavailable. Check push entitlements in the native iOS build.",
    );
  }

  if (environment !== "production") {
    throw new Error(
      "This build requires an APNs sandbox configuration; the backend currently uses APNS production.",
    );
  }
}

export function IosPushRegistration({ enabled }: Props) {
  const { userId, getToken } = useAuth();

  useEffect(() => {
    if (!enabled || !userId || Platform.OS !== "ios") return;
    const ownerId = userId;
    const authVersion = getAuthOperationVersion();
    let disposed = false;
    let tokenSubscription: { remove(): void } | null = null;
    let syncing = false;

    const isCurrent = () =>
      !disposed &&
      getAuthOperationVersion() === authVersion &&
      getSessionSnapshot()?.user.id === ownerId;

    const reportError = (error: unknown) => {
      if (isCurrent()) {
        console.warn(
          "[Push] Registration failed:",
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    };

    const uploadToken = async (token: string) => {
      const accessToken = await getToken();
      if (!accessToken || !isCurrent()) return;
      await registerIosPushToken(
        { userId: ownerId, accessToken, isCurrent },
        token,
      );
    };

    const sync = async (requestPermission: boolean) => {
      if (syncing || !isCurrent() || AppState.currentState !== "active") return;
      syncing = true;
      try {
        const application = await import("expo-application");
        const environment =
          await application.getIosPushNotificationServiceEnvironmentAsync();

        if (!isCurrent()) return;

        validatePushEnvironment(environment);

        const notifications = await import("expo-notifications");
        notifications.setNotificationHandler({
          handleNotification: (notification) => {
            const currentUserId = getSessionSnapshot()?.user.id;
            const recipient =
              notification.request.content.data?.recipientUserId;
            const show =
              Boolean(currentUserId) &&
              (recipient === undefined || recipient === currentUserId);
            return Promise.resolve({
              shouldShowBanner: show,
              shouldShowList: show,
              shouldPlaySound: show,
              shouldSetBadge: false,
            });
          },
        });
        let permission = await notifications.getPermissionsAsync();
        if (!isCurrent()) return;
        if (
          requestPermission &&
          permission.canAskAgain &&
          permission.ios?.status ===
            notifications.IosAuthorizationStatus.NOT_DETERMINED
        ) {
          permission = await notifications.requestPermissionsAsync({
            ios: { allowAlert: true, allowBadge: true, allowSound: true },
          });
        }
        if (!isCurrent()) return;
        const allowed =
          permission.granted ||
          permission.ios?.status ===
            notifications.IosAuthorizationStatus.PROVISIONAL;
        if (!allowed) {
          tokenSubscription?.remove();
          tokenSubscription = null;
          const accessToken = await getToken();
          if (accessToken && isCurrent())
            await unregisterIosPushSession(ownerId, accessToken);
          return;
        }

        if (!tokenSubscription) {
          tokenSubscription = notifications.addPushTokenListener((token) => {
            if (token.type === "ios" && isCurrent())
              void uploadToken(token.data).catch(reportError);
          });
        }

        const token = await notifications.getDevicePushTokenAsync();
        if (token.type === "ios" && isCurrent()) await uploadToken(token.data);
      } catch (error: unknown) {
        reportError(error);
      } finally {
        syncing = false;
      }
    };

    const appSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void sync(true);
    });
    void sync(true);

    return () => {
      disposed = true;
      appSubscription.remove();
      tokenSubscription?.remove();
    };
  }, [enabled, userId, getToken]);

  return null;
}
