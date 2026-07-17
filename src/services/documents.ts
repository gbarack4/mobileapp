import { Platform } from 'react-native';

import type { HubDocumentItem } from '../data/mock-hub-account';
import { getSessionEmail } from './session';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const DEV_PROFILE_EMAIL = __DEV__
  ? process.env.EXPO_PUBLIC_DEV_PROFILE_EMAIL?.trim().toLowerCase() || null
  : null;

function resolveSessionEmail() {
  return getSessionEmail() || DEV_PROFILE_EMAIL;
}

export class DocumentsApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'DocumentsApiError';
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new DocumentsApiError('EXPO_PUBLIC_API_URL is not defined', 0);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, init);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      typeof body?.message === 'string'
        ? body.message
        : Array.isArray(body?.message)
          ? body.message.join(', ')
          : 'Unable to load documents.';

    throw new DocumentsApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export async function listInstructorDocuments(
  accessToken?: string | null,
): Promise<HubDocumentItem[]> {
  if (accessToken) {
    return requestJson<HubDocumentItem[]>('/instructors/documents', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  const email = resolveSessionEmail();
  if (!email) {
    throw new DocumentsApiError('Sign in to load documents.', 401);
  }

  return requestJson<HubDocumentItem[]>(
    `/instructors/documents-by-email?email=${encodeURIComponent(email)}`,
  );
}

export async function uploadInstructorDocument(params: {
  localUri: string;
  fileName: string;
  mimeType: string;
  documentType: string;
  accessToken?: string | null;
}): Promise<{ fileUrl: string; fileName: string; documentType: string }> {
  if (!API_BASE_URL) {
    throw new DocumentsApiError('EXPO_PUBLIC_API_URL is not defined', 0);
  }

  const formData = new FormData();

  if (Platform.OS === 'web') {
    const fileResponse = await fetch(params.localUri);
    const blob = await fileResponse.blob();
    formData.append('file', blob, params.fileName);
  } else {
    formData.append('file', {
      uri: params.localUri,
      name: params.fileName,
      type: params.mimeType,
    } as unknown as Blob);
  }

  formData.append('documentType', params.documentType);

  const query = new URLSearchParams({
    documentType: params.documentType,
  });

  let path = `/instructors/upload-document?${query.toString()}`;
  const headers: Record<string, string> = {};

  if (params.accessToken) {
    headers.Authorization = `Bearer ${params.accessToken}`;
  } else {
    const email = resolveSessionEmail();
    if (!email) {
      throw new DocumentsApiError('Sign in to upload documents.', 401);
    }
    query.set('email', email);
    path = `/instructors/upload-document-by-email?${query.toString()}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new DocumentsApiError(
      errorText || 'Document upload failed.',
      response.status,
    );
  }

  return response.json() as Promise<{
    fileUrl: string;
    fileName: string;
    documentType: string;
  }>;
}
