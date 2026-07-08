import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChevronLeftIcon } from '../icons/dashboard-icons';
import { colors, spacing } from '../../constants/theme';
import {
  getHubDocumentsNeedingAction,
  MOCK_HUB_DOCUMENTS,
  type HubDocumentItem,
  type HubDocumentStatus,
} from '../../data/mock-hub-account';

type DocumentsScreenProps = {
  onClose: () => void;
};

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 0, 0, 0.06)' } : undefined;

const STATUS_LABELS: Record<HubDocumentStatus, string> = {
  uploaded: 'Up to date',
  expiring: 'Expiring soon',
  required: 'Upload required',
};

function getStatusTextColor(status: HubDocumentStatus) {
  if (status === 'uploaded') {
    return '#16a34a';
  }

  if (status === 'expiring') {
    return '#d97706';
  }

  return colors.error;
}

type DocumentCardProps = {
  document: HubDocumentItem;
  onUpload: (documentId: string) => void;
};

function DocumentCard({ document, onUpload }: DocumentCardProps) {
  const statusTextColor = getStatusTextColor(document.status);
  const hasFile = Boolean(document.fileName);

  return (
    <View style={styles.documentCard}>
      <View style={styles.documentTopRow}>
        <View style={styles.documentInfo}>
          <Text style={styles.documentLabel}>{document.label}</Text>
          <Text style={styles.documentMeta}>
            {document.detail ?? (hasFile ? document.fileName : 'No document uploaded yet')}
          </Text>
        </View>

        <Text style={[styles.statusBadgeText, { color: statusTextColor }]}>
          {STATUS_LABELS[document.status]}
        </Text>
      </View>

      <Pressable
        onPress={() => onUpload(document.id)}
        android_ripple={ANDROID_RIPPLE}
        style={({ pressed }) => [styles.uploadButton, pressed && styles.pressed]}>
        <Text style={styles.uploadButtonText}>{hasFile ? 'Replace document' : 'Upload document'}</Text>
      </Pressable>
    </View>
  );
}

export function DocumentsScreen({ onClose }: DocumentsScreenProps) {
  const [documents, setDocuments] = useState(MOCK_HUB_DOCUMENTS);
  const actionCount = useMemo(() => getHubDocumentsNeedingAction(documents).length, [documents]);
  const upToDateCount = documents.length - actionCount;

  function handleUpload(documentId: string) {
    // TODO: connect to document picker and NestJS upload API
    setDocuments((current) =>
      current.map((document) =>
        document.id === documentId
          ? {
              ...document,
              status: 'uploaded',
              fileName: `${document.id}-upload.pdf`,
              detail: undefined,
            }
          : document,
      ),
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          android_ripple={ANDROID_RIPPLE}
          accessibilityLabel="Back"
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <ChevronLeftIcon size={22} />
        </Pressable>

        <Text style={styles.headerTitle}>Documents</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.introTitle}>Instructor documents</Text>
        <Text style={styles.introText}>
          Keep your licence, checks, and insurance up to date. Schools may require these before
          assigning lessons.
        </Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {upToDateCount} of {documents.length}
          </Text>
          <Text style={styles.summaryLabel}>documents up to date</Text>
        </View>

        <Text style={styles.sectionLabel}>Your documents</Text>

        <View style={styles.documentList}>
          {documents.map((document) => (
            <DocumentCard key={document.id} document={document} onUpload={handleUpload} />
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
  documentList: {
    gap: spacing.sm,
  },
  documentCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.md,
  },
  documentTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  documentInfo: {
    flex: 1,
    gap: 4,
  },
  documentLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  documentMeta: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  uploadButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: '#e8f1ff',
    ...(Platform.OS === 'web'
      ? ({ outlineStyle: 'none', transition: 'opacity 0.15s ease' } as object)
      : {}),
  },
  uploadButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  pressed: {
    opacity: 0.85,
  },
});
