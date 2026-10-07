import { oauthCallbackMatches, oauthError } from "./oauth-config";
import {
  readOAuthTransaction,
  removeOAuthTransaction,
  writeOAuthTransaction,
} from "./oauth-storage";

export type OAuthTransaction = Readonly<{
  state: string;
  verifier: string;
  redirectUri: string;
  domain: string;
  clientId: string;
  createdAt: number;
}>;

let queue: Promise<unknown> = Promise.resolve();
function serialized<T>(action: () => Promise<T>): Promise<T> {
  const result = queue.then(action);
  queue = result.catch(() => undefined);
  return result;
}

function parseTransaction(raw: string | null): OAuthTransaction {
  const value: unknown = raw ? JSON.parse(raw) : null;
  if (
    typeof value !== "object" ||
    value === null ||
    !("state" in value) ||
    typeof value.state !== "string" ||
    !value.state ||
    !("verifier" in value) ||
    typeof value.verifier !== "string" ||
    !value.verifier ||
    !("redirectUri" in value) ||
    typeof value.redirectUri !== "string" ||
    !("domain" in value) ||
    typeof value.domain !== "string" ||
    !("clientId" in value) ||
    typeof value.clientId !== "string" ||
    !("createdAt" in value) ||
    typeof value.createdAt !== "number" ||
    !Number.isFinite(value.createdAt)
  )
    throw oauthError("OAuthStateError");
  return {
    state: value.state,
    verifier: value.verifier,
    redirectUri: value.redirectUri,
    domain: value.domain,
    clientId: value.clientId,
    createdAt: value.createdAt,
  };
}

export function saveOAuthTransaction(value: OAuthTransaction): Promise<void> {
  return serialized(() => writeOAuthTransaction(JSON.stringify(value)));
}

export function clearOAuthTransaction(): Promise<void> {
  return serialized(removeOAuthTransaction);
}

// A valid transaction is consumed before exchanging the single-use code.
export function consumeOAuthTransaction(
  callbackUrl: string,
  config: { domain: string; clientId: string },
): Promise<{ transaction: OAuthTransaction; code: string }> {
  return serialized(async () => {
    const transaction = parseTransaction(await readOAuthTransaction());
    const url = new URL(callbackUrl);
    const age = Date.now() - transaction.createdAt;
    if (
      !oauthCallbackMatches(callbackUrl, transaction.redirectUri) ||
      url.username ||
      url.password ||
      url.hash ||
      url.searchParams.getAll("state").length !== 1 ||
      url.searchParams.get("state") !== transaction.state ||
      transaction.domain !== config.domain ||
      transaction.clientId !== config.clientId ||
      age < 0 ||
      age > 10 * 60_000
    )
      throw oauthError("OAuthStateError");
    await removeOAuthTransaction();
    if (url.searchParams.has("error")) {
  const description = url.searchParams.get("error_description") ?? "";

  if (description.includes("ACCOUNT_ALREADY_EXISTS:")) {
    throw oauthError("OAuthAccountAlreadyExists");
  }

  throw oauthError(
    url.searchParams.get("error") === "access_denied"
      ? "OAuthCancelledError"
      : "OAuthProviderError",
  );
}
    const code = url.searchParams.get("code");
    if (!code || url.searchParams.getAll("code").length !== 1)
      throw oauthError("OAuthStateError");
    return { transaction, code };
  });
}
