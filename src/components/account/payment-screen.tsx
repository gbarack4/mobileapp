import { useMemo, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChevronLeftIcon } from '../icons/dashboard-icons';
import { colors, spacing } from '../../constants/theme';
import {
  getConnectedSchoolCount,
  MOCK_SCHOOL_STRIPE_CONNECTIONS,
} from '../../data/mock-school-payments';
import type { SchoolStripeConnection, SchoolStripeStatus } from '../../types/payment';
import { StripeConnectionSheet } from './stripe-connection-sheet';

type PaymentScreenProps = {
  onClose: () => void;
};

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 0, 0, 0.06)' } : undefined;

const STRIPE_SIGNUP_URL = 'https://dashboard.stripe.com/register';

const STATUS_LABELS: Record<SchoolStripeStatus, string> = {
  connected: 'Connected',
  not_connected: 'Not connected',
  pending: 'Pending',
};

function getStatusTextColor(status: SchoolStripeStatus) {
  if (status === 'connected') {
    return '#16a34a';
  }

  if (status === 'pending') {
    return '#d97706';
  }

  return colors.textSecondary;
}

type SchoolPaymentCardProps = {
  connection: SchoolStripeConnection;
  onConnect: (schoolId: string) => void;
  onManage: (connection: SchoolStripeConnection) => void;
};

function SchoolPaymentCard({ connection, onConnect, onManage }: SchoolPaymentCardProps) {
  const statusTextColor = getStatusTextColor(connection.stripeStatus);
  const isConnected = connection.stripeStatus === 'connected';
  const isPending = connection.stripeStatus === 'pending';

  const cardContent = (
    <>
      <View style={styles.schoolTopRow}>
        <View
          style={[styles.schoolAvatar, { backgroundColor: `${connection.avatarColor}22` }]}>
          <Text style={[styles.schoolAvatarText, { color: connection.avatarColor }]}>
            {connection.initials}
          </Text>
        </View>

        <View style={styles.schoolInfo}>
          <Text style={styles.schoolName}>{connection.name}</Text>
          <Text style={styles.schoolMeta}>
            {isConnected
              ? `Stripe account ${connection.stripeAccountLabel ?? 'connected'}`
              : 'Connect Stripe to receive payouts from this school'}
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
          onPress={() => onConnect(connection.schoolId)}
          disabled={isPending}
          android_ripple={ANDROID_RIPPLE}
          style={({ pressed }) => [
            styles.connectButton,
            isPending && styles.connectButtonDisabled,
            pressed && !isPending && styles.pressed,
          ]}>
          <Text style={styles.connectButtonText}>
            {isPending ? 'Connecting...' : 'Connect Stripe'}
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
        style={({ pressed }) => [styles.schoolCard, pressed && styles.pressed]}>
        {cardContent}
      </Pressable>
    );
  }

  return <View style={styles.schoolCard}>{cardContent}</View>;
}

export function PaymentScreen({ onClose }: PaymentScreenProps) {
  const [connections, setConnections] = useState(MOCK_SCHOOL_STRIPE_CONNECTIONS);
  const [managedConnection, setManagedConnection] = useState<SchoolStripeConnection | null>(null);
  const connectedCount = useMemo(() => getConnectedSchoolCount(connections), [connections]);
  const totalCount = connections.length;

  function handleConnectStripe(schoolId: string) {
    setConnections((current) =>
      current.map((connection) =>
        connection.schoolId === schoolId
          ? { ...connection, stripeStatus: 'pending' }
          : connection,
      ),
    );

    // TODO: open Stripe Connect onboarding flow via NestJS API
    setTimeout(() => {
      setConnections((current) =>
        current.map((connection) =>
          connection.schoolId === schoolId
            ? {
                ...connection,
                stripeStatus: 'connected',
                stripeAccountLabel: '•••• 7392',
              }
            : connection,
        ),
      );
    }, 1500);
  }

  function handleReconnectStripe(schoolId: string) {
    setManagedConnection(null);
    handleConnectStripe(schoolId);
  }

  function handleOpenStripeSignup() {
    // TODO: use locale-specific Stripe signup URL from NestJS config
    void Linking.openURL(STRIPE_SIGNUP_URL);
  }

  function handleDisconnectStripe(schoolId: string) {
    setConnections((current) =>
      current.map((connection) =>
        connection.schoolId === schoolId
          ? {
              ...connection,
              stripeStatus: 'not_connected',
              stripeAccountLabel: undefined,
            }
          : connection,
      ),
    );
    setManagedConnection(null);

    // TODO: disconnect Stripe account via NestJS API
  }

  return (
    <View style={styles.screen}>
      <StripeConnectionSheet
        visible={managedConnection !== null}
        connection={managedConnection}
        onClose={() => setManagedConnection(null)}
        onReconnect={handleReconnectStripe}
        onDisconnect={handleDisconnectStripe}
      />
      <View style={styles.header}>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          android_ripple={ANDROID_RIPPLE}
          accessibilityLabel="Back"
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <ChevronLeftIcon size={22} />
        </Pressable>

        <Text style={styles.headerTitle}>Payment</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.introTitle}>Stripe payouts</Text>
        <Text style={styles.introText}>
          Connect a Stripe account for each school you work with. Payouts are sent separately per
          school, so you will need to complete onboarding for every active school.{' '}
          Don&apos;t have a Stripe account?{' '}
          <Text style={styles.introLink} onPress={handleOpenStripeSignup}>
            Create one
          </Text>
        </Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {connectedCount} of {totalCount}
          </Text>
          <Text style={styles.summaryLabel}>schools connected to Stripe</Text>
        </View>

        <Text style={styles.sectionLabel}>Schools</Text>

        <View style={styles.schoolList}>
          {connections.map((connection) => (
            <SchoolPaymentCard
              key={connection.schoolId}
              connection={connection}
              onConnect={handleConnectStripe}
              onManage={setManagedConnection}
            />
          ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
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
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  introText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
  },
  introLink: {
    color: colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  summaryCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: spacing.lg,
    gap: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  schoolList: {
    gap: spacing.sm,
  },
  schoolCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.md,
  },
  schoolTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  schoolAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  schoolAvatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  schoolInfo: {
    flex: 1,
    gap: 4,
    paddingTop: 2,
  },
  schoolName: {
    fontSize: 15,
    fontWeight: '700',
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
    fontWeight: '700',
  },
  connectButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#635bff',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? ({ outlineStyle: 'none', transition: 'opacity 0.15s ease' } as object)
      : {}),
  },
  connectButtonDisabled: {
    opacity: 0.7,
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  pressed: {
    opacity: 0.85,
  },
});
