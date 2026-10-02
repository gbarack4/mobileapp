import { SuprSend } from "@suprsend/web-sdk";

const publicApiKey = process.env.EXPO_PUBLIC_SUPRSEND_PUBLIC_KEY;
const vapidKey = process.env.EXPO_PUBLIC_SUPRSEND_VAPID_PUBLIC_KEY;

let client: SuprSend | null = null;

export function getSuprSendClient(): SuprSend {
  if (typeof window === "undefined") {
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

// Serialize identity changes: a slow identify from a previous account must
// finish before its reset and before the next account is identified.
let identityQueue: Promise<unknown> = Promise.resolve();
function queueIdentity<T>(operation: () => Promise<T>): Promise<T> {
  const next = identityQueue.then(operation);
  identityQueue = next.catch(() => undefined);
  return next;
}
export function identifySuprSendUser(email: string): Promise<SuprSend> {
  return queueIdentity(async () => {
    const current = getSuprSendClient();
    await current.identify(email);
    return current;
  });
}
export function resetSuprSendUser(): Promise<void> {
  if (typeof window === "undefined" || !client) return Promise.resolve();
  return queueIdentity(async () => {
    await client?.reset();
  });
}
