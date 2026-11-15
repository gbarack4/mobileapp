import { useCallback, useEffect, useState } from "react";
import {
  AppState,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../../lib/auth/auth-provider";
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
        shouldSetBadge: false,
      });
    },
  });
}

function describePermission(permission: NotificationPermission): string {
  return `status=${permission.status}; iOS=${permission.ios?.status ?? "unknown"}; canAskAgain=${permission.canAskAgain}`;
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

export function IosPushRegistration({ enabled, diagnostics = false }: Props) {
  const { userId, getToken } = useAuth();
  const [diagnosticLines, setDiagnosticLines] = useState<string[]>([]);

  const reportStage = useCallback(
    (message: string) => {
      if (!diagnostics) return;

      const line = `${new Date().toISOString().slice(11, 19)} ${message}`;
      setDiagnosticLines((previous) => [...previous.slice(-11), line]);
    },
    [diagnostics],
  );

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

    const reportCurrentStage = (message: string) => {
      if (isCurrent()) reportStage(message);
    };

    const reportError = (error: unknown) => {
      if (!isCurrent()) return;

      const message = error instanceof Error ? error.message : "Unknown error";
      console.warn("[Push] Registration failed:", message);
      reportStage(`ERROR: ${message}`);
    };

    const uploadToken = async (token: string) => {
      if (!isCurrent()) return;
      reportCurrentStage("Getting access token");
      const accessToken = await getToken();
      if (!isCurrent()) return;

      if (!accessToken) {
        reportCurrentStage("Stopped: access token unavailable");
        return;
      }

      reportCurrentStage("Registering device with backend");
      await registerIosPushToken(
        { userId: ownerId, accessToken, isCurrent },
        token,
      );
      reportCurrentStage("Registration service completed");
    };

    const prepareNotifications = async (): Promise<NotificationsModule | null> => {
      reportCurrentStage("Loading expo-application");
      const application = await import("expo-application");
      if (!isCurrent()) return null;

      reportCurrentStage(
        `Version: ${application.nativeApplicationVersion ?? "unknown"}; build: ${application.nativeBuildVersion ?? "unknown"}`,
      );
      reportCurrentStage("Reading APNs environment");

      const environment =
        await application.getIosPushNotificationServiceEnvironmentAsync();
      if (!isCurrent()) return null;

      reportCurrentStage(`APNs environment: ${environment ?? "null"}`);
      validatePushEnvironment(environment);

      reportCurrentStage("Loading expo-notifications");
      const notifications = await import("expo-notifications");
      if (!isCurrent()) return null;

      configureNotificationHandler(notifications);
      return notifications;
    };

    const resolvePermission = async (
      notifications: NotificationsModule,
      requestPermission: boolean,
    ): Promise<NotificationPermission | null> => {
      reportCurrentStage("Reading notification permission");
      let permission = await notifications.getPermissionsAsync();
      if (!isCurrent()) return null;

      reportCurrentStage(`Permission: ${describePermission(permission)}`);

      if (
        requestPermission &&
        permission.canAskAgain &&
        permission.ios?.status ===
          notifications.IosAuthorizationStatus.NOT_DETERMINED
      ) {
        reportCurrentStage("Requesting notification permission");
        permission = await notifications.requestPermissionsAsync({
          ios: { allowAlert: true, allowBadge: true, allowSound: true },
        });
      }

      if (!isCurrent()) return null;
      reportCurrentStage(`Permission result: ${describePermission(permission)}`);
      return permission;
    };

    const cleanupRegistration = async () => {
      reportCurrentStage("Notifications not allowed; cleaning up registration");
      tokenSubscription?.remove();
      tokenSubscription = null;

      const accessToken = await getToken();
      if (!isCurrent()) return;

      if (!accessToken) {
        reportCurrentStage("Cleanup skipped: access token unavailable");
        return;
      }

      await unregisterIosPushSession(ownerId, accessToken);
      reportCurrentStage("Cleanup completed; notifications not allowed");
    };

    const registerDeviceToken = async (notifications: NotificationsModule) => {
      if (!tokenSubscription) {
        tokenSubscription = notifications.addPushTokenListener((token) => {
          if (token.type === "ios" && isCurrent()) {
            void uploadToken(token.data).catch(reportError);
          }
        });
      }

      reportCurrentStage("Requesting APNs device token");
      const token = await notifications.getDevicePushTokenAsync();
      if (!isCurrent()) return;

      reportCurrentStage(`Device token received; type: ${token.type}`);
      if (token.type !== "ios") {
        reportCurrentStage("Stopped: unexpected device token type");
        return;
      }

      await uploadToken(token.data);
    };

    const sync = async (requestPermission: boolean) => {
      if (syncing || !isCurrent()) return;

      if (AppState.currentState !== "active") {
        reportCurrentStage(`Waiting for active app: ${AppState.currentState}`);
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
      } catch (error: unknown) {
        reportError(error);
      } finally {
        syncing = false;
      }
    };

    reportStage("Registration effect started");
    const appSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void sync(true);
    });
    void sync(true);

    return () => {
      disposed = true;
      appSubscription.remove();
      tokenSubscription?.remove();
    };
  }, [enabled, userId, getToken, reportStage]);

  if (!diagnostics || Platform.OS !== "ios") return null;

  return (
    <View style={styles.diagnostics}>
      <Text style={styles.heading}>Push diagnostics · v1</Text>
      <Text style={styles.line}>
        enabled: {String(enabled)} · user available: {String(Boolean(userId))}
      </Text>
      <ScrollView style={styles.log}>
        <Text selectable style={styles.line}>
          {diagnosticLines.length === 0
            ? "Registration has not started."
            : diagnosticLines.join("\n")}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  diagnostics: {
    backgroundColor: "#111827",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 24,
  },
  heading: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  log: {
    maxHeight: 180,
  },
  line: {
    color: "#e5e7eb",
    fontSize: 11,
    lineHeight: 16,
  },
});
