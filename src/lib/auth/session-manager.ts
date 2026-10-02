import type { AuthenticationResultType } from "@aws-sdk/client-cognito-identity-provider";

import {
  refreshCognitoSession,
  revokeCognitoRefreshToken,
} from "./cognito.client";
import {
  readRefreshToken,
  removeRefreshToken,
  writeRefreshToken,
} from "./token-storage";
import {
  type RegistrationProfile,
  syncCognitoUser,
  updateRegistrationProfile,
} from "./auth-api";

export type AuthUser = Readonly<{ id: string; email: string }>;

export type CognitoSession = Readonly<{
  user: AuthUser;
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}>;

type SessionListener = () => void;

const REFRESH_MARGIN_MS = 60_000;

let session: CognitoSession | null = null;
let sessionVersion = 0;
let canRestoreFromStorage = true;

let refreshInFlight: {
  version: number;
  promise: Promise<CognitoSession | null>;
} | null = null;

let storageQueue: Promise<void> = Promise.resolve();

const listeners = new Set<SessionListener>();
const pendingRevocations = new Set<string>();

// Serialize storage operations so an old write cannot overwrite
// a later logout or a new sign-in.
function withStorage<T>(operation: () => Promise<T>): Promise<T> {
  const pending = storageQueue.then(operation);

  // Keep the queue usable after failure.
  // The caller still receives the original rejected promise.
  storageQueue = pending.then(
    () => undefined,
    () => undefined,
  );

  return pending;
}

function publishSession(nextSession: CognitoSession | null): void {
  session = nextSession;

  for (const listener of listeners) {
    listener();
  }
}

export function getSessionSnapshot(): CognitoSession | null {
  return session;
}

export function subscribeToSession(listener: SessionListener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function createSession(
  result: AuthenticationResultType,
): Omit<CognitoSession, "user"> {
  const { AccessToken, IdToken, RefreshToken, ExpiresIn } = result;

  if (
    !AccessToken ||
    !IdToken ||
    !RefreshToken ||
    typeof ExpiresIn !== "number" ||
    !Number.isFinite(ExpiresIn) ||
    ExpiresIn <= 0
  ) {
    throw new Error("Cognito did not return a complete session");
  }

  return {
    accessToken: AccessToken,
    idToken: IdToken,
    refreshToken: RefreshToken,
    expiresAt: Date.now() + ExpiresIn * 1000,
  };
}

// Call only after Cognito returns a successful AuthenticationResult.
// MFA and other challenges must be completed before this step.
export async function setCognitoSession(
  result: AuthenticationResultType,
  profile?: RegistrationProfile,
  expectedVersion = sessionVersion,
): Promise<CognitoSession | null> {
  if (expectedVersion !== sessionVersion) return null;
  const tokens = createSession(result);
  const version = ++sessionVersion;

  canRestoreFromStorage = false;
  refreshInFlight = null;

  publishSession(null);

  const identity = await syncCognitoUser({
    accessToken: tokens.accessToken,
    idToken: tokens.idToken,
  });
  const nextSession: CognitoSession = {
    ...tokens,
    user: { id: identity.userId, email: identity.email },
  };

  if (version !== sessionVersion) {
    return null;
  }

  // Registration supplies profile details.
  // Normal sign-in leaves the existing profile unchanged.
  if (profile) {
    await updateRegistrationProfile(nextSession.accessToken, profile);

    if (version !== sessionVersion) {
      return null;
    }
  }

  await withStorage(async () => {
    if (version !== sessionVersion) {
      return;
    }

    await writeRefreshToken(nextSession.refreshToken);
  });

  if (version !== sessionVersion) {
    return null;
  }

  canRestoreFromStorage = true;
  publishSession(nextSession);

  return nextSession;
}

function isInvalidRefreshToken(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "NotAuthorizedException" ||
    error.name === "UserNotFoundException"
  );
}

async function invalidateSession(version: number): Promise<void> {
  if (version !== sessionVersion) {
    return;
  }

  sessionVersion += 1;
  canRestoreFromStorage = false;
  refreshInFlight = null;

  const removal = withStorage(removeRefreshToken);

  publishSession(null);

  await removal;
}

async function refreshSession(version: number): Promise<CognitoSession | null> {
  const refreshToken =
    session?.refreshToken ?? (await withStorage(readRefreshToken));

  if (version !== sessionVersion) {
    return null;
  }

  if (!refreshToken) {
    canRestoreFromStorage = false;
    publishSession(null);
    return null;
  }

  // Use the request start time for a conservative expiration estimate.
  const requestedAt = Date.now();

  try {
    const result = await refreshCognitoSession(refreshToken);

    if (version !== sessionVersion) {
      return null;
    }

    if (
      !result.accessToken ||
      !result.idToken ||
      !Number.isFinite(result.expiresIn) ||
      result.expiresIn <= 0
    ) {
      throw new Error("Cognito returned an invalid refreshed session");
    }

    let user = session?.user;
    if (!user) {
      const identity = await syncCognitoUser({
        accessToken: result.accessToken,
        idToken: result.idToken,
      });
      if (version !== sessionVersion) return null;
      user = { id: identity.userId, email: identity.email };
    }

    const nextSession: CognitoSession = {
      user,
      accessToken: result.accessToken,
      idToken: result.idToken,
      refreshToken,
      expiresAt: requestedAt + result.expiresIn * 1000,
    };

    publishSession(nextSession);

    return nextSession;
  } catch (error: unknown) {
    // A response from a previous session must not affect the current one.
    if (version !== sessionVersion) {
      return null;
    }

    if (isInvalidRefreshToken(error)) {
      await invalidateSession(version);
      return null;
    }

    // Network errors, throttling and server failures do not remove
    // the saved refresh token. The caller can retry.
    throw error;
  }
}

export function getValidCognitoSession(): Promise<CognitoSession | null> {
  if (session && session.expiresAt > Date.now() + REFRESH_MARGIN_MS) {
    return Promise.resolve(session);
  }

  if (!canRestoreFromStorage) {
    return Promise.resolve(null);
  }

  const version = sessionVersion;

  if (refreshInFlight?.version === version) {
    return refreshInFlight.promise;
  }

  const promise = refreshSession(version).finally(() => {
    if (refreshInFlight?.version === version) {
      refreshInFlight = null;
    }
  });

  refreshInFlight = { version, promise };

  return promise;
}

export async function getCognitoAccessToken(): Promise<string | null> {
  const currentSession = await getValidCognitoSession();

  return currentSession?.accessToken ?? null;
}

export async function getCognitoIdToken(): Promise<string | null> {
  const currentSession = await getValidCognitoSession();

  return currentSession?.idToken ?? null;
}

export async function signOutCognitoSession(): Promise<void> {
  const memoryRefreshToken = session?.refreshToken ?? null;
  if (memoryRefreshToken) pendingRevocations.add(memoryRefreshToken);

  sessionVersion += 1;
  canRestoreFromStorage = false;
  refreshInFlight = null;

  const removal = withStorage(async () => {
    let refreshToken = memoryRefreshToken;

    try {
      refreshToken ??= await readRefreshToken();
    } finally {
      // Attempt removal even if reading storage fails.
      await removeRefreshToken();
    }

    return refreshToken;
  });

  // Local access ends immediately, before storage or network operations.
  publishSession(null);

  const refreshToken = await removal;

  if (refreshToken) pendingRevocations.add(refreshToken);
  for (const token of pendingRevocations) {
    await revokeCognitoRefreshToken(token);
    pendingRevocations.delete(token);
  }
}

// Capture before an asynchronous login request. Logout/new login invalidates it.
export function getAuthOperationVersion(): number {
  return sessionVersion;
}
