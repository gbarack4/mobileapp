import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useInstructorStripe } from "@/hooks/use-instructor-stripe";
import type {
  PayoutConnectionStatus,
  SchoolStripeConnection,
} from "@/types/payment";

import { colors, spacing } from "../../constants/theme";
import { ChevronLeftIcon } from "../icons/dashboard-icons";
import { StripeConnectionSheet } from "./stripe-connection-sheet";

type PaymentScreenProps = {
  onClose: () => void;
};

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 0, 0, 0.06)" } : undefined;

const STATUS_LABELS: Record<PayoutConnectionStatus, string> = {
  connected: "Connected",
  not_connected: "Not connected",
  pending: "Pending",
  disconnected: "Disconnected",
};

function getStatusTextColor(status: PayoutConnectionStatus) {
  if (status === "connected") {
    return "#16a34a";
  }

  if (status === "pending") {
    return "#d97706";
  }

  if (status === "disconnected") {
    return "#dc2626";
  }

  return colors.textSecondary;
}

function getSchoolMeta(status: PayoutConnectionStatus): string {
  if (status === "connected") {
    return "Stripe account connected";
  }

  if (status === "pending") {
    return "Complete Stripe setup to receive payouts from this school";
  }

  if (status === "disconnected") {
    return "Stripe payouts are disconnected for this school";
  }

  return "Connect Stripe to receive payouts from this school";
}

function getActionButtonLabel(
  status: PayoutConnectionStatus,
  isProcessing: boolean,
): string {
  if (status === "disconnected") {
    return isProcessing ? "Reconnecting..." : "Reconnect Stripe";
  }

  if (isProcessing) {
    return "Opening Stripe...";
  }

  if (status === "pending") {
    return "Continue Stripe setup";
  }

  return "Connect Stripe";
}

type SchoolPaymentCardProps = {
  connection: SchoolStripeConnection;
  isProcessing: boolean;
  onConnect: (schoolId: string) => void;
  onReconnect: (schoolId: string) => void;
  onManage: (connection: SchoolStripeConnection) => void;
};

function SchoolPaymentCard({
  connection,
  isProcessing,
  onConnect,
  onReconnect,
  onManage,
}: Readonly<SchoolPaymentCardProps>) {
  const statusTextColor = getStatusTextColor(connection.stripeStatus);
  const isConnected = connection.stripeStatus === "connected";
  const isDisconnected = connection.stripeStatus === "disconnected";

  function handleAction() {
    if (isDisconnected) {
      onReconnect(connection.schoolId);
      return;
    }

    onConnect(connection.schoolId);
  }

  const cardContent = (
    <>
      <View style={styles.schoolTopRow}>
        <View
          style={[
            styles.schoolAvatar,
            { backgroundColor: `${connection.avatarColor}22` },
          ]}
        >
          <Text
            style={[styles.schoolAvatarText, { color: connection.avatarColor }]}
          >
            {connection.initials}
          </Text>
        </View>

        <View style={styles.schoolInfo}>
          <Text style={styles.schoolName}>{connection.name}</Text>
          <Text style={styles.schoolMeta}>
            {getSchoolMeta(connection.stripeStatus)}
          </Text>
        </View>

        <View style={styles.statusBadge}>
          <Text style={[styles.statusBadgeText, { color: statusTextColor }]}>
            {STATUS_LABELS[connection.stripeStatus]}
          </Text>
        </View>
      </View>

      {!isConnected ? (
        <Pressable
          onPress={handleAction}
          disabled={isProcessing}
          android_ripple={ANDROID_RIPPLE}
          style={({ pressed }) => [
            styles.connectButton,
            isProcessing && styles.connectButtonDisabled,
            pressed && !isProcessing && styles.pressed,
          ]}
        >
          <Text style={styles.connectButtonText}>
            {getActionButtonLabel(connection.stripeStatus, isProcessing)}
          </Text>
        </Pressable>
      ) : null}
    </>
  );

  if (isConnected) {
    return (
      <Pressable
        onPress={() => onManage(connection)}
        android_ripple={ANDROID_RIPPLE}
        style={({ pressed }) => [styles.schoolCard, pressed && styles.pressed]}
      >
        {cardContent}
      </Pressable>
    );
  }

  return <View style={styles.schoolCard}>{cardContent}</View>;
}

export function PaymentScreen({ onClose }: Readonly<PaymentScreenProps>) {
  const {
    connections,
    connectedCount,
    totalCount,
    connectingSchoolId,
    disconnectingSchoolId,
    reconnectingSchoolId,
    isLoading,
    error,
    connect,
    disconnect,
    reconnect,
    refetch,
  } = useInstructorStripe();

  const [managedConnection, setManagedConnection] =
    useState<SchoolStripeConnection | null>(null);

  function handleConnectStripe(schoolId: string) {
    void connect(schoolId);
  }

  function handleReconnectStripe(schoolId: string) {
    setManagedConnection(null);
    void reconnect(schoolId);
  }

  function handleDisconnectStripe(schoolId: string) {
    setManagedConnection(null);
    void disconnect(schoolId);
  }

  return (
    <View style={styles.screen}>
      <StripeConnectionSheet
        visible={managedConnection !== null}
        connection={managedConnection}
        onClose={() => setManagedConnection(null)}
        onDisconnect={handleDisconnectStripe}
      />

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

        <Text style={styles.headerTitle}>Payment</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.introTitle}>Stripe payouts</Text>
        <Text style={styles.introText}>
          Connect Stripe to receive payouts from each school you work with.
        </Text>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>

            <Pressable
              onPress={() => void refetch()}
              android_ripple={ANDROID_RIPPLE}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>
              Loading Stripe connections...
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>
                {connectedCount} of {totalCount}
              </Text>
              <Text style={styles.summaryLabel}>
                schools connected to Stripe
              </Text>
            </View>

            <Text style={styles.sectionLabel}>Schools</Text>

            {connections.length > 0 ? (
              <View style={styles.schoolList}>
                {connections.map((connection) => (
                  <SchoolPaymentCard
                    key={connection.schoolId}
                    connection={connection}
                    isProcessing={
                      connectingSchoolId === connection.schoolId ||
                      reconnectingSchoolId === connection.schoolId ||
                      disconnectingSchoolId === connection.schoolId
                    }
                    onConnect={handleConnectStripe}
                    onReconnect={handleReconnectStripe}
                    onManage={setManagedConnection}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No active schools</Text>
                <Text style={styles.emptyText}>
                  Active school connections will appear here.
                </Text>
              </View>
            )}
          </>
        )}
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
  introTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.2,
  },
  introText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
  },
  errorCard: {
    backgroundColor: "#fef2f2",
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.sm,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#b91c1c",
  },
  retryButton: {
    alignSelf: "flex-start",
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  loadingCard: {
    minHeight: 100,
    borderRadius: 16,
    backgroundColor: "#f9f9f9",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  summaryCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    padding: spacing.lg,
    gap: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.3,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  schoolList: {
    gap: spacing.sm,
  },
  schoolCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.md,
  },
  schoolTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  schoolAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  schoolAvatarText: {
    fontSize: 14,
    fontWeight: "700",
  },
  schoolInfo: {
    flex: 1,
    gap: 4,
    paddingTop: 2,
  },
  schoolName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  schoolMeta: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginTop: 2,
    backgroundColor: colors.white,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  connectButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#635bff",
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web"
      ? ({ outlineStyle: "none", transition: "opacity 0.15s ease" } as object)
      : {}),
  },
  connectButtonDisabled: {
    opacity: 0.7,
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
  },
  emptyCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 14,
    padding: spacing.lg,
    gap: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.85,
  },
});
