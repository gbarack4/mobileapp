import {
  readLastActivityAt,
  removeLastActivityAt,
  writeLastActivityAt,
} from "./activity-storage";

export const INACTIVITY_TIMEOUT_MS = 36_000_000;
const ACTIVITY_PERSIST_THROTTLE_MS = 15_000;

let lastActivityAt: number | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

export function getLastActivityAt(): number | null {
  return lastActivityAt;
}

export function hasInactivityExpired(now = Date.now()): boolean {
  if (lastActivityAt == null) {
    return false;
  }

  return now - lastActivityAt >= INACTIVITY_TIMEOUT_MS;
}

export function remainingInactivityMs(now = Date.now()): number {
  if (lastActivityAt == null) {
    return INACTIVITY_TIMEOUT_MS;
  }

  return Math.max(0, lastActivityAt + INACTIVITY_TIMEOUT_MS - now);
}

export async function hydrateLastActivity(): Promise<number | null> {
  if (lastActivityAt != null) {
    return lastActivityAt;
  }

  const stored = await readLastActivityAt();

  lastActivityAt = stored;
  return stored;
}

export async function syncLastActivityFromStorage(): Promise<number | null> {
  const stored = await readLastActivityAt();

  if (stored != null && (lastActivityAt == null || stored > lastActivityAt)) {
    lastActivityAt = stored;
  }

  return lastActivityAt;
}

export async function recordUserActivity(now = Date.now()): Promise<void> {
  lastActivityAt = now;
  clearPersistTimer();
  await writeLastActivityAt(now);
}

export function noteUserActivity(now = Date.now()): void {
  lastActivityAt = now;

  if (persistTimer) {
    return;
  }

  persistTimer = setTimeout(() => {
    persistTimer = null;
    const timestamp = lastActivityAt;

    if (timestamp != null) {
      void writeLastActivityAt(timestamp);
    }
  }, ACTIVITY_PERSIST_THROTTLE_MS);
}

export async function flushLastActivity(): Promise<void> {
  clearPersistTimer();

  if (lastActivityAt == null) {
    return;
  }

  await writeLastActivityAt(lastActivityAt);
}

export async function clearLastActivity(): Promise<void> {
  lastActivityAt = null;
  clearPersistTimer();
  await removeLastActivityAt();
}

function clearPersistTimer() {
  if (!persistTimer) {
    return;
  }

  clearTimeout(persistTimer);
  persistTimer = null;
}
