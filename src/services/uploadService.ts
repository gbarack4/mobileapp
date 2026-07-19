import { Platform } from "react-native";

export async function uploadAvatarToBackend(
  localUri: string,
  fileName: string,
  mimeType: string,
  token: string,
  oldFileUrl?: string | null,
): Promise<string> {
  const formData = new FormData();

  if (Platform.OS === "web") {
    const fileResponse = await fetch(localUri);
    const blob = await fileResponse.blob();
    formData.append("file", blob, fileName);
  } else {
    formData.append("file", {
      uri: localUri,
      name: fileName,
      type: mimeType,
    } as any);
  }

  if (oldFileUrl) {
    formData.append("oldFileUrl", oldFileUrl);
  }

  const baseUrl = process.env.EXPO_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error("EXPO_PUBLIC_API_URL is not defined");
  }

  try {
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
  const formData = new FormData();

  if (Platform.OS === "web") {
    const fileResponse = await fetch(localUri);
    const blob = await fileResponse.blob();
    formData.append("file", blob, fileName);
  } else {
    formData.append("file", {
      uri: localUri,
      name: fileName,
      type: mimeType,
    } as any);
  }

  formData.append("documentType", documentType);
  if (oldFileUrl) {
    formData.append("oldFileUrl", oldFileUrl);
  }

  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error("EXPO_PUBLIC_API_URL is not defined");
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
