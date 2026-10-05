import {
  AuthRequest,
  CodeChallengeMethod,
  ResponseType,
} from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

import { exchangeOAuthCode } from "./oauth-client";
import {
  getOAuthConfig,
  getOAuthRedirectUri,
  oauthError,
  type SocialProvider,
} from "./oauth-config";
import {
  clearOAuthTransaction,
  consumeOAuthTransaction,
  saveOAuthTransaction,
} from "./oauth-transaction";
import { getAuthOperationVersion, setCognitoSession } from "./session-manager";

let starting = false;
let activeVersion: number | undefined;
let completion: { url: string; promise: Promise<void> } | undefined;

async function finish(
  callbackUrl: string,
  expectedVersion: number,
): Promise<void> {
  const { transaction, code } = await consumeOAuthTransaction(
    callbackUrl,
    getOAuthConfig(),
  );
  if (expectedVersion !== getAuthOperationVersion())
    throw oauthError("OAuthStateError");
  const tokens = await exchangeOAuthCode(
    code,
    transaction.verifier,
    transaction.redirectUri,
  );
  if (!tokens.refreshToken) throw oauthError("OAuthResponseError");
  if (expectedVersion !== getAuthOperationVersion())
    throw oauthError("OAuthStateError");
  const session = await setCognitoSession(
    {
      AccessToken: tokens.accessToken,
      IdToken: tokens.idToken,
      RefreshToken: tokens.refreshToken,
      ExpiresIn: tokens.expiresIn,
    },
    undefined,
    expectedVersion,
    "oauth",
  );
  if (!session) throw oauthError("OAuthStateError");
}

export function completeSocialSignIn(callbackUrl: string): Promise<void> {
  if (completion?.url === callbackUrl) return completion.promise;
  if (completion) return Promise.reject(oauthError("OAuthStateError"));
  const promise = finish(
    callbackUrl,
    activeVersion ?? getAuthOperationVersion(),
  );
  completion = { url: callbackUrl, promise };
  return promise;
}

export async function startSocialSignIn(
  provider: SocialProvider,
  expectedVersion: number,
): Promise<void> {
  if (starting) return;
  starting = true;
  completion = undefined;
  activeVersion = expectedVersion;
  try {
    const config = getOAuthConfig();
    const redirectUri = getOAuthRedirectUri();
    const request = new AuthRequest({
      clientId: config.clientId,
      redirectUri,
      responseType: ResponseType.Code,
      scopes: ["openid", "email", "profile"],
      usePKCE: true,
      codeChallengeMethod: CodeChallengeMethod.S256,
      extraParams: { identity_provider: provider },
    });
    const url = await request.makeAuthUrlAsync({
      authorizationEndpoint: `${config.domain}/oauth2/authorize`,
    });
    if (
      !request.codeVerifier ||
      expectedVersion !== getAuthOperationVersion()
    ) {
      throw oauthError("OAuthStateError");
    }
    await saveOAuthTransaction({
      state: request.state,
      verifier: request.codeVerifier,
      redirectUri,
      ...config,
      createdAt: Date.now(),
    });
    if (expectedVersion !== getAuthOperationVersion()) {
      await clearOAuthTransaction();
      throw oauthError("OAuthStateError");
    }
    if (Platform.OS === "web") {     
      window.location.assign(url);
      return;
    }
    const result = await WebBrowser.openAuthSessionAsync(url, redirectUri);
    if (result.type === "success") {
      await completeSocialSignIn(result.url);
    } else {
      await clearOAuthTransaction();      
    }
  } finally {
    starting = false;
  }
}
