import { useAuth } from "@clerk/clerk-expo";
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

import { colors, spacing } from "../../constants/theme";
import { ChevronLeftIcon } from "../icons/dashboard-icons";

import { useProfileQuery } from "@/hooks/use-profile";
import { useQueryClient } from "@tanstack/react-query";
import { uploadDocumentToBackend } from "../../services/uploadService";

type DocumentsDto = {
  driverLicence: string;
  instructorAccreditation: string;
  insuranceCertificate: string;
  vehicleRegistration: string;
  workingWithChildrenCheck?: string | null;
  policeCheck?: string | null;
};

type HubDocumentItem = {
  id: keyof DocumentsDto;
  label: string;
  status: "uploaded" | "required";
  fileName?: string;
};

type DocumentsScreenProps = {
  onClose: () => void;
};

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 0, 0, 0.06)" } : undefined;

const DOC_LABELS: Record<keyof DocumentsDto, string> = {
  driverLicence: "Driver Licence",
  instructorAccreditation: "Accreditation",
  insuranceCertificate: "Insurance Certificate",
  vehicleRegistration: "Vehicle Registration",
  workingWithChildrenCheck: "WWCC",
  policeCheck: "Police Check",
};

function mapProfileDocsToItems(docs?: DocumentsDto | null): HubDocumentItem[] {
  const safeDocs = docs || ({} as DocumentsDto);
  return Object.entries(DOC_LABELS).map(([key, label]) => {
    const value = safeDocs[key as keyof DocumentsDto];
    return {
      id: key as keyof DocumentsDto,
      label,
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

type DocumentCardProps = {
  document: HubDocumentItem;
  isUploading: boolean;
  onUpload: (documentId: string) => void;
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
              color: document.status === "uploaded" ? "#16a34a" : colors.error,
            },
          ]}
        >
          {document.status === "uploaded" ? "Up to date" : "Upload required"}
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

  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const documents = mapProfileDocsToItems(
    profile?.documents as DocumentsDto | undefined,
  );
  const upToDateCount = documents.filter((d) => d.status === "uploaded").length;

  async function handleUpload(documentId: string) {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/png"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const file = result.assets[0];
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const currentDoc = documents.find((d) => d.id === documentId);
      const oldFileUrl = currentDoc?.fileName;

      setUploadingId(documentId);
      setError(null);

      await uploadDocumentToBackend(
        file.uri,
        file.name,
        file.mimeType || "application/pdf",
        documentId,
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
          Keep your licence, checks, and insurance up to date.
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
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  isUploading={uploadingId === doc.id}
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
