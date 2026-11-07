/**
 * Safe Google Maps diagnostics — never logs the full API key or URLs that may contain it.
 */

import Constants from "expo-constants";
import { Platform } from "react-native";

const ANDROID_PACKAGE = "pro.driveinstructor.instructorhub";

function shouldLogMapsDiagnostics(): boolean {
  return (
    __DEV__ || process.env.EXPO_PUBLIC_ENABLE_DEBUG_INGEST === "true"
  );
}

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
        key: process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY?.trim() ?? "",
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

function sanitizeMapErrorMessage(message: string): string {
  return message
    .replace(/key=[^&\s]+/gi, "key=[redacted]")
    .replace(/AIza[0-9A-Za-z_-]{10,}/g, "[redacted-key]")
    .slice(0, 240);
}

export function getGoogleMapsApiKeyStatus(): {
  present: boolean;
  length: number;
  masked: string | null;
  variable: string;
} {
  const { key, variable } = getPlatformMapsConfig();

  if (!key) {
    return { present: false, length: 0, masked: null, variable };
  }

  return {
    present: true,
    length: key.length,
    masked: maskKey(key),
    variable,
  };
}

function getAppIdentifier(): string {
  if (Platform.OS === "android") {
    return Constants.expoConfig?.android?.package ?? ANDROID_PACKAGE;
  }
  if (Platform.OS === "ios") {
    return Constants.expoConfig?.ios?.bundleIdentifier ?? "unknown";
  }
  return "web";
}

function getMapProviderLabel(): "google" | "apple" | "web" | "unknown" {
  if (Platform.OS === "android") {
    return "google";
  }
  if (Platform.OS === "ios") {
    return "apple";
  }
  if (Platform.OS === "web") {
    return "web";
  }
  return "unknown";
}

export function logGoogleMapsDiagnostics(context: string): void {
  if (!shouldLogMapsDiagnostics()) {
    return;
  }

  const status = getGoogleMapsApiKeyStatus();
  const hasKeyFromExtra = Boolean(
    Constants.expoConfig?.extra?.hasGoogleMapsApiKey,
  );
  const packageName = getAppIdentifier();

  if (!status.present) {
    console.warn(
      `[Maps:${context}] ${status.variable} is missing. Google Maps tiles will not load in production builds. platform=${Platform.OS} provider=${getMapProviderLabel()} package=${packageName} extra.hasGoogleMapsApiKey=${hasKeyFromExtra}`,
    );
    return;
  }

  console.log(
    `[Maps:${context}] ${status.variable} keyPresent=true keyLength=${status.length} masked=${status.masked} platform=${Platform.OS} provider=${getMapProviderLabel()} package=${packageName} extra.hasGoogleMapsApiKey=${hasKeyFromExtra}`,
  );
}

export function logMapLifecycle(
  context: string,
  event: "onMapReady" | "onMapLoaded",
): void {
  if (!shouldLogMapsDiagnostics()) {
    return;
  }

  console.log(
    `[Maps:${context}] ${event} platform=${Platform.OS} provider=${getMapProviderLabel()}`,
  );
}

export function logMapLoadError(context: string, error: unknown): void {
  if (!shouldLogMapsDiagnostics()) {
    return;
  }

  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown map error";

  console.warn(
    `[Maps:${context}] load failure: ${sanitizeMapErrorMessage(raw)} platform=${Platform.OS} provider=${getMapProviderLabel()}`,
  );
}
