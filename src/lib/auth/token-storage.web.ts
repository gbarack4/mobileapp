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

const EXPIRY_NOTICE_KEY = "instructor_hub.cognito.expiry_notice.v1";

export function readExpiryNotice(): Promise<string | null> {
  return Promise.resolve().then(() =>
    typeof window === "undefined"
      ? null
      : window.sessionStorage.getItem(EXPIRY_NOTICE_KEY),
  );
}

export function writeExpiryNotice(method: string | null): Promise<void> {
  return Promise.resolve().then(() => {
    if (typeof window === "undefined") return;
    if (method) window.sessionStorage.setItem(EXPIRY_NOTICE_KEY, method);
    else window.sessionStorage.removeItem(EXPIRY_NOTICE_KEY);
  });
}
