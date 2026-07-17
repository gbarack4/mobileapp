import type { InstructorProfile } from '../data/mock-account';
import { getSessionEmail } from './session';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const DEV_PROFILE_EMAIL = __DEV__
  ? process.env.EXPO_PUBLIC_DEV_PROFILE_EMAIL?.trim().toLowerCase() || null
  : null;

function resolveSessionEmail() {
  return getSessionEmail() || DEV_PROFILE_EMAIL;
}

export type AccountProfileResponse = {
  exists: boolean;
  id: string;
  instructorId: string | null;
  name: string;
  initials: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  address: string | null;
  rating: number | null;
  subtitle: string;
  role: string;
};

export type UpdatePersonalInfoPayload = {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
};

export class ProfileApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'ProfileApiError';
  }
}

function mapProfile(data: AccountProfileResponse): InstructorProfile {
  return {
    name: data.name,
    initials: data.initials,
    subtitle: data.subtitle,
    email: data.email,
    rating: data.rating ?? 0,
    vehicleSummary: '',
  };
}

async function requestProfile(
  path: string,
  init?: RequestInit,
): Promise<AccountProfileResponse | null> {
  if (!API_BASE_URL) {
    throw new ProfileApiError('EXPO_PUBLIC_API_URL is not defined', 0);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      typeof body?.message === 'string'
        ? body.message
        : Array.isArray(body?.message)
          ? body.message.join(', ')
          : 'Unable to load profile.';

    throw new ProfileApiError(message, response.status);
  }

  return response.json() as Promise<AccountProfileResponse>;
}

/**
 * Loads the full account profile from the NestJS API / database.
 */
export async function getMyAccountProfile(
  accessToken?: string | null,
): Promise<AccountProfileResponse | null> {
  if (accessToken) {
    try {
      const profile = await requestProfile('/users/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (profile?.exists) {
        return profile;
      }
    } catch (error) {
      if (!(error instanceof ProfileApiError) || error.statusCode !== 401) {
        throw error;
      }
    }
  }

  const email = resolveSessionEmail();
  if (!email) {
    return null;
  }

  const profile = await requestProfile(
    `/users/account-profile?email=${encodeURIComponent(email)}`,
  );

  if (!profile?.exists) {
    return null;
  }

  return profile;
}

export async function updateMyAccountProfile(
  payload: UpdatePersonalInfoPayload,
  accessToken?: string | null,
): Promise<AccountProfileResponse> {
  if (accessToken) {
    const profile = await requestProfile('/users/me', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!profile) {
      throw new ProfileApiError('Profile not found', 404);
    }

    return profile;
  }

  const email = resolveSessionEmail();
  if (!email) {
    throw new ProfileApiError('Sign in to save your profile.', 401);
  }

  const profile = await requestProfile(
    `/users/account-profile?email=${encodeURIComponent(email)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );

  if (!profile) {
    throw new ProfileApiError('Profile not found', 404);
  }

  return profile;
}

/**
 * Loads the signed-in instructor profile from the NestJS API / database.
 * Prefers authenticated `/users/me` with a Clerk token, then falls back to
 * email lookup when a session email is available.
 */
export async function getMyProfile(
  accessToken?: string | null,
): Promise<InstructorProfile | null> {
  const profile = await getMyAccountProfile(accessToken);
  return profile ? mapProfile(profile) : null;
}
