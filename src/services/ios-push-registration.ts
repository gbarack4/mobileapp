import { Platform } from "react-native";
import { registerPushDevice, unregisterPushDevice } from "./push-devices";

type Registration = Readonly<{
  userId: string;
  deviceToken: string;
  registrationId: string;
}>;

export type PushSession = Readonly<{
  userId: string;
  accessToken: string;
  isCurrent: () => boolean;
}>;

const STORAGE_KEY = "instructor-hub.push-registration.v1";
let queue: Promise<unknown> = Promise.resolve();
let confirmedInThisRun: Registration | null = null;

function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const pending = queue.then(operation);
  queue = pending.catch(() => undefined);
  return pending;
}

async function readRegistration(): Promise<Registration | null> {
  const storage = await import("expo-secure-store");
  const raw = await storage.getItemAsync(STORAGE_KEY);
  if (!raw) return null;
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object" ||
      !("userId" in value) || typeof value.userId !== "string" ||
      !("deviceToken" in value) || typeof value.deviceToken !== "string" ||
      !("registrationId" in value) || typeof value.registrationId !== "string") {
    throw new Error("Invalid stored push registration.");
  }
  return { userId: value.userId, deviceToken: value.deviceToken, registrationId: value.registrationId };
}

async function saveRegistration(value: Registration): Promise<void> {
  const storage = await import("expo-secure-store");
  await storage.setItemAsync(STORAGE_KEY, JSON.stringify(value));
}

async function clearRegistration(): Promise<void> {
  const storage = await import("expo-secure-store");
  await storage.deleteItemAsync(STORAGE_KEY);
}

export function registerIosPushToken(context: PushSession, deviceToken: string): Promise<void> {
  if (Platform.OS !== "ios") return Promise.resolve();
  return serialize(async () => {
    if (!context.isCurrent()) return;
    if (confirmedInThisRun?.userId === context.userId &&
        confirmedInThisRun.deviceToken === deviceToken) return;

    const previous = await readRegistration();
    if (!context.isCurrent()) return;
    if (previous?.userId === context.userId && previous.deviceToken !== deviceToken) {
      await unregisterPushDevice(context.accessToken, previous.registrationId);
      confirmedInThisRun = null;
      await clearRegistration();
    }
    if (!context.isCurrent()) return;

    const registrationId = await registerPushDevice(context.accessToken, deviceToken);
    const registration = { userId: context.userId, deviceToken, registrationId };
    try {
      await saveRegistration(registration);
    } catch (error: unknown) {      
      await unregisterPushDevice(context.accessToken, registrationId);
      throw error;
    }
    if (!context.isCurrent()) {
      await unregisterPushDevice(context.accessToken, registrationId);
      await clearRegistration();
      return;
    }
    confirmedInThisRun = registration;
  });
}

export function unregisterIosPushSession(userId: string, accessToken: string): Promise<void> {
  if (Platform.OS !== "ios") return Promise.resolve();
  confirmedInThisRun = null;
  return serialize(async () => {
    const saved = await readRegistration();
    if (saved?.userId !== userId) return;
    await unregisterPushDevice(accessToken, saved.registrationId);
    await clearRegistration();
  });
}
