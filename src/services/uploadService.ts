import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

async function parseUploadJson(body: string): Promise<Record<string, unknown>> {
  try {
    return JSON.parse(body) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function uploadNativeFile(
  url: string,
  localUri: string,
  mimeType: string,
  token: string,
  extraFields?: Record<string, string>,
): Promise<{ status: number; body: string }> {
  const result = await FileSystem.uploadAsync(url, localUri, {
    httpMethod: "POST",
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: "file",
    mimeType: mimeType || "image/jpeg",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    parameters: extraFields,
    sessionType: FileSystem.FileSystemSessionType.FOREGROUND,
  });

  return { status: result.status, body: result.body };
}

export async function uploadAvatarToBackend(
  localUri: string,
  fileName: string,
  mimeType: string,
  token: string,
  oldFileUrl?: string | null,
): Promise<string> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error("EXPO_PUBLIC_API_URL is not defined");
  }

  const extraFields = oldFileUrl ? { oldFileUrl } : undefined;

  try {
    if (Platform.OS !== "web") {
      const result = await uploadNativeFile(
        `${baseUrl}/instructors/upload-avatar`,
        localUri,
        mimeType,
        token,
        extraFields,
      );

      if (result.status < 200 || result.status >= 300) {
        console.error("Server error response:", result.body);
        throw new Error(`Upload failed: ${result.status}`);
      }

      const data = await parseUploadJson(result.body);
      const avatarUrl = data.avatarUrl;

      if (typeof avatarUrl !== "string" || !avatarUrl) {
        throw new Error("Upload failed: missing avatar URL");
      }

      return avatarUrl;
    }

    const formData = new FormData();
    const fileResponse = await fetch(localUri);
    const blob = await fileResponse.blob();
    formData.append("file", blob, fileName);

    if (oldFileUrl) {
      formData.append("oldFileUrl", oldFileUrl);
    }

    const response = await fetch(`${baseUrl}/instructors/upload-avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Server error response:", errorData);
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json();
    return data.avatarUrl;
  } catch (error) {
    console.error("Error uploading photo:", error);
    throw error;
  }
}

export async function uploadDocumentToBackend(
  localUri: string,
  fileName: string,
  mimeType: string,
  documentType: string,
  token: string,
  oldFileUrl?: string | null,
): Promise<string> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error("EXPO_PUBLIC_API_URL is not defined");
  }

  const extraFields: Record<string, string> = { documentType };
  if (oldFileUrl) {
    extraFields.oldFileUrl = oldFileUrl;
  }

  if (Platform.OS !== "web") {
    const result = await uploadNativeFile(
      `${baseUrl}/instructors/upload-document`,
      localUri,
      mimeType,
      token,
      extraFields,
    );

    if (result.status < 200 || result.status >= 300) {
      throw new Error(`Document upload failed: ${result.body}`);
    }

    const data = await parseUploadJson(result.body);
    const fileUrl = data.fileUrl;

    if (typeof fileUrl !== "string" || !fileUrl) {
      throw new Error("Document upload failed: missing file URL");
    }

    return fileUrl;
  }

  const formData = new FormData();
  const fileResponse = await fetch(localUri);
  const blob = await fileResponse.blob();
  formData.append("file", blob, fileName);
  formData.append("documentType", documentType);
  if (oldFileUrl) {
    formData.append("oldFileUrl", oldFileUrl);
  }

  const url = `${baseUrl}/instructors/upload-document`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Document upload failed: ${errorText}`);
  }

  const data = (await response.json()) as {
    success: boolean;
    fileUrl: string;
    key: string;
  };
  return data.fileUrl;
}
