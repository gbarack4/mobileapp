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

const EXPIRY_NOTICE_KEY = "instructor_hub.cognito.expiry_notice.v1";

export function readExpiryNotice(): Promise<string | null> {
  return SecureStore.getItemAsync(EXPIRY_NOTICE_KEY);
}

export function writeExpiryNotice(method: string | null): Promise<void> {
  return method
    ? SecureStore.setItemAsync(EXPIRY_NOTICE_KEY, method)
    : SecureStore.deleteItemAsync(EXPIRY_NOTICE_KEY);
}
