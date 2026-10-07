import { refreshOAuthSession } from "./oauth-client";
import { logoutOAuthBrowserSession } from "./oauth-logout";
import { clearOAuthTransaction } from "./oauth-transaction";
import {
  decodeRefreshCredential,
  encodeRefreshCredential,
  type RefreshMethod,
} from "./refresh-credential";
import {
  type CognitoAuthenticationResult,
  getAuthenticationResult,
  signOutAmplifySession,
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
import {
  clearLastActivity,
  getLastActivityAt,
  hasInactivityExpired,
  hydrateLastActivity,
  recordUserActivity,
} from "./inactivity";

export type AuthUser = Readonly<{ id: string; email: string }>;

export type CognitoSession = Readonly<{
  user: AuthUser;
  accessToken: string;
  idToken: string;
  refreshToken: string;
  refreshMethod: RefreshMethod;
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
let browserLogoutPending = false;

function withStorage<T>(operation: () => Promise<T>): Promise<T> {
  const pending = storageQueue.then(operation);

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
  result: CognitoAuthenticationResult,
  refreshMethod: RefreshMethod,
): Omit<CognitoSession, "user"> {
  const { AccessToken, IdToken, RefreshToken, ExpiresIn } = result;

  if (
    !AccessToken ||
    !IdToken ||
    typeof ExpiresIn !== "number" ||
    !Number.isFinite(ExpiresIn) ||
    ExpiresIn <= 0
  ) {
    throw new Error("Cognito did not return a complete session");
  }

  if (refreshMethod === "oauth" && !RefreshToken) {
    throw new Error("Cognito did not return a complete session");
  }

  return {
    accessToken: AccessToken,
    idToken: IdToken,
    refreshToken: RefreshToken ?? "",
    refreshMethod,
    expiresAt: Date.now() + ExpiresIn * 1000,
  };
}

export async function setCognitoSession(
  result: CognitoAuthenticationResult,
  profile?: RegistrationProfile,
  expectedVersion = sessionVersion,
  refreshMethod: RefreshMethod = "password",
): Promise<CognitoSession | null> {
  if (expectedVersion !== sessionVersion) return null;
  const tokens = createSession(result, refreshMethod);
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

  if (profile) {
    await updateRegistrationProfile(nextSession.accessToken, profile);

    if (version !== sessionVersion) {
      return null;
    }
  }

  if (nextSession.refreshToken) {
    await withStorage(async () => {
      if (version !== sessionVersion) {
        return;
      }

      await writeRefreshToken(encodeRefreshCredential(nextSession));
    });
  }

  if (version !== sessionVersion) {
    return null;
  }

  canRestoreFromStorage = true;
  publishSession(nextSession);
  await recordUserActivity();

  return nextSession;
}

function isInvalidRefreshToken(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "NotAuthorizedException" ||
    error.name === "UserNotFoundException" ||
    error.name === "OAuthInvalidGrant" ||
    error.name === "UserUnAuthenticatedException"
  );
}

async function invalidateSession(version: number): Promise<void> {
  if (version !== sessionVersion) {
    return;
  }

  sessionVersion += 1;
  canRestoreFromStorage = false;
  refreshInFlight = null;

  const removal = withStorage(async () => {
    await Promise.all([removeRefreshToken(), clearLastActivity()]);
  });

  publishSession(null);

  await removal;
}

async function refreshPasswordSession(
  version: number,
  requestedAt: number,
  storedRefreshToken: string,
  forceRefresh: boolean,
): Promise<CognitoSession | null> {
  const result = await getAuthenticationResult(forceRefresh);

  if (version !== sessionVersion) {
    return null;
  }

  if (!result) {
    canRestoreFromStorage = false;
    publishSession(null);
    return null;
  }

  if (
    !result.AccessToken ||
    !result.IdToken ||
    !Number.isFinite(result.ExpiresIn) ||
    result.ExpiresIn <= 0
  ) {
    throw new Error("Cognito returned an invalid refreshed session");
  }

  let user = session?.user;
  if (!user) {
    const identity = await syncCognitoUser({
      accessToken: result.AccessToken,
      idToken: result.IdToken,
    });
    if (version !== sessionVersion) return null;
    user = { id: identity.userId, email: identity.email };
  }

  const nextSession: CognitoSession = {
    user,
    accessToken: result.AccessToken,
    idToken: result.IdToken,
    refreshToken: result.RefreshToken ?? storedRefreshToken,
    refreshMethod: "password",
    expiresAt: requestedAt + result.ExpiresIn * 1000,
  };

  if (version !== sessionVersion) return null;
  publishSession(nextSession);

  return nextSession;
}

async function refreshSession(version: number): Promise<CognitoSession | null> {
  const credential =
    session ?? decodeRefreshCredential(await withStorage(readRefreshToken));

  if (version !== sessionVersion) {
    return null;
  }

  const requestedAt = Date.now();

  if (!credential || credential.refreshMethod === "password") {
    try {
      return await refreshPasswordSession(
        version,
        requestedAt,
        credential?.refreshToken ?? "",
        Boolean(session),
      );
    } catch (error: unknown) {
      if (version !== sessionVersion) {
        return null;
      }

      if (isInvalidRefreshToken(error)) {
        await invalidateSession(version);
        return null;
      }

      throw error;
    }
  }

  const { refreshToken, refreshMethod } = credential;

  try {
    const result = await refreshOAuthSession(refreshToken);

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

    const nextRefreshToken = result.refreshToken ?? refreshToken;
    if (nextRefreshToken !== refreshToken) {
      await withStorage(async () => {
        if (version === sessionVersion) {
          await writeRefreshToken(
            encodeRefreshCredential({
              refreshToken: nextRefreshToken,
              refreshMethod,
            }),
          );
        }
      });
      if (version !== sessionVersion) return null;
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
      refreshToken: nextRefreshToken,
      refreshMethod,
      expiresAt: requestedAt + result.expiresIn * 1000,
    };

    if (version !== sessionVersion) return null;
    publishSession(nextSession);

    return nextSession;
  } catch (error: unknown) {
    if (version !== sessionVersion) {
      return null;
    }

    if (isInvalidRefreshToken(error)) {
      await invalidateSession(version);
      return null;
    }

    throw error;
  }
}

function getOrRefreshCognitoSession(): Promise<CognitoSession | null> {
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

export async function getValidCognitoSession(): Promise<CognitoSession | null> {
  await hydrateLastActivity();

  if (hasInactivityExpired()) {
    await signOutCognitoSession();
    return null;
  }

  const currentSession = await getOrRefreshCognitoSession();

  if (currentSession && getLastActivityAt() == null) {
    await recordUserActivity();
  }

  return currentSession;
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
  const wasOAuth = session?.refreshMethod === "oauth";
  if (wasOAuth) browserLogoutPending = true;

  sessionVersion += 1;
  canRestoreFromStorage = false;
  refreshInFlight = null;

  const removal = withStorage(async () => {
    try {
      const stored = decodeRefreshCredential(await readRefreshToken());
      if (stored?.refreshMethod === "oauth") browserLogoutPending = true;
    } finally {
      await Promise.all([removeRefreshToken(), clearLastActivity()]);
    }
  });

  publishSession(null);

  const cleanup = await Promise.allSettled([
    removal,
    clearOAuthTransaction(),
    wasOAuth ? Promise.resolve() : signOutAmplifySession(),
  ]);

  for (const result of cleanup) {
    if (result.status === "rejected") throw result.reason;
  }

  if (browserLogoutPending) {
    await logoutOAuthBrowserSession();
    browserLogoutPending = false;
  }
}

export function getAuthOperationVersion(): number {
  return sessionVersion;
}
