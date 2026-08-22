import { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ChevronLeftIcon } from "../icons/dashboard-icons";
import { colors, spacing } from "../../constants/theme";
import {
  getAppSettings,
  setAppSettings,
  subscribeAppSettings,
  type AppSettings,
} from "../../services/app-settings";
import { BlueToggle } from "./blue-toggle";
import { getSuprSendClient } from "@/services/suprsend";

type AppSettingsScreenProps = {
  onClose: () => void;
};

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 0, 0, 0.06)" } : undefined;

type ToggleRowProps = {
  label: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  showDivider?: boolean;
};

function ToggleRow({
  label,
  subtitle,
  value,
  onValueChange,
  showDivider = true,
}: Readonly<ToggleRowProps>) {
  return (
    <View>
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowLabel}>{label}</Text>
          <Text style={styles.rowSubtitle}>{subtitle}</Text>
        </View>
        <BlueToggle
          value={value}
          onValueChange={onValueChange}
          accessibilityLabel={label}
        />
      </View>
      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

export function AppSettingsScreen({
  onClose,
}: Readonly<AppSettingsScreenProps>) {
  const [settings, setSettings] = useState<AppSettings>(() => getAppSettings());

  useEffect(() => {
    return subscribeAppSettings(() => {
      setSettings(getAppSettings());
    });
  }, []);

  function updateSetting<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) {
    setAppSettings({ [key]: value });
    setSettings(getAppSettings());
  }

  async function handlePushNotificationsChange(enabled: boolean) {
    if (Platform.OS !== "web") {
      updateSetting("pushNotifications", enabled);
      return;
    }

    if (!enabled) {
      updateSetting("pushNotifications", false);
      return;
    }

    try {
      const suprSend = getSuprSendClient();

      const response = await suprSend.webpush.registerPush();

      console.log("SuprSend push registration:", response);

      updateSetting("pushNotifications", true);
    } catch (error) {
      console.error("Failed to enable push notifications:", error);

      updateSetting("pushNotifications", false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          android_ripple={ANDROID_RIPPLE}
          accessibilityLabel="Back"
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <ChevronLeftIcon size={22} />
        </Pressable>

        <Text style={styles.headerTitle}>App Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.description}>
          Control notifications in Instructor Hub.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <ToggleRow
              label="Push notifications"
              subtitle="Allow alerts from Instructor Hub on this device"
              value={settings.pushNotifications}
              onValueChange={handlePushNotificationsChange}
            />
            <ToggleRow
              label="Lesson reminders"
              subtitle="Get reminded before upcoming lessons"
              value={settings.lessonReminders}
              onValueChange={(value) => updateSetting("lessonReminders", value)}
            />
            <ToggleRow
              label="Booking alerts"
              subtitle="New bookings, cancellations, and changes"
              value={settings.bookingAlerts}
              onValueChange={(value) => updateSetting("bookingAlerts", value)}
            />
            <ToggleRow
              label="Payment alerts"
              subtitle="Payouts, failed charges, and Stripe updates"
              value={settings.paymentAlerts}
              onValueChange={(value) => updateSetting("paymentAlerts", value)}
              showDivider={false}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  headerSpacer: {
    width: 32,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.background,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  rowSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg,
  },
  pressed: {
    opacity: 0.85,
  },
});
