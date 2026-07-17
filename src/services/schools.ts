import type { School } from '../types/school';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export class SchoolsApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'SchoolsApiError';
  }
}

async function request<T>(path: string): Promise<T> {
  if (!API_BASE_URL) {
    throw new SchoolsApiError('EXPO_PUBLIC_API_URL is not defined', 0);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      typeof body?.message === 'string'
        ? body.message
        : Array.isArray(body?.message)
          ? body.message.join(', ')
          : 'Unable to load schools.';

    throw new SchoolsApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export async function searchSchools(query = ''): Promise<School[]> {
  const trimmed = query.trim();
  const path = trimmed
    ? `/schools/search?q=${encodeURIComponent(trimmed)}`
    : '/schools/search';

  return request<School[]>(path);
}

export async function getSchool(id: string): Promise<School> {
  return request<School>(`/schools/${encodeURIComponent(id)}`);
}
