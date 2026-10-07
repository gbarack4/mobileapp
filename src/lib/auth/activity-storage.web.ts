const LAST_ACTIVITY_KEY = "instructor_hub.auth.last_activity.v1";

function readStoredValue(): number | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(LAST_ACTIVITY_KEY);

  if (!raw) {
    return null;
  }

  const value = Number(raw);

  return Number.isFinite(value) && value > 0 ? value : null;
}

export function readLastActivityAt(): Promise<number | null> {
  return Promise.resolve().then(readStoredValue);
}

export function writeLastActivityAt(value: number): Promise<void> {
  return Promise.resolve().then(() => {
    if (typeof window === "undefined") {
      throw new TypeError("Cannot store last activity on the server");
    }

    window.sessionStorage.setItem(LAST_ACTIVITY_KEY, String(value));
  });
}

export function removeLastActivityAt(): Promise<void> {
  return Promise.resolve().then(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.removeItem(LAST_ACTIVITY_KEY);
  });
}
