import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'ih_access_token';
const REFRESH_TOKEN_KEY = 'ih_refresh_token';
const SESSION_EMAIL_KEY = 'ih_session_email';

type MemoryStore = {
  accessToken: string | null;
  refreshToken: string | null;
  email: string | null;
};

const memoryStore: MemoryStore = {
  accessToken: null,
  refreshToken: null,
  email: null,
};

function canUseLocalStorage() {
  return Platform.OS === 'web' && typeof localStorage !== 'undefined';
}

function read(key: string): string | null {
  if (canUseLocalStorage()) {
    return localStorage.getItem(key);
  }

  if (key === ACCESS_TOKEN_KEY) return memoryStore.accessToken;
  if (key === REFRESH_TOKEN_KEY) return memoryStore.refreshToken;
  if (key === SESSION_EMAIL_KEY) return memoryStore.email;
  return null;
}

function write(key: string, value: string | null) {
  if (canUseLocalStorage()) {
    if (value == null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
    return;
  }

  if (key === ACCESS_TOKEN_KEY) memoryStore.accessToken = value;
  if (key === REFRESH_TOKEN_KEY) memoryStore.refreshToken = value;
  if (key === SESSION_EMAIL_KEY) memoryStore.email = value;
}

export function getAccessToken() {
  return read(ACCESS_TOKEN_KEY);
}

export function getSessionEmail() {
  return read(SESSION_EMAIL_KEY);
}

export function setSessionTokens(tokens: {
  accessToken?: string | null;
  refreshToken?: string | null;
}) {
  if (tokens.accessToken !== undefined) {
    write(ACCESS_TOKEN_KEY, tokens.accessToken ?? null);
  }
  if (tokens.refreshToken !== undefined) {
    write(REFRESH_TOKEN_KEY, tokens.refreshToken ?? null);
  }
}

export function setSessionEmail(email: string | null) {
  const normalized = email?.trim().toLowerCase() || null;
  write(SESSION_EMAIL_KEY, normalized);
}

export function clearSession() {
  write(ACCESS_TOKEN_KEY, null);
  write(REFRESH_TOKEN_KEY, null);
  write(SESSION_EMAIL_KEY, null);
}
