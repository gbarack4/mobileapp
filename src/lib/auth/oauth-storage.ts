import * as SecureStore from "expo-secure-store";

const KEY = "instructor_hub.cognito.oauth_transaction.v1";
export function readOAuthTransaction(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY);
}
export function writeOAuthTransaction(value: string): Promise<void> {
  return SecureStore.setItemAsync(KEY, value);
}
export function removeOAuthTransaction(): Promise<void> {
  return SecureStore.deleteItemAsync(KEY);
}
