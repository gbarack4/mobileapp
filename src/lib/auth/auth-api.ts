export type SyncedUser = Readonly<{
  userId: string;
  email: string;
  created: boolean;
}>;

type SyncCognitoUserParams = Readonly<{
  accessToken: string;
  idToken: string;
  signal?: AbortSignal;
}>;

export class AuthSyncError extends Error {
  readonly status: number;

  constructor(status: number) {
    super("Unable to synchronize your account. Please try again.");

    this.name = "AuthSyncError";
    this.status = status;
  }
}

export async function syncCognitoUser({
  accessToken,
  idToken,
  signal,
}: SyncCognitoUserParams): Promise<SyncedUser> {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (!apiUrl) {
    throw new Error("EXPO_PUBLIC_API_URL is not configured");
  }

  if (!accessToken || !idToken) {
    throw new Error("Cognito access token and ID token are required");
  }

  const response = await fetch(`${apiUrl.replace(/\/$/, "")}/auth/sync`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "x-cognito-id-token": idToken,
    },
    signal,
  });

  if (!response.ok) {
    throw new AuthSyncError(response.status);
  }

  const body: unknown = await response.json();
  if (
    typeof body !== "object" ||
    body === null ||
    !("userId" in body) ||
    typeof body.userId !== "string" ||
    !body.userId ||
    !("email" in body) ||
    typeof body.email !== "string" ||
    !body.email ||
    !("created" in body) ||
    typeof body.created !== "boolean"
  ) {
    throw new Error("The server returned an invalid account response.");
  }
  return { userId: body.userId, email: body.email, created: body.created };
}

export type RegistrationProfile = Readonly<{
  firstName: string;
  lastName: string;
  phoneNumber: string;
}>;

export class ProfileUpdateError extends Error {
  readonly status: number;

  constructor(status: number) {
    super("Unable to save your profile. Please try again.");

    this.name = "ProfileUpdateError";
    this.status = status;
  }
}

export async function updateRegistrationProfile(
  accessToken: string,
  profile: RegistrationProfile,
): Promise<void> {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (!apiUrl) {
    throw new Error("EXPO_PUBLIC_API_URL is not configured");
  }

  const response = await fetch(`${apiUrl.replace(/\/$/, "")}/users/profile`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      firstName: profile.firstName.trim(),
      lastName: profile.lastName.trim(),
      phoneNumber: profile.phoneNumber.trim(),
    }),
  });

  if (!response.ok) {
    throw new ProfileUpdateError(response.status);
  }
}
