import * as Linking from "expo-linking";
import { useState, type ReactNode } from "react";
import {
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CloseIcon } from "../icons/lesson-detail-icons";
import {
  ContactEmailIcon,
  ContactGlobeIcon,
  ContactLocationIcon,
  ContactPhoneIcon,
} from "../icons/school-detail-icons";
import { colors, spacing } from "../../constants/theme";
import type { SchoolDetail } from "../../types/school";
import { getSchoolUIData } from "../../utils/school-ui";
import { DeactivateSchoolDialog } from "./deactivate-school-dialog";
import { StarRating } from "./star-rating";

const BANNER_HEIGHT = 148;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

type SchoolDetailProfileProps = {
  school: SchoolDetail;
  onClose: () => void;
  onJoin: () => void;
  onCancelRequest?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onDeactivate?: () => void;
};

type DetailTab = "about" | "reviews";

type PressableState = {
  pressed: boolean;
  hovered?: boolean;
};

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 94, 255, 0.1)" } : undefined;

function SchoolBanner({
  school,
  topInset,
  onClose,
}: Readonly<{
  school: SchoolDetail;
  topInset: number;
  onClose: () => void;
}>) {
  const { bannerColorStart, bannerColorEnd, initials } =
    getSchoolUIData(school);
  const gradientId = `school-banner-${school.id}`;

  return (
    <View style={styles.banner}>
      {school.coverImageUrl ? (
        <Image
          source={{ uri: school.coverImageUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : (
        <>
          <Svg
            height={BANNER_HEIGHT}
            width={SCREEN_WIDTH}
            preserveAspectRatio="none"
          >
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={bannerColorStart} />
                <Stop offset="1" stopColor={bannerColorEnd} />
              </LinearGradient>
            </Defs>
            <Rect
              width={SCREEN_WIDTH}
              height={BANNER_HEIGHT}
              fill={`url(#${gradientId})`}
            />
          </Svg>
          <Text style={styles.bannerWatermark}>{initials}</Text>
        </>
      )}

      <Pressable
        onPress={onClose}
        hitSlop={8}
        android_ripple={ANDROID_RIPPLE}
        accessibilityLabel="Close"
        style={[styles.bannerClose, { top: topInset + spacing.sm }]}
      >
        <CloseIcon size={18} color={colors.white} />
      </Pressable>
    </View>
  );
}

function ContactRow({
  icon,
  label,
  onPress,
}: Readonly<{ icon: ReactNode; label: string; onPress?: () => void }>) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      android_ripple={onPress ? ANDROID_RIPPLE : undefined}
      style={({ pressed }) => [
        styles.contactRow,
        pressed && onPress && styles.pressed,
      ]}
    >
      <View style={styles.contactIcon}>{icon}</View>
      <Text style={styles.contactText}>{label}</Text>
    </Pressable>
  );
}

function detailJoinStyles(status: SchoolDetail["joinStatus"]) {
  if (status === "pending") {
    return {
      button: styles.joinButtonPending,
      hovered: styles.joinButtonPendingHovered,
      text: styles.joinButtonPendingText,
      label: "Pending",
    };
  }
  if (status === "accepted") {
    return {
      button: styles.joinButtonJoined,
      hovered: styles.joinButtonJoinedHovered,
      text: styles.joinButtonJoinedText,
      label: "Joined",
    };
  }
  if (status === "paused") {
    return {
      button: styles.joinButtonPaused,
      hovered: styles.joinButtonPausedHovered,
      text: styles.joinButtonPausedText,
      label: "Paused",
    };
  }
  if (status === "rejected") {
    return {
      button: styles.joinButtonPaused,
      hovered: styles.joinButtonPausedHovered,
      text: styles.joinButtonPausedText,
      label: "Rejected",
    };
  }
  return {
    button: styles.joinButton,
    hovered: styles.joinButtonHovered,
    text: styles.joinButtonText,
    label: "Join School",
  };
}

export function SchoolDetailProfile({
  school,
  onClose,
  onJoin,
  onCancelRequest,
  onPause,
  onResume,
  onDeactivate,
}: Readonly<SchoolDetailProfileProps>) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<DetailTab>("about");
  const [manageOpen, setManageOpen] = useState(false);

  const status = school.joinStatus || "none";
  const { initials, avatarColor } = getSchoolUIData(school);

  const locationParts = [school.address, school.suburb].filter(Boolean);
  const locationLabel =
    locationParts.length > 0
      ? locationParts.join(", ")
      : "No location provided";

  const canJoin = status === "none" || status === "rejected";
  const joinStyles = detailJoinStyles(status);

  const showManage =
    status === "pending" || status === "accepted" || status === "paused";

  function openPhone() {
    if (school.phone) Linking.openURL(`tel:${school.phone.replace(/\s/g, "")}`);
  }

  function openEmail() {
    if (school.email) Linking.openURL(`mailto:${school.email}`);
  }

  function openWebsite() {
    if (school.website) {
      const url = school.website.startsWith("http")
        ? school.website
        : `https://${school.website}`;
      Linking.openURL(url);
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SchoolBanner school={school} topInset={insets.top} onClose={onClose} />

        <View style={styles.profileSection}>
          {school.logoUrl ? (
            <Image
              source={{ uri: school.logoUrl }}
              style={styles.avatar}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}

          <Text style={styles.name}>{school.name}</Text>

          <StarRating
            rating={school.rating}
            reviewCount={school.reviewCount}
            variant="detail"
          />

          <View style={styles.contactList}>
            <ContactRow icon={<ContactLocationIcon />} label={locationLabel} />
            {school.phone ? (
              <ContactRow
                icon={<ContactPhoneIcon />}
                label={school.phone}
                onPress={openPhone}
              />
            ) : null}
            {school.email ? (
              <ContactRow
                icon={<ContactEmailIcon />}
                label={school.email}
                onPress={openEmail}
              />
            ) : null}
            {school.website ? (
              <ContactRow
                icon={<ContactGlobeIcon />}
                label={school.website}
                onPress={openWebsite}
              />
            ) : null}
          </View>

          <View style={styles.tabsRow}>
            <View style={styles.tabs}>
              <Pressable
                onPress={() => setActiveTab("about")}
                style={[styles.tab, activeTab === "about" && styles.tabActive]}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === "about" && styles.tabLabelActive,
                  ]}
                >
                  About
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab("reviews")}
                style={[
                  styles.tab,
                  activeTab === "reviews" && styles.tabActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === "reviews" && styles.tabLabelActive,
                  ]}
                >
                  Reviews
                </Text>
              </Pressable>
            </View>

            {showManage ? (
              <Pressable
                onPress={() => setManageOpen(true)}
                android_ripple={ANDROID_RIPPLE}
                accessibilityLabel="Manage school"
                style={({ pressed }) => [
                  styles.manageButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.manageButtonText}>Manage</Text>
              </Pressable>
            ) : null}
          </View>

          {activeTab === "about" ? (
            <View style={styles.aboutCard}>
              <Text style={styles.sectionEyebrow}>About</Text>
              <Text style={styles.aboutText}>
                {school.about ||
                  "This school hasn't provided any information yet."}
              </Text>
            </View>
          ) : (
            <View style={styles.reviewsList}>
              {school.reviews && school.reviews.length > 0 ? (
                school.reviews.map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewAuthor}>{review.author}</Text>
                      <Text style={styles.reviewDate}>{review.date}</Text>
                    </View>
                    <StarRating
                      rating={review.rating}
                      reviewCount={0}
                      variant="detail"
                      showReviewCount={false}
                    />
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.reviewCard}>
                  <Text style={styles.reviewComment}>
                    No reviews available yet.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, spacing.sm) },
        ]}
      >
        <Pressable
          onPress={() => {
            if (canJoin) onJoin();
          }}
          disabled={!canJoin}
          accessibilityState={{ disabled: !canJoin }}
          android_ripple={canJoin ? ANDROID_RIPPLE : undefined}
          style={({ pressed, hovered }: PressableState) => [
            joinStyles.button,
            canJoin && hovered && !pressed && joinStyles.hovered,
            pressed && canJoin && styles.pressed,
          ]}
        >
          <Text style={joinStyles.text}>{joinStyles.label}</Text>
        </Pressable>
      </View>

      <DeactivateSchoolDialog
        visible={manageOpen}
        schoolName={school.name}
        status={status}
        onClose={() => setManageOpen(false)}
        onCancelRequest={() => {
          if (onCancelRequest) onCancelRequest();
          setManageOpen(false);
        }}
        onPause={() => {
          if (onPause) onPause();
          setManageOpen(false);
        }}
        onResume={() => {
          if (onResume) onResume();
          setManageOpen(false);
        }}
        onDeactivate={() => {
          if (onDeactivate) onDeactivate();
          setManageOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xl },
  banner: { height: BANNER_HEIGHT, position: "relative", overflow: "hidden" },
  bannerWatermark: {
    position: "absolute",
    right: 24,
    top: 28,
    fontSize: 88,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.14)",
    letterSpacing: 4,
  },
  bannerClose: {
    position: "absolute",
    left: spacing.xl,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  profileSection: { paddingHorizontal: spacing.xl, paddingTop: 0 },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -38,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  avatarText: { fontSize: 24, fontWeight: "700", color: colors.white },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  contactList: {
    marginTop: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  contactRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  contactIcon: { width: 24, alignItems: "center" },
  contactText: { flex: 1, fontSize: 15, color: colors.text },
  tabsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.lg,
  },
  tabs: { flex: 1, flexDirection: "row" },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingBottom: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    marginBottom: -1,
  },
  tabActive: { borderBottomColor: colors.primary },
  tabLabel: { fontSize: 16, fontWeight: "600", color: colors.textMuted },
  tabLabelActive: { color: colors.primary },
  manageButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: spacing.sm,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: colors.border,
  },
  manageButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  aboutCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  aboutText: { fontSize: 15, lineHeight: 24, color: colors.text },
  reviewsList: { gap: spacing.md },
  reviewCard: {
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: "#f9f9f9",
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  reviewAuthor: { fontSize: 15, fontWeight: "700", color: colors.text },
  reviewDate: { fontSize: 13, color: colors.textMuted },
  reviewComment: { fontSize: 15, lineHeight: 22, color: colors.textSecondary },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  joinButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web"
      ? ({
          outlineStyle: "none",
          transition: "background-color 0.15s ease",
        } as object)
      : {}),
  },
  joinButtonHovered: { backgroundColor: colors.primaryHover },
  joinButtonText: { fontSize: 16, fontWeight: "700", color: colors.white },
  joinButtonPending: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: "#f59e0b",
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web"
      ? ({
          outlineStyle: "none",
          transition: "background-color 0.15s ease",
        } as object)
      : {}),
  },
  joinButtonPendingHovered: { backgroundColor: "#d97706" },
  joinButtonPendingText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
  },
  joinButtonJoined: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web"
      ? ({
          outlineStyle: "none",
          transition: "background-color 0.15s ease",
        } as object)
      : {}),
  },
  joinButtonJoinedHovered: { backgroundColor: "#16a34a" },
  joinButtonJoinedText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
  },
  joinButtonPaused: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web"
      ? ({
          outlineStyle: "none",
          transition: "background-color 0.15s ease",
        } as object)
      : {}),
  },
  joinButtonPausedHovered: { backgroundColor: "#e5e7eb" },
  joinButtonPausedText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  pressed: { opacity: 0.85 },
});
