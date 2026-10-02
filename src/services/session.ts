import { getSessionSnapshot } from "../lib/auth/session-manager";

export function getSessionEmail(): string | null {
  return getSessionSnapshot()?.user.email ?? null;
}

export function getUserStorageKey(key: string): string {
  return `${key}:${getSessionSnapshot()?.user.id ?? "signed-out"}`;
}

export function clearLegacySession(): void {
  if (typeof window === "undefined") return;
  for (const key of [
    "ih_access_token",
    "ih_refresh_token",
    "ih_session_email",
  ]) {
    window.localStorage.removeItem(key);
  }
}
