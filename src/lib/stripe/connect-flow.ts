import Constants, { ExecutionEnvironment } from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

import {
  getAuthOperationVersion,
  getCognitoAccessToken,
  getSessionSnapshot,
} from "@/lib/auth/session-manager";
import {
  completeInstructorStripeOAuth,
  startInstructorStripeOAuth,
} from "@/services/instructor-stripe";
import type { StripeConnectionStatusResponse } from "@/types/payment";
import {
  readConnectAttempt,
  removeConnectAttempt,
  writeConnectAttempt,
} from "./connect-storage";

export const NATIVE_STRIPE_RETURN_URL =
  "instructorhub://dashboard/account/payment";
export type StripeCallback = {
  schoolId?: string;
  state?: string;
  code?: string;
  error?: string;
};
export type StripeConnectResult = StripeConnectionStatusResponse | "cancelled";
type Attempt = {
  userId: string;
  schoolId: string;
  state: string;
  expiresAt: number;
};
let starting = false;
let completion:
  { key: string; promise: Promise<StripeConnectResult> } | undefined;

function invalidAttempt(): Error {
  return new Error(
    "This Stripe connection attempt is invalid or expired. Please connect again.",
  );
}

function parseAttempt(raw: string | null): Attempt {
  const value: unknown = raw ? JSON.parse(raw) : null;
  if (
    !value ||
    typeof value !== "object" ||
    !("userId" in value) ||
    typeof value.userId !== "string" ||
    !("schoolId" in value) ||
    typeof value.schoolId !== "string" ||
    !("state" in value) ||
    typeof value.state !== "string" ||
    !("expiresAt" in value) ||
    typeof value.expiresAt !== "number"
  ) {
    throw invalidAttempt();
  }
  return {
    userId: value.userId,
    schoolId: value.schoolId,
    state: value.state,
    expiresAt: value.expiresAt,
  };
}

function assertSession(userId: string, version: number): void {
  if (
    getSessionSnapshot()?.user.id !== userId ||
    getAuthOperationVersion() !== version
  ) {
    throw new Error(
      "Your session changed. Please start the Stripe connection again.",
    );
  }
}

async function finish(
  callback: StripeCallback,
  userId: string,
  version: number,
): Promise<StripeConnectResult> {
  if (
    !callback.state ||
    !callback.schoolId ||
    (!callback.code && !callback.error) ||
    (callback.code && callback.error)
  ) {
    throw invalidAttempt();
  }
  const attempt = parseAttempt(await readConnectAttempt());
  if (
    attempt.userId !== userId ||
    attempt.schoolId !== callback.schoolId ||
    attempt.state !== callback.state ||
    attempt.expiresAt <= Date.now()
  ) {
    throw invalidAttempt();
  }
  assertSession(userId, version);
  if (callback.error) {
    await removeConnectAttempt();
    return "cancelled";
  }
  if (
    !callback.code ||
    !/^ac_[A-Za-z0-9]+$/.test(callback.code) ||
    callback.code.length > 512
  ) {
    throw invalidAttempt();
  }
  const token = await getCognitoAccessToken();
  assertSession(userId, version);
  if (!token) throw new Error("Please sign in to connect Stripe."); 
  await removeConnectAttempt();
  const result = await completeInstructorStripeOAuth(
    attempt.schoolId,
    token,
    attempt.state,
    callback.code,
  );
  assertSession(userId, version);
  return result;
}

export function completeStripeConnect(
  callback: StripeCallback,
): Promise<StripeConnectResult> {
  const userId = getSessionSnapshot()?.user.id;
  if (!userId)
    return Promise.reject(new Error("Please sign in to connect Stripe."));
  const version = getAuthOperationVersion();
  const key = JSON.stringify([
    userId,
    version,
    callback.schoolId,
    callback.state,
    callback.code,
    callback.error,
  ]);
  if (completion?.key === key) return completion.promise;
  const promise = finish(callback, userId, version);
  completion = { key, promise };
  return promise;
}

export function parseStripeCallback(url: string): StripeCallback {
  const parsed = new URL(url);
  if (
    `${parsed.protocol}//${parsed.host}${parsed.pathname}` !==
    NATIVE_STRIPE_RETURN_URL
  ) {
    throw invalidAttempt();
  }
  const params = parsed.searchParams;
  for (const key of [
    "schoolId",
    "stripeOAuthState",
    "stripeOAuthCode",
    "stripeOAuthError",
  ]) {
    if (params.getAll(key).length > 1) throw invalidAttempt();
  }
  return {
    schoolId: params.get("schoolId") ?? undefined,
    state: params.get("stripeOAuthState") ?? undefined,
    code: params.get("stripeOAuthCode") ?? undefined,
    error: params.get("stripeOAuthError") ?? undefined,
  };
}

function validateStart(
  result: Awaited<ReturnType<typeof startInstructorStripeOAuth>>,
): void {
  const url = new URL(result.url);
  if (
    url.origin !== "https://connect.stripe.com" ||
    url.pathname !== "/oauth/authorize" ||
    !/^[a-f0-9]{64}$/.test(result.state) ||
    url.searchParams.get("state") !== result.state ||
    !Number.isFinite(result.expiresIn) ||
    result.expiresIn <= 0 ||
    result.expiresIn > 600
  ) {
    throw new Error("Stripe returned an invalid connection link.");
  }
  const target = new URL(result.returnUrl);
  const expected =
    Platform.OS === "web"
      ? `${window.location.origin}/dashboard/account/payment`
      : NATIVE_STRIPE_RETURN_URL;
  if (`${target.protocol}//${target.host}${target.pathname}` !== expected) {
    throw new Error(
      "Stripe return address is not configured for this app. Please contact support.",
    );
  }
}

export async function startStripeConnect(
  schoolId: string,
): Promise<StripeConnectResult | undefined> {
  if (starting) throw new Error("A Stripe connection is already in progress.");
  if (
    Platform.OS !== "web" &&
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  ) {
    throw new Error(
      "Stripe connection requires an installed app build. It is not available in Expo Go.",
    );
  }
  starting = true;
  completion = undefined;
  try {
    const userId = getSessionSnapshot()?.user.id;
    const version = getAuthOperationVersion();
    if (!userId) throw new Error("Please sign in to connect Stripe.");
    const token = await getCognitoAccessToken();
    assertSession(userId, version);
    if (!token) throw new Error("Please sign in to connect Stripe.");
    const result = await startInstructorStripeOAuth(
      schoolId,
      token,
      Platform.OS === "web" ? "web" : "native",
    );
    assertSession(userId, version);
    validateStart(result);
    await writeConnectAttempt(
      JSON.stringify({
        userId,
        schoolId,
        state: result.state,
        expiresAt: Date.now() + result.expiresIn * 1000,
      }),
    );
    assertSession(userId, version);
    if (Platform.OS === "web") {      
      window.location.assign(result.url);
      return undefined;
    }
    const response = await WebBrowser.openAuthSessionAsync(
      result.url,
      NATIVE_STRIPE_RETURN_URL,
    );
    if (response.type === "success") {
      return await completeStripeConnect(parseStripeCallback(response.url));
    }
    await removeConnectAttempt();
    return "cancelled";
  } finally {
    starting = false;
  }
}
