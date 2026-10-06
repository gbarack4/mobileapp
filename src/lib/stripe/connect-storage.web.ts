const KEY = "instructor_hub.stripe.connect_attempt.v1";
export function readConnectAttempt(): Promise<string | null> {
  return Promise.resolve().then(() =>
    typeof window === "undefined" ? null : window.sessionStorage.getItem(KEY),
  );
}
export function writeConnectAttempt(value: string): Promise<void> {
  return Promise.resolve().then(() => {
    window.sessionStorage.setItem(KEY, value);
  });
}
export function removeConnectAttempt(): Promise<void> {
  return Promise.resolve().then(() => {
    if (typeof window !== "undefined") window.sessionStorage.removeItem(KEY);
  });
}
