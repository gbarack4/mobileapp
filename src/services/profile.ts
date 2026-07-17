import {
  MOCK_INSTRUCTOR_PROFILE,
  type InstructorProfile,
} from '../data/mock-account';
import {
  formatInstructorAddress,
  MOCK_INSTRUCTOR_ADDRESS,
} from '../data/mock-instructor-address';
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

/** In-memory mock so Save works while the backend is offline. */
let mockProfileDraft: AccountProfileResponse | null = null;

function buildMockAccountProfile(
  overrides?: Partial<AccountProfileResponse>,
): AccountProfileResponse {
  const nameParts = MOCK_INSTRUCTOR_PROFILE.name.trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] ?? 'George';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

  return {
    exists: true,
    id: 'mock-user',
    instructorId: 'mock-instructor',
    name: MOCK_INSTRUCTOR_PROFILE.name,
    initials: MOCK_INSTRUCTOR_PROFILE.initials,
    email: resolveSessionEmail() || MOCK_INSTRUCTOR_PROFILE.email,
    firstName,
    lastName,
    phone: '+61 412 345 678',
    address: formatInstructorAddress(MOCK_INSTRUCTOR_ADDRESS),
    rating: MOCK_INSTRUCTOR_PROFILE.rating,
    subtitle: MOCK_INSTRUCTOR_PROFILE.subtitle,
    role: 'instructor',
    ...overrides,
  };
}

/** Sync mock/offline profile — use to paint the form instantly before API hydrate. */
export function getOfflineAccountProfile(): AccountProfileResponse {
  if (mockProfileDraft) {
    return {
      ...mockProfileDraft,
      email: resolveSessionEmail() || mockProfileDraft.email,
    };
  }

  return buildMockAccountProfile();
}

function applyMockPersonalInfoUpdate(
  payload: UpdatePersonalInfoPayload,
): AccountProfileResponse {
  const current = getMockAccountProfile();
  const firstName =
    payload.firstName !== undefined
      ? payload.firstName.trim() || null
      : current.firstName;
  const lastName =
    payload.lastName !== undefined
      ? payload.lastName.trim() || null
      : current.lastName;
  const phone =
    payload.phoneNumber !== undefined
      ? payload.phoneNumber.trim() || null
      : current.phone;
  const address =
    payload.address !== undefined ? payload.address.trim() || null : current.address;
  const name =
    [firstName, lastName].filter(Boolean).join(' ').trim() || current.name;
  const initials =
    [firstName?.[0], lastName?.[0]].filter(Boolean).join('').toUpperCase() ||
    current.initials;

  mockProfileDraft = {
    ...current,
    firstName,
    lastName,
    phone,
    address,
    name,
    initials,
  };

  return mockProfileDraft;
}

function getMockAccountProfile(): AccountProfileResponse {
  return getOfflineAccountProfile();
}

function mapProfile(data: AccountProfileResponse): InstructorProfile {
  return {
    name: data.name,
    initials: data.initials,
    subtitle: data.subtitle,
    phone: data.phone?.trim() || MOCK_INSTRUCTOR_PROFILE.phone,
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
 * Falls back to mock personal info when the backend is offline.
 */
export async function getMyAccountProfile(
  accessToken?: string | null,
): Promise<AccountProfileResponse | null> {
  try {
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
    if (email) {
      const profile = await requestProfile(
        `/users/account-profile?email=${encodeURIComponent(email)}`,
      );

      if (profile?.exists) {
        return profile;
      }
    }
  } catch {
    // Backend unavailable — use mock below.
  }

  return getMockAccountProfile();
}

export async function updateMyAccountProfile(
  payload: UpdatePersonalInfoPayload,
  accessToken?: string | null,
): Promise<AccountProfileResponse> {
  try {
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
  } catch {
    return applyMockPersonalInfoUpdate(payload);
  }
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
