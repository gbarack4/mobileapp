import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

export type SocialProvider = "Google" | "SignInWithApple";

export function oauthError(name: string): Error {
  const error = new Error(name);
  error.name = name;
  return error;
}

export function getOAuthConfig() {
  const rawDomain = process.env.EXPO_PUBLIC_COGNITO_DOMAIN?.trim();
  const clientId = process.env.EXPO_PUBLIC_COGNITO_INSTRUCTOR_CLIENT_ID?.trim();
  if (!rawDomain || !clientId) throw oauthError("OAuthConfigurationError");
  let domain: URL;
  try {
    domain = new URL(rawDomain);
  } catch {
    throw oauthError("OAuthConfigurationError");
  }
  if (
    domain.protocol !== "https:" ||
    domain.username ||
    domain.password ||
    domain.search ||
    domain.hash ||
    domain.pathname !== "/"
  )
    throw oauthError("OAuthConfigurationError");
  return { domain: domain.origin, clientId };
}

export function getOAuthRedirectUri(): string {
  if (Platform.OS === "web") {
    if (typeof window === "undefined")
      throw oauthError("OAuthConfigurationError");
    return `${window.location.origin}/sso-callback`;
  }
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient)
  throw oauthError("OAuthExpoGoError");
  return "instructorhub://sso-callback";
}
