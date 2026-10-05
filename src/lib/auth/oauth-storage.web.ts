const KEY = "instructor_hub.cognito.oauth_transaction.v1";

export function readOAuthTransaction(): Promise<string | null> {
  return Promise.resolve().then(() =>
    typeof window === "undefined" ? null : window.sessionStorage.getItem(KEY),
  );
}
export function writeOAuthTransaction(value: string): Promise<void> {
  return Promise.resolve().then(() => {
    if (typeof window === "undefined")
      throw new Error("OAuth requires a browser");
    window.sessionStorage.setItem(KEY, value);
  });
}
export function removeOAuthTransaction(): Promise<void> {
  return Promise.resolve().then(() => {
    if (typeof window !== "undefined") window.sessionStorage.removeItem(KEY);
  });
}
