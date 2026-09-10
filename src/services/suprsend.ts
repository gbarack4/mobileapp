import { SuprSend } from "@suprsend/web-sdk";
import { Platform } from "react-native";

const publicApiKey = process.env.EXPO_PUBLIC_SUPRSEND_PUBLIC_KEY;
const vapidKey = process.env.EXPO_PUBLIC_SUPRSEND_VAPID_PUBLIC_KEY;

let client: SuprSend | null = null;

export function getSuprSendClient(): SuprSend {
  if (Platform.OS !== "web") {
    throw new TypeError("SuprSend is only available on web.");
  }

  if (!publicApiKey) {
    throw new Error("Missing EXPO_PUBLIC_SUPRSEND_PUBLIC_KEY.");
  }

  if (!vapidKey) {
    throw new Error("Missing EXPO_PUBLIC_SUPRSEND_VAPID_PUBLIC_KEY.");
  }

  if (!client) {
    client = new SuprSend(publicApiKey, {
      vapidKey,
      swFileName: "serviceworker.js",
    });
  }

  return client;
}
