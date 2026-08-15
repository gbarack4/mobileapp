import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Logo } from "@/components/logo";
import { colors, spacing } from "@/constants/theme";
import { type SchoolInvite } from "@/types/school-invite";
import { MapPinIcon } from "../icons/dashboard-icons";
import { CloseIcon } from "../icons/lesson-detail-icons";

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 94, 255, 0.08)" } : undefined;

const ACCEPT_DELAY_MS = 2000;

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

type SchoolInviteAcceptScreenProps = Readonly<{
  invite?: SchoolInvite;
  accepting?: boolean;
  declining?: boolean;
  onAccept?: () => void | Promise<void>;
  onDecline?: () => void | Promise<void>;
  onSuccessContinue?: () => void;
  onClose?: () => void;
}>;

export function SchoolInviteAcceptScreen({
  invite,
  accepting: acceptingProp,
  declining: decliningProp,
  onAccept,
  onDecline,
  onSuccessContinue,
  onClose,
}: SchoolInviteAcceptScreenProps) {
  const [localAccepting, setLocalAccepting] = useState(false);
  const [localDeclining, setLocalDeclining] = useState(false);
  const [outcome, setOutcome] = useState<"accepted" | "declined" | null>(null);
  const [closed, setClosed] = useState(false);

  const renderAvatar = () => {
    if (invite?.schoolLogoUrl) {
      return (
        <Image
          source={{ uri: invite.schoolLogoUrl }}
          style={styles.avatar}
          resizeMode="cover"
        />
      );
    }
    return (
      <View
        style={[styles.avatar, { backgroundColor: invite?.schoolAvatarColor }]}
      >
        <Text style={styles.avatarText}>{invite?.schoolInitials}</Text>
      </View>
    );
  };

  const renderSmallAvatar = () => {
    if (invite?.schoolLogoUrl) {
      return (
        <Image
          source={{ uri: invite.schoolLogoUrl }}
          style={styles.avatarSmall}
          resizeMode="cover"
        />
      );
    }
    return (
      <View
        style={[
          styles.avatarSmall,
          { backgroundColor: invite?.schoolAvatarColor },
        ]}
      >
        <Text style={styles.avatarTextSmall}>{invite?.schoolInitials}</Text>
      </View>
    );
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
      return;
    }
    setClosed(true);
  };

  if (closed) {
    return null;
  }

  if (!invite) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View
          style={[
            styles.successScreen,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const accepting = acceptingProp ?? localAccepting;
  const declining = decliningProp ?? localDeclining;
  const busy = accepting || declining;
  const finished = outcome !== null;

  const handleAccept = async () => {
    if (busy || finished) return;
    setLocalAccepting(true);
    try {
      await Promise.all([wait(ACCEPT_DELAY_MS), Promise.resolve(onAccept?.())]);
      setOutcome("accepted");
    } finally {
      setLocalAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (busy || finished) return;
    setLocalDeclining(true);
    try {
      await Promise.all([
        wait(ACCEPT_DELAY_MS),
        Promise.resolve(onDecline?.()),
      ]);
      setOutcome("declined");
    } finally {
      setLocalDeclining(false);
    }
  };

  const header = (
    <View style={styles.topBar}>
      <View style={styles.brandRow}>
        <Logo size={40} />
        <Text style={styles.brandName}>Instructor Hub</Text>
      </View>
      <Pressable
        onPress={handleClose}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Close invitation"
        android_ripple={ANDROID_RIPPLE}
        style={({ pressed }) => [
          styles.closeButton,
          pressed && styles.closePressed,
        ]}
      >
        <CloseIcon size={20} color={colors.text} />
      </Pressable>
    </View>
  );

  if (outcome === "accepted" || outcome === "declined") {
    const isAccepted = outcome === "accepted";

    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.successScreen}>
          {header}

          <View style={styles.successCard}>
            <View
              style={[styles.successBadge, !isAccepted && styles.declinedBadge]}
            >
              <Text
                style={[
                  styles.successCheck,
                  !isAccepted && styles.declinedCheck,
                ]}
              >
                {isAccepted ? "✓" : "✕"}
              </Text>
            </View>
            <Text style={styles.successTitle}>
              {isAccepted ? "Successfully joined" : "Invitation declined"}
            </Text>
            <Text style={styles.successSubtitle}>
              {isAccepted
                ? `You’re now connected with ${invite.schoolName}. You can start receiving bookings from this school.`
                : `You declined the invitation from ${invite.schoolName}. You can still join later if they invite you again.`}
            </Text>

            <View style={styles.successSchoolRow}>
              {renderSmallAvatar()}
              <Text style={styles.successSchoolName}>{invite.schoolName}</Text>
            </View>

            {onSuccessContinue || onClose ? (
              <Pressable
                onPress={onSuccessContinue ?? handleClose}
                android_ripple={ANDROID_RIPPLE}
                style={({ pressed }) => [
                  styles.acceptButton,
                  pressed && styles.acceptPressed,
                ]}
              >
                <Text style={styles.acceptButtonText}>
                  {isAccepted ? "Continue" : "Done"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {header}

        <Text style={styles.eyebrow}>School invitation</Text>
        <Text style={styles.title}>You’ve been invited to join a school</Text>
        <Text style={styles.subtitle}>
          Accept to connect with this driving school and start taking their
          lessons.
        </Text>

        <View style={styles.schoolCard}>
          <View style={styles.schoolHeader}>
            {renderAvatar()}
            <View style={styles.schoolText}>
              <Text style={styles.schoolName}>{invite.schoolName}</Text>
              <View style={styles.locationRow}>
                <MapPinIcon size={14} color={colors.textMuted} />
                <Text style={styles.locationText}>
                  {invite.schoolAddress}, {invite.schoolSuburb}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.inviterRow}>
            <Text style={styles.inviterLabel}>Invited by</Text>
            <Text style={styles.inviterName}>{invite.invitedByName}</Text>
            <Text style={styles.inviterRole}>{invite.invitedByRole}</Text>
          </View>

          {invite.message ? (
            <View style={styles.messageBox}>
              <Text style={styles.messageText}>{invite.message}</Text>
            </View>
          ) : null}

          {invite.expiresAtLabel ? (
            <Text style={styles.expires}>{invite.expiresAtLabel}</Text>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              onPress={handleAccept}
              disabled={busy}
              android_ripple={ANDROID_RIPPLE}
              style={({ pressed }) => [
                styles.acceptButton,
                pressed && !busy && styles.acceptPressed,
                busy && styles.buttonDisabled,
              ]}
            >
              {accepting ? (
                <View style={styles.acceptingRow}>
                  <ActivityIndicator color={colors.white} />
                  <Text style={styles.acceptButtonText}>Accepting...</Text>
                </View>
              ) : (
                <Text style={styles.acceptButtonText}>Accept invitation</Text>
              )}
            </Pressable>

            <Pressable
              onPress={handleDecline}
              disabled={busy}
              android_ripple={ANDROID_RIPPLE}
              style={({ pressed }) => [
                styles.declineButton,
                pressed && !busy && styles.declinePressed,
                busy && styles.buttonDisabled,
              ]}
            >
              {declining ? (
                <View style={styles.acceptingRow}>
                  <ActivityIndicator color={colors.textSecondary} />
                  <Text style={styles.declineButtonText}>Declining...</Text>
                </View>
              ) : (
                <Text style={styles.declineButtonText}>Decline</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  brandName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.inputBackground,
  },
  closePressed: {
    backgroundColor: colors.inputBackgroundHover,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  schoolCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 18,
    padding: spacing.lg,
    gap: spacing.md,
  },
  schoolHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.white,
  },
  schoolText: {
    flex: 1,
    gap: 4,
  },
  schoolName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: "#e8edf3",
  },
  inviterRow: {
    gap: 2,
  },
  inviterLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  inviterName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  inviterRole: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  messageBox: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  expires: {
    fontSize: 12,
    fontWeight: "600",
    color: "#d97706",
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  acceptButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  acceptPressed: {
    backgroundColor: colors.primaryHover,
  },
  acceptButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  acceptingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  declineButton: {
    backgroundColor: colors.inputBackground,
    borderRadius: 14,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  declinePressed: {
    backgroundColor: colors.inputBackgroundHover,
  },
  declineButtonText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.85,
  },
  successScreen: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },
  successCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 18,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },
  successBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  declinedBadge: {
    backgroundColor: "#fee2e2",
  },
  successCheck: {
    fontSize: 28,
    fontWeight: "700",
    color: "#16a34a",
  },
  declinedCheck: {
    color: colors.error,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.4,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: "center",
  },
  successSchoolRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    alignSelf: "stretch",
    justifyContent: "center",
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTextSmall: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.white,
  },
  successSchoolName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
});
