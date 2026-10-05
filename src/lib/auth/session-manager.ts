import type { AuthenticationResultType } from "@aws-sdk/client-cognito-identity-provider";
import { refreshOAuthSession } from "./oauth-client";
import { logoutOAuthBrowserSession } from "./oauth-logout";
import { clearOAuthTransaction } from "./oauth-transaction";
import {
  decodeRefreshCredential,
  encodeRefreshCredential,
  type RefreshMethod,
} from "./refresh-credential";

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
const pendingRevocations = new Set<string>();
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
  result: AuthenticationResultType,
  refreshMethod: RefreshMethod,
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
    refreshMethod,
    expiresAt: Date.now() + ExpiresIn * 1000,
  };
}

export async function setCognitoSession(
  result: AuthenticationResultType,
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

  await withStorage(async () => {
    if (version !== sessionVersion) {
      return;
    }

    await writeRefreshToken(encodeRefreshCredential(nextSession));
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
    error.name === "UserNotFoundException" ||
    error.name === "OAuthInvalidGrant"
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
  const credential =
    session ?? decodeRefreshCredential(await withStorage(readRefreshToken));

  if (version !== sessionVersion) {
    return null;
  }

  if (!credential) {
    canRestoreFromStorage = false;
    publishSession(null);
    return null;
  }

  const requestedAt = Date.now();
  const { refreshToken, refreshMethod } = credential;

  try {
    const result =
      refreshMethod === "oauth"
        ? await refreshOAuthSession(refreshToken)
        : { ...(await refreshCognitoSession(refreshToken)), refreshToken };

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
          await writeRefreshToken(encodeRefreshCredential({
            refreshToken: nextRefreshToken, refreshMethod,
          }));
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
  if (session?.refreshMethod === "oauth") browserLogoutPending = true;
  if (memoryRefreshToken) pendingRevocations.add(memoryRefreshToken);

  sessionVersion += 1;
  canRestoreFromStorage = false;
  refreshInFlight = null;

  const removal = withStorage(async () => {
    let refreshToken = memoryRefreshToken;

    try {
      const stored = decodeRefreshCredential(await readRefreshToken());
      refreshToken ??= stored?.refreshToken ?? null;
      if (stored?.refreshMethod === "oauth") browserLogoutPending = true;
      if (refreshToken) pendingRevocations.add(refreshToken);
    } finally {      
      await removeRefreshToken();
    }

    return refreshToken;
  });
 
  publishSession(null);

  const cleanup = await Promise.allSettled([removal, clearOAuthTransaction()]);
  for (const token of pendingRevocations) {
    await revokeCognitoRefreshToken(token);
    pendingRevocations.delete(token);
  }
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
