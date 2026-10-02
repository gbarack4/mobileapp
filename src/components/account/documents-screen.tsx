import { useAuth } from "@/lib/auth/auth-provider";
import { useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
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

import { useProfileQuery } from "@/hooks/use-profile";
import { colors, spacing } from "../../constants/theme";
import { uploadDocumentToBackend } from "../../services/uploadService";
import type { DocumentType } from "../../types/onboarding";
import { ChevronLeftIcon } from "../icons/dashboard-icons";

type DocumentsDto = Partial<Record<DocumentType, string | null>>;

type HubDocumentItem = {
  id: DocumentType;
  label: string;
  status: "uploaded" | "required";
  fileName?: string;
};

type DocumentConfig = {
  id: DocumentType;
  label: string;
};

type DocumentsScreenProps = {
  onClose: () => void;
};

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 0, 0, 0.06)" } : undefined;

const DOCUMENTS: DocumentConfig[] = [
  {
    id: "driverLicence",
    label: "Driver Licence",
  },
  {
    id: "instructorAccreditation",
    label: "Accreditation",
  },
  {
    id: "vehicleRegistration",
    label: "Vehicle Registration",
  },
  {
    id: "workingWithChildrenCheck",
    label: "WWCC",
  },
];

function mapProfileDocsToItems(docs?: DocumentsDto | null): HubDocumentItem[] {
  const safeDocs = docs ?? {};

  return DOCUMENTS.map((document) => {
    const value = safeDocs[document.id];

    return {
      ...document,
      status: value ? "uploaded" : "required",
      fileName: value || undefined,
    };
  });
}

function extractFileName(urlOrName?: string | null) {
  if (!urlOrName) return "No document uploaded yet";

  if (urlOrName.startsWith("http")) {
    return urlOrName.split("/").pop() || urlOrName;
  }

  return urlOrName;
}

function getStatusLabel(status: HubDocumentItem["status"]) {
  return status === "uploaded" ? "Up to date" : "Upload required";
}

function getStatusColor(status: HubDocumentItem["status"]) {
  return status === "uploaded" ? "#16a34a" : colors.error;
}

type DocumentCardProps = {
  document: HubDocumentItem;
  isUploading: boolean;
  onUpload: (documentId: DocumentType) => void;
};

function DocumentCard({
  document,
  isUploading,
  onUpload,
}: Readonly<DocumentCardProps>) {
  const hasFile = Boolean(document.fileName);

  return (
    <View style={styles.documentCard}>
      <View style={styles.documentTopRow}>
        <View style={styles.documentInfo}>
          <Text style={styles.documentLabel}>{document.label}</Text>
          <Text style={styles.documentMeta}>
            {extractFileName(document.fileName)}
          </Text>
        </View>

        <Text
          style={[
            styles.statusBadgeText,
            {
              color: getStatusColor(document.status),
            },
          ]}
        >
          {getStatusLabel(document.status)}
        </Text>
      </View>

      <Pressable
        onPress={() => onUpload(document.id)}
        disabled={isUploading}
        android_ripple={ANDROID_RIPPLE}
        style={({ pressed }) => [
          styles.uploadButton,
          (pressed || isUploading) && styles.pressed,
        ]}
      >
        {isUploading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={styles.uploadButtonText}>
            {hasFile ? "Replace document" : "Upload document"}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

export function DocumentsScreen({ onClose }: Readonly<DocumentsScreenProps>) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useProfileQuery();

  const [uploadingId, setUploadingId] = useState<DocumentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const documents = mapProfileDocsToItems(
    profile?.documents as DocumentsDto | undefined,
  );

  const upToDateCount = documents.filter(
    (document) => document.status === "uploaded",
  ).length;

  async function handleUpload(documentType: DocumentType) {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/png"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const file = result.assets[0];

      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const currentDoc = documents.find(
        (document) => document.id === documentType,
      );
      const oldFileUrl = currentDoc?.fileName;

      setUploadingId(documentType);
      setError(null);

      await uploadDocumentToBackend(
        file.uri,
        file.name,
        file.mimeType || "application/pdf",
        documentType,
        token,
        oldFileUrl,
      );

      await queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload document.");
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.backButton}>
          <ChevronLeftIcon size={22} />
        </Pressable>

        <Text style={styles.headerTitle}>Documents</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.introTitle}>Instructor documents</Text>

        <Text style={styles.introText}>
          Keep your licence, accreditation and vehicle documents up to date.
        </Text>

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 20 }}
          />
        ) : (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>
                {upToDateCount} of {documents.length}
              </Text>

              <Text style={styles.summaryLabel}>documents up to date</Text>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.documentList}>
              {documents.map((document) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  isUploading={uploadingId === document.id}
                  onUpload={handleUpload}
                />
              ))}
            </View>
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
  documentList: {
    gap: spacing.sm,
  },
  documentCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.md,
  },
  documentTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  documentInfo: {
    flex: 1,
    gap: 4,
  },
  documentLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  documentMeta: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  uploadButton: {
    alignSelf: "flex-start",
    minWidth: 120,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: "#e8f1ff",
    ...(Platform.OS === "web"
      ? ({ outlineStyle: "none", transition: "opacity 0.15s ease" } as object)
      : {}),
  },
  uploadButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
  },
  pressed: {
    opacity: 0.85,
  },
});
