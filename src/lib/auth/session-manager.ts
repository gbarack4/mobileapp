import type { AuthenticationResultType } from "@aws-sdk/client-cognito-identity-provider";
import { idleTimeRemaining } from "./session-idle";
import { refreshOAuthSession } from "./oauth-client";
import { logoutOAuthBrowserSession } from "./oauth-logout";
import { clearOAuthTransaction } from "./oauth-transaction";
import {
  decodeRefreshCredential,
  encodeRefreshCredential,
  type RefreshMethod,
  type RefreshCredential,
} from "./refresh-credential";

import {
  refreshCognitoSession,
  revokeCognitoRefreshToken,
} from "./cognito.client";
import {
  readExpiryNotice,
  writeExpiryNotice,
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
let lastActivityAt: number | null = null;
let sessionExpired = false;
let expiryInFlight: Promise<void> | null = null;
let activityWriteInFlight: Promise<void> | null = null;

export function getSessionExpiredSnapshot(): boolean {
  return sessionExpired;
}

function publishExpiryNotice(value: boolean): void {
  sessionExpired = value;
  for (const listener of listeners) listener();
}

export function getSessionIdleRemaining(): number | null {
  return lastActivityAt === null ? null : idleTimeRemaining(lastActivityAt);
}

export function expireInactiveSession(): Promise<void> {
  if (expiryInFlight) return expiryInFlight;
  const pending = signOutCognitoSession(true).finally(() => {
    if (expiryInFlight === pending) expiryInFlight = null;
  });
  expiryInFlight = pending;
  return pending;
}

export async function recordSessionActivity(): Promise<void> {
  if (!session || lastActivityAt === null) return;
  if (idleTimeRemaining(lastActivityAt) === 0) {
    await expireInactiveSession();
    return;
  }
  lastActivityAt = Date.now();
 
  if (activityWriteInFlight) return activityWriteInFlight;
  const version = sessionVersion;
  const pending = persistActivity(version).finally(() => {
    if (activityWriteInFlight === pending) activityWriteInFlight = null;
  });
  activityWriteInFlight = pending;
  await pending;
}

async function persistActivity(version: number): Promise<void> {
  const savedAt = await withStorage(async () => {
    if (version !== sessionVersion || !session || lastActivityAt === null)
      return null;
    const stored = decodeRefreshCredential(await readRefreshToken());
    if (version !== sessionVersion || !stored || lastActivityAt === null)
      return null;
    const timestamp = lastActivityAt;
    await writeRefreshToken(
      encodeRefreshCredential({ ...stored, lastActivityAt: timestamp }),
    );
    return timestamp;
  });
  if (
    savedAt !== null &&
    version === sessionVersion &&
    lastActivityAt !== savedAt
  ) {
    await persistActivity(version);
  }
}

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
  lastActivityAt = null;
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

    lastActivityAt = Date.now();
    await writeRefreshToken(
      encodeRefreshCredential({ ...nextSession, lastActivityAt }),
    );
    await writeExpiryNotice(null);
  });

  if (version !== sessionVersion) {
    return null;
  }

  canRestoreFromStorage = true;
  publishExpiryNotice(false);
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

  lastActivityAt = null;
  const removal = withStorage(removeRefreshToken);

  publishSession(null);

  await removal;
}

async function readSessionCredential(
  version: number,
): Promise<RefreshCredential | null> {
  if (session)
    return { ...session, lastActivityAt: lastActivityAt ?? undefined };
  const notice = await withStorage(readExpiryNotice);
  if (version !== sessionVersion) return null;
  if (notice) {
    browserLogoutPending = notice === "oauth";
    canRestoreFromStorage = false;
    publishExpiryNotice(true);
    return null;
  }
  return decodeRefreshCredential(await withStorage(readRefreshToken));
}

async function prepareIdleClock(
  credential: RefreshCredential,
  version: number,
): Promise<boolean> {
 
  lastActivityAt ??= credential.lastActivityAt ?? Date.now();
  if (idleTimeRemaining(lastActivityAt) === 0) {
    await expireInactiveSession();
    return false;
  }
  if (credential.lastActivityAt === undefined) {
    await withStorage(async () => {
      if (version !== sessionVersion || lastActivityAt === null) return;
      await writeRefreshToken(
        encodeRefreshCredential({ ...credential, lastActivityAt }),
      );
    });
  }
  return version === sessionVersion;
}

async function persistRotatedCredential(
  previous: string,
  next: string,
  refreshMethod: RefreshMethod,
  version: number,
): Promise<void> {
  if (previous === next) return;
  await withStorage(async () => {
    if (version !== sessionVersion) return;
    await writeRefreshToken(
      encodeRefreshCredential({
        refreshToken: next,
        refreshMethod,
        lastActivityAt: lastActivityAt ?? undefined,
      }),
    );
  });
}

async function restoreUser(
  accessToken: string,
  idToken: string,
): Promise<AuthUser> {
  const identity = await syncCognitoUser({ accessToken, idToken });
  return { id: identity.userId, email: identity.email };
}

async function refreshSession(version: number): Promise<CognitoSession | null> {
  const credential = await readSessionCredential(version);
  if (version !== sessionVersion) return null;
  if (!credential) {
    canRestoreFromStorage = false;
    publishSession(null);
    return null;
  }
  if (!(await prepareIdleClock(credential, version))) return null;
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
    await persistRotatedCredential(
      refreshToken,
      nextRefreshToken,
      refreshMethod,
      version,
    );
    if (version !== sessionVersion) return null;
    const user =
      session?.user ?? (await restoreUser(result.accessToken, result.idToken));

    const nextSession: CognitoSession = {
      user,
      accessToken: result.accessToken,
      idToken: result.idToken,
      refreshToken: nextRefreshToken,
      refreshMethod,
      expiresAt: requestedAt + result.expiresIn * 1000,
    };

    if (version !== sessionVersion) return null;
    if (lastActivityAt !== null && idleTimeRemaining(lastActivityAt) === 0) {
      await expireInactiveSession();
      return null;
    }
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
  if (
    session &&
    lastActivityAt !== null &&
    idleTimeRemaining(lastActivityAt) === 0
  ) {
    return expireInactiveSession().then(() => null);
  }
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

async function removeSavedSession(
  memoryRefreshToken: string | null,
  inactivity: boolean,
): Promise<void> {
  try {
    const stored = decodeRefreshCredential(await readRefreshToken());
    if (stored?.refreshMethod === "oauth") browserLogoutPending = true;
    
    const refreshToken = stored?.refreshToken ?? memoryRefreshToken;
    if (refreshToken) pendingRevocations.add(refreshToken);
    if (inactivity)
      await writeExpiryNotice(browserLogoutPending ? "oauth" : "password");
  } finally {
    await removeRefreshToken();
  }
}

async function revokePendingTokens(): Promise<void> {
  const results = await Promise.allSettled(
    [...pendingRevocations].map(async (token) => {
      try {
        await revokeCognitoRefreshToken(token);
      } catch (error: unknown) {
        if (!isInvalidRefreshToken(error)) throw error;
      }
      pendingRevocations.delete(token);
    }),
  );
  for (const result of results) {
    if (result.status === "rejected") throw result.reason;
  }
}

async function finishBrowserLogout(): Promise<void> {
 
  await withStorage(() => writeExpiryNotice(null));
  try {
    if (browserLogoutPending) await logoutOAuthBrowserSession();
  } catch (error: unknown) {
    if (sessionExpired) await withStorage(() => writeExpiryNotice("oauth"));
    throw error;
  }
  browserLogoutPending = false;
  publishExpiryNotice(false);
}

export async function signOutCognitoSession(inactivity = false): Promise<void> {
  if (!inactivity && expiryInFlight) {
   
    await expiryInFlight.catch(() => undefined);
  }
  const memoryRefreshToken = session?.refreshToken ?? null;
  if (session?.refreshMethod === "oauth") browserLogoutPending = true;
  if (memoryRefreshToken) pendingRevocations.add(memoryRefreshToken);

  sessionVersion += 1;
  canRestoreFromStorage = false;
  refreshInFlight = null;

  lastActivityAt = null;
  if (inactivity) publishExpiryNotice(true);

  const removal = withStorage(() =>
    removeSavedSession(memoryRefreshToken, inactivity),
  );

  publishSession(null);

  const cleanup = await Promise.allSettled([removal, clearOAuthTransaction()]);
  await revokePendingTokens();
  for (const result of cleanup) {
    if (result.status === "rejected") throw result.reason;
  }
  if (!inactivity) await finishBrowserLogout();
}

export function getAuthOperationVersion(): number {
  return sessionVersion;
}
