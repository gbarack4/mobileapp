import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

import { readCognitoPublicEnv } from "./public-env";

export type SocialProvider = "Google" | "SignInWithApple";

export const NATIVE_OAUTH_REDIRECT_URI = "instructorhub://sso-callback";
export const NATIVE_OAUTH_LOGOUT_URI = "instructorhub://login";

export function oauthError(name: string): Error {
  const error = new Error(name);
  error.name = name;
  return error;
}

function parseCognitoDomain(raw: string): string {
  const trimmed = raw.replace(/\/+$/, "");
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let domain: URL;

  try {
    domain = new URL(withProtocol);
  } catch {
    throw oauthError("OAuthConfigurationError");
  }

  if (
    domain.protocol !== "https:" ||
    domain.username ||
    domain.password ||
    domain.search ||
    domain.hash ||
    (domain.pathname !== "" && domain.pathname !== "/")
  ) {
    throw oauthError("OAuthConfigurationError");
  }

  return domain.origin;
}

export function getOAuthConfig() {
  const { domain: rawDomain, clientId } = readCognitoPublicEnv();

  if (!rawDomain || !clientId) {
    throw oauthError("OAuthConfigurationError");
  }

  return { domain: parseCognitoDomain(rawDomain), clientId };
}

export function getOAuthRedirectUri(): string {
  if (Platform.OS === "web") {
    if (typeof window === "undefined") {
      throw oauthError("OAuthConfigurationError");
    }

    return `${window.location.origin}/sso-callback`;
  }

  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    throw oauthError("OAuthExpoGoError");
  }

  return NATIVE_OAUTH_REDIRECT_URI;
}

export function oauthCallbackMatches(
  callbackUrl: string,
  redirectUri: string,
): boolean {
  try {
    const actual = new URL(callbackUrl);
    const expected = new URL(redirectUri);

    if (actual.protocol !== expected.protocol) {
      return false;
    }

    const actualRoute = `${actual.host}${actual.pathname}`
      .replace(/^\/+/, "")
      .replace(/\/+$/, "");
    const expectedRoute = `${expected.host}${expected.pathname}`
      .replace(/^\/+/, "")
      .replace(/\/+$/, "");

    return actualRoute === expectedRoute;
  } catch {
    return false;
  }
}
