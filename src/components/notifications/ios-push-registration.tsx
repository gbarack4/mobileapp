import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AppState, Platform } from "react-native";
import { useAuth } from "../../lib/auth/auth-provider";
import { syncIosAppIconBadge } from "../../services/instructor-notifications";
import {
  getAuthOperationVersion,
  getSessionSnapshot,
} from "../../lib/auth/session-manager";
import {
  registerIosPushToken,
  unregisterIosPushSession,
} from "../../services/ios-push-registration";

type Props = Readonly<{
  enabled: boolean;
  diagnostics?: boolean;
}>;

type NotificationsModule = typeof import("expo-notifications");
type NotificationPermission = Awaited<
  ReturnType<NotificationsModule["getPermissionsAsync"]>
>;

function validatePushEnvironment(
  environment: string | null,
  isAppStoreRelease: boolean,
): void {
  // Expo reads the embedded provisioning profile, which may be absent
  // in a store-distributed app. APNs registration still validates signing.
  if (environment === null && isAppStoreRelease) return;

  if (environment === null) {
    throw new Error(
      "APNs environment is unavailable and the release type is not APP_STORE. Check the native build configuration.",
    );
  }

  if (environment !== "production") {
    throw new Error(
      "This build requires an APNs sandbox configuration; the backend currently uses APNS production.",
    );
  }
}

function configureNotificationHandler(notifications: NotificationsModule): void {
  notifications.setNotificationHandler({
    handleNotification: (notification) => {
      const currentUserId = getSessionSnapshot()?.user.id;
      const recipient = notification.request.content.data?.recipientUserId;
      const show =
        Boolean(currentUserId) &&
        (recipient === undefined || recipient === currentUserId);

      return Promise.resolve({
        shouldShowBanner: show,
        shouldShowList: show,
        shouldPlaySound: show,
        shouldSetBadge: show,
      });
    },
  });
}

function isPermissionAllowed(
  permission: NotificationPermission,
  notifications: NotificationsModule,
): boolean {
  return (
    permission.granted ||
    permission.ios?.status === notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export function IosPushRegistration({ enabled }: Props) {
  const { userId, getToken } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !userId || Platform.OS !== "ios") return;

    const ownerId = userId;
    const authVersion = getAuthOperationVersion();
    let disposed = false;
    let tokenSubscription: { remove(): void } | null = null;
    let notificationSubscription: { remove(): void } | null = null;
    let syncing = false;

    const isCurrent = () =>
      !disposed &&
      getAuthOperationVersion() === authVersion &&
      getSessionSnapshot()?.user.id === ownerId;

    const reportError = (error: unknown) => {
      if (!isCurrent()) return;

      const message = error instanceof Error ? error.message : "Unknown error";
      console.warn("[Push] Registration failed:", message);
    };

    const uploadToken = async (token: string) => {
      if (!isCurrent()) return;
      const accessToken = await getToken();
      if (!isCurrent()) return;

      if (!accessToken) {
        return;
      }

      await registerIosPushToken(
        { userId: ownerId, accessToken, isCurrent },
        token,
      );
    };

    const prepareNotifications = async (): Promise<NotificationsModule | null> => {
      const application = await import("expo-application");
      if (!isCurrent()) return null;

      const environment =
        await application.getIosPushNotificationServiceEnvironmentAsync();
      if (!isCurrent()) return null;

      let isAppStoreRelease = false;
      if (environment === null) {
        const releaseType = await application.getIosApplicationReleaseTypeAsync();
        if (!isCurrent()) return null;

        isAppStoreRelease =
          releaseType === application.ApplicationReleaseType.APP_STORE;
      }

      validatePushEnvironment(environment, isAppStoreRelease);

      const notifications = await import("expo-notifications");
      if (!isCurrent()) return null;

      configureNotificationHandler(notifications);
      if (!notificationSubscription) {
        notificationSubscription = notifications.addNotificationReceivedListener(() => {
          if (!isCurrent()) return;
          void queryClient.invalidateQueries({ queryKey: ["instructor-notifications"] });
          void queryClient.invalidateQueries({ queryKey: ["instructor-notifications-count"] });
        });
      }
      return notifications;
    };

    const resolvePermission = async (
      notifications: NotificationsModule,
      requestPermission: boolean,
    ): Promise<NotificationPermission | null> => {
      let permission = await notifications.getPermissionsAsync();
      if (!isCurrent()) return null;

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

      if (!isCurrent()) return null;
      return permission;
    };

    const cleanupRegistration = async () => {
      tokenSubscription?.remove();
      tokenSubscription = null;

      const accessToken = await getToken();
      if (!isCurrent()) return;

      if (!accessToken) {
        return;
      }

      await unregisterIosPushSession(ownerId, accessToken);
    };

    const registerDeviceToken = async (notifications: NotificationsModule) => {
      if (!tokenSubscription) {
        tokenSubscription = notifications.addPushTokenListener((token) => {
          if (token.type === "ios" && isCurrent()) {
            void uploadToken(token.data).catch(reportError);
          }
        });
      }

      const token = await notifications.getDevicePushTokenAsync();
      if (!isCurrent()) return;

      if (token.type !== "ios") {
        return;
      }

      await uploadToken(token.data);
    };

    const sync = async (requestPermission: boolean) => {
      if (syncing || !isCurrent()) return;

      if (AppState.currentState !== "active") {
        return;
      }

      syncing = true;
      try {
        const notifications = await prepareNotifications();
        if (!notifications || !isCurrent()) return;

        const permission = await resolvePermission(notifications, requestPermission);
        if (!permission || !isCurrent()) return;

        if (!isPermissionAllowed(permission, notifications)) {
          await cleanupRegistration();
          return;
        }

        await registerDeviceToken(notifications);
        const accessToken = await getToken();
        if (accessToken && isCurrent()) await syncIosAppIconBadge(accessToken);
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
      notificationSubscription?.remove();
    };
  }, [enabled, userId, getToken, queryClient]);

  return null;
}
