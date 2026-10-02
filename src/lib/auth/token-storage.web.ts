const REFRESH_TOKEN_KEY = "instructor_hub.cognito.refresh_token.v1";

export function readRefreshToken(): Promise<string | null> {
  return Promise.resolve().then(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return window.sessionStorage.getItem(REFRESH_TOKEN_KEY);
  });
}

export function writeRefreshToken(refreshToken: string): Promise<void> {
  return Promise.resolve().then(() => {
    if (!refreshToken.trim()) {
      throw new Error("Cannot store an empty Cognito refresh token");
    }

    if (typeof window === "undefined") {
      throw new TypeError("Cannot store a Cognito refresh token on the server");
    }

    window.sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  });
}

export function removeRefreshToken(): Promise<void> {
  return Promise.resolve().then(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  });
}
