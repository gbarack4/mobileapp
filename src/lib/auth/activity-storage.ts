import * as SecureStore from "expo-secure-store";

const LAST_ACTIVITY_KEY = "instructor_hub.auth.last_activity.v1";

export async function readLastActivityAt(): Promise<number | null> {
  const raw = await SecureStore.getItemAsync(LAST_ACTIVITY_KEY);

  if (!raw) {
    return null;
  }

  const value = Number(raw);

  return Number.isFinite(value) && value > 0 ? value : null;
}

export function writeLastActivityAt(value: number): Promise<void> {
  return SecureStore.setItemAsync(LAST_ACTIVITY_KEY, String(value));
}

export function removeLastActivityAt(): Promise<void> {
  return SecureStore.deleteItemAsync(LAST_ACTIVITY_KEY);
}
