import { Platform } from "react-native";

/**
 * Safe Google Maps diagnostics — never logs the full API key.
 */

function getPlatformMapsConfig(): {
  variable: string;
  key: string;
} {
  switch (Platform.OS) {
    case "android":
      return {
        variable: "EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY",
        key:
          process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY?.trim() ?? "",
      };
    case "ios":
      return {
        variable: "EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY",
        key:
          process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY?.trim() ?? "",
      };
    default:
      return {
        variable: "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY",
        key: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "",
      };
  }
}

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
  const { key } = getPlatformMapsConfig();

  if (!key) {
    return { present: false, masked: null };
  }

  return { present: true, masked: maskKey(key) };
}

export function logGoogleMapsDiagnostics(context: string): void {
  const { variable } = getPlatformMapsConfig();
  const status = getGoogleMapsApiKeyStatus();

  if (!status.present) {
    console.warn(
      `[Maps:${context}] ${variable} is missing from the JavaScript environment.`,
    );
    return;
  }

  console.log(
    `[Maps:${context}] ${variable} present: ${status.masked}`,
  );
}

export function logMapLoadError(context: string, error: unknown): void {
  let message = "Unknown map error";

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  }

  console.warn(`[Maps:${context}] load failure: ${message}`);
}