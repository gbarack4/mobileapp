import { useAuth } from '@clerk/clerk-expo';
import { router, type Href } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { type ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CloseIcon } from '../icons/lesson-detail-icons';
import {
  getHubDocumentsNeedingAction,
  HUB_QUICK_LINKS,
  MOCK_HUB_ACCOUNT,
  MOCK_HUB_DOCUMENTS,
  type HubDocumentItem,
  type HubQuickLinkId,
} from '../../data/mock-hub-account';
import { colors, spacing } from '../../constants/theme';
import {
  getProfilePhotoUri,
  persistProfilePhotoUri,
  setProfilePhotoUri,
} from '../../services/profile-photo';
import { uploadAvatarToBackend } from '../../services/uploadService';
import { DocumentsIcon } from './account-icons';
import {
  HubPersonalInfoIcon,
  HubPrivacyIcon,
  HubSecurityIcon,
  StarIcon,
} from './hub-account-icons';

type HubAccountScreenProps = {
  onClose: () => void;
};

type PressableState = {
  pressed: boolean;
  hovered?: boolean;
};

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 0, 0, 0.06)' } : undefined;

const QUICK_LINK_ICONS = {
  'personal-info': HubPersonalInfoIcon,
  security: HubSecurityIcon,
  'privacy-data': HubPrivacyIcon,
} as const;

function formatRating(rating: number) {
  return Number.isInteger(rating) ? String(rating) : rating.toFixed(1);
}

type HubQuickCardProps = {
  label: string;
  icon: ReactNode;
  onPress: () => void;
};

function HubQuickCard({ label, icon, onPress }: HubQuickCardProps) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={ANDROID_RIPPLE}
      style={({ pressed }: PressableState) => [styles.quickCard, pressed && styles.pressed]}>
      <View style={styles.quickCardIcon}>{icon}</View>
      <Text style={styles.quickCardLabel}>{label}</Text>
    </Pressable>
  );
}

const QUICK_LINK_ROUTES: Record<HubQuickLinkId, Href> = {
  'personal-info': '/dashboard/account/hub/personal-info',
  security: '/dashboard/account/hub/security',
  'privacy-data': '/dashboard/account/hub/privacy-data',
};

const DOCUMENT_STATUS_LABELS: Record<HubDocumentItem['status'], string> = {
  uploaded: 'Up to date',
  expiring: 'Expiring soon',
  required: 'Upload required',
};

function HubDocumentsCard({ documents }: { documents: HubDocumentItem[] }) {
  const actionItems = getHubDocumentsNeedingAction(documents);
  const allUpToDate = actionItems.length === 0;

  return (
    <View style={styles.documentsCard}>
      <View style={styles.documentsTop}>
        <View style={styles.documentsText}>
          <Text style={styles.documentsTitle}>
            {allUpToDate ? 'Documents are up to date' : 'Documents need attention'}
          </Text>
          <Text style={styles.documentsDescription}>
            {allUpToDate
              ? 'Your instructor documents are current. Upload new files here when something changes or expires.'
              : 'Upload or renew documents here. Schools may require these before assigning lessons.'}
          </Text>
        </View>

        <View style={styles.documentsIconWrap}>
          <DocumentsIcon size={22} color={colors.primary} />
        </View>
      </View>

      {actionItems.length > 0 ? (
        <View style={styles.documentsList}>
          {actionItems.map((document) => (
            <View key={document.id} style={styles.documentRow}>
              <View
                style={[
                  styles.documentStatusDot,
                  document.status === 'required' && styles.documentStatusDotRequired,
                  document.status === 'expiring' && styles.documentStatusDotExpiring,
                ]}
              />
              <View style={styles.documentRowText}>
                <Text style={styles.documentLabel}>{document.label}</Text>
                <Text style={styles.documentDetail}>
                  {document.detail ?? DOCUMENT_STATUS_LABELS[document.status]}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <Pressable
        android_ripple={ANDROID_RIPPLE}
        style={({ pressed }: PressableState) => [
          styles.documentsButton,
          pressed && styles.pressed,
        ]}
        onPress={() => {
          // TODO: connect to documents upload flow / NestJS API
        }}>
        <Text style={styles.documentsButtonText}>
          {allUpToDate ? 'Manage documents' : 'Upload documents'}
        </Text>
      </Pressable>
    </View>
  );
}

function HubAccountHomeContent({
  profile,
  photoUri,
  isUploadingPhoto,
  onPickPhoto,
}: {
  profile: typeof MOCK_HUB_ACCOUNT;
  photoUri: string | null;
  isUploadingPhoto: boolean;
  onPickPhoto: () => void;
}) {
  return (
    <View style={styles.homeContent}>
      <View style={styles.profileSection}>
        <Pressable
          onPress={onPickPhoto}
          disabled={isUploadingPhoto}
          android_ripple={ANDROID_RIPPLE}
          accessibilityLabel={
            photoUri ? 'Change profile photo' : 'Upload profile photo'
          }
          style={({ pressed }) => [
            styles.avatarButton,
            pressed && styles.pressed,
            isUploadingPhoto && styles.avatarButtonDisabled,
          ]}>
          <View style={styles.avatar}>
            {isUploadingPhoto ? (
              <ActivityIndicator color={colors.primary} />
            ) : photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{profile.initials}</Text>
            )}
          </View>
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarBadgeText}>{photoUri ? 'Edit' : 'Add'}</Text>
          </View>
        </Pressable>

        <Text style={styles.photoHint}>Tap to upload a profile photo</Text>

        <View style={styles.nameRow}>
          <Text style={styles.profileName}>{profile.name}</Text>
          <View style={styles.ratingBadge}>
            <StarIcon />
            <Text style={styles.ratingText}>{formatRating(profile.rating)}</Text>
          </View>
        </View>

        <Text style={styles.profileEmail}>{profile.email}</Text>
      </View>

      <View style={styles.quickLinksRow}>
        {HUB_QUICK_LINKS.map((link) => {
          const Icon = QUICK_LINK_ICONS[link.id];

          return (
            <HubQuickCard
              key={link.id}
              label={link.label}
              icon={<Icon />}
              onPress={() => router.push(QUICK_LINK_ROUTES[link.id])}
            />
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Documents</Text>

      <HubDocumentsCard documents={MOCK_HUB_DOCUMENTS} />
    </View>
  );
}

export function HubAccountScreen({ onClose }: HubAccountScreenProps) {
  const { getToken } = useAuth();
  const profile = MOCK_HUB_ACCOUNT;
  const [photoUri, setPhotoUri] = useState<string | null>(() => getProfilePhotoUri());
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  async function handlePickPhoto() {
    if (isUploadingPhoto) {
      return;
    }

    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission required',
          'Allow photo library access to upload a profile picture.',
        );
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];
    const localUri = asset.uri;
    const fileName = asset.fileName || localUri.split('/').pop() || 'profile-photo.jpg';
    const mimeType = asset.mimeType || 'image/jpeg';

    setIsUploadingPhoto(true);

    try {
      // Persist as a data URL so the Account tab can show it after navigation.
      const persistentUri = await persistProfilePhotoUri(localUri);
      setPhotoUri(persistentUri);

      const token = await getToken().catch(() => null);
      if (token) {
        const remoteUrl = await uploadAvatarToBackend(
          localUri,
          fileName,
          mimeType,
          token,
        );
        if (remoteUrl) {
          setPhotoUri(remoteUrl);
          setProfilePhotoUri(remoteUrl);
        }
      }
    } catch {
      // Keep the local preview when the backend is offline.
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          android_ripple={ANDROID_RIPPLE}
          accessibilityLabel="Close"
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
          <CloseIcon size={22} />
        </Pressable>

        <Text style={styles.headerTitle}>Hub Account</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <HubAccountHomeContent
          profile={profile}
          photoUri={photoUri}
          isUploadingPhoto={isUploadingPhoto}
          onPickPhoto={() => {
            void handlePickPhoto();
          }}
        />
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  homeContent: {
    paddingTop: spacing.xl,
    gap: spacing.xl,
  },
  profileSection: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  avatarButton: {
    position: 'relative',
    marginBottom: spacing.xs,
  },
  avatarButtonDisabled: {
    opacity: 0.75,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#e8f1ff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
  },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  photoHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  profileEmail: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  quickLinksRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 108,
  },
  quickCardIcon: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: spacing.xl,
  },
  documentsCard: {
    marginHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.lg,
    backgroundColor: colors.background,
  },
  documentsTop: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  documentsText: {
    flex: 1,
    gap: spacing.sm,
  },
  documentsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 24,
  },
  documentsDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  documentsIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#e8f1ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentsList: {
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  documentStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    backgroundColor: colors.primary,
  },
  documentStatusDotRequired: {
    backgroundColor: colors.error,
  },
  documentStatusDotExpiring: {
    backgroundColor: '#f59e0b',
  },
  documentRowText: {
    flex: 1,
    gap: 2,
  },
  documentLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  documentDetail: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  documentsButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  documentsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  pressed: {
    opacity: 0.85,
  },
});
