import * as SecureStore from "expo-secure-store";

const KEY = "instructor_hub.stripe.connect_attempt.v1";
export function readConnectAttempt(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY);
}
export function writeConnectAttempt(value: string): Promise<void> {
  return SecureStore.setItemAsync(KEY, value);
}
export function removeConnectAttempt(): Promise<void> {
  return SecureStore.deleteItemAsync(KEY);
}
