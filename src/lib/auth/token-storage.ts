import * as SecureStore from "expo-secure-store";

const REFRESH_TOKEN_KEY = "instructor_hub.cognito.refresh_token.v1";

export function readRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export function writeRefreshToken(refreshToken: string): Promise<void> {
  if (!refreshToken.trim()) {
    return Promise.reject(
      new Error("Cannot store an empty Cognito refresh token"),
    );
  }

  return SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export function removeRefreshToken(): Promise<void> {
  return SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
