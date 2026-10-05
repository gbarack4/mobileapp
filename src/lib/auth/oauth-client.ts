import { getOAuthConfig, oauthError } from "./oauth-config";

type OAuthTokens = Readonly<{
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresIn: number;
}>;

function parseTokens(value: unknown): OAuthTokens {
  if (
    typeof value !== "object" ||
    value === null ||
    !("access_token" in value) ||
    typeof value.access_token !== "string" ||
    !value.access_token ||
    !("id_token" in value) ||
    typeof value.id_token !== "string" ||
    !value.id_token ||
    !("expires_in" in value) ||
    typeof value.expires_in !== "number" ||
    !Number.isFinite(value.expires_in) ||
    value.expires_in <= 0
  )
    throw oauthError("OAuthResponseError");
  const refreshToken =
    "refresh_token" in value ? value.refresh_token : undefined;
  if (
    refreshToken !== undefined &&
    (typeof refreshToken !== "string" || !refreshToken)
  ) {
    throw oauthError("OAuthResponseError");
  }
  return {
    accessToken: value.access_token,
    idToken: value.id_token,
    expiresIn: value.expires_in,
    refreshToken,
  };
}

async function requestTokens(
  parameters: Record<string, string>,
): Promise<OAuthTokens> {
  const { domain, clientId } = getOAuthConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(`${domain}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        ...parameters,
        client_id: clientId,
      }).toString(),
      signal: controller.signal,
    });
    const body: unknown = await response.json();
    if (!response.ok) {
      const invalidGrant =
        typeof body === "object" &&
        body !== null &&
        "error" in body &&
        body.error === "invalid_grant";
      throw oauthError(invalidGrant ? "OAuthInvalidGrant" : "OAuthTokenError");
    }
    return parseTokens(body);
  } finally {
    clearTimeout(timeout);
  }
}

export function exchangeOAuthCode(
  code: string,
  verifier: string,
  redirectUri: string,
) {
  return requestTokens({
    grant_type: "authorization_code",
    code,
    code_verifier: verifier,
    redirect_uri: redirectUri,
  });
}

// Federated sessions must refresh through Cognito's OAuth endpoint.
export function refreshOAuthSession(refreshToken: string) {
  return requestTokens({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}
