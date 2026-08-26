/**
 * Safe Google Maps diagnostics — never logs the full API key.
 */

function maskKey(key: string): string {
  if (key.length <= 8) {
    return `${key.slice(0, 2)}…(${key.length})`;
  }
  return `${key.slice(0, 4)}…${key.slice(-4)} (${key.length} chars)`;
}

export function getGoogleMapsApiKeyStatus(): {
  present: boolean;
  masked: string | null;
} {
  const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
  if (!key) {
    return { present: false, masked: null };
  }
  return { present: true, masked: maskKey(key) };
}

export function logGoogleMapsDiagnostics(context: string): void {
  const status = getGoogleMapsApiKeyStatus();
  if (!status.present) {
    console.warn(
      `[Maps:${context}] EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is missing. Google Maps tiles will not load in production builds.`,
    );
    return;
  }

  console.log(
    `[Maps:${context}] Google Maps API key present: ${status.masked}`,
  );
}

export function logMapLoadError(context: string, error: unknown): void {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown map error";
  console.warn(`[Maps:${context}] load failure: ${message}`);
}
