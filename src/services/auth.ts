import type {
  ContinueWithIdentifierRequest,
  ContinueWithIdentifierResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginWithPasswordRequest,
  LoginWithPasswordResponse,
  OAuthContinueRequest,
  OAuthContinueResponse,
  RequestLoginVerificationRequest,
  RequestLoginVerificationResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  VerifyLoginCodeRequest,
  VerifyLoginCodeResponse,
} from "../types/auth";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export class AuthApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      typeof body?.message === "string"
        ? body.message
        : Array.isArray(body?.message)
          ? body.message.join(", ")
          : "Something went wrong. Please try again.";

    throw new AuthApiError(message, response.status);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export async function continueWithIdentifier(
  payload: ContinueWithIdentifierRequest,
): Promise<ContinueWithIdentifierResponse> {
  return request<ContinueWithIdentifierResponse>("/auth/continue", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginWithPassword(
  payload: LoginWithPasswordRequest,
): Promise<LoginWithPasswordResponse> {
  return request<LoginWithPasswordResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function requestLoginVerification(
  payload: RequestLoginVerificationRequest,
): Promise<RequestLoginVerificationResponse> {
  return request<RequestLoginVerificationResponse>(
    "/auth/login/verify-request",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function verifyLoginCode(
  payload: VerifyLoginCodeRequest,
): Promise<VerifyLoginCodeResponse> {
  return request<VerifyLoginCodeResponse>("/auth/login/verify", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function forgotPassword(
  payload: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> {
  return request<ForgotPasswordResponse>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resetPassword(
  payload: ResetPasswordRequest,
): Promise<ResetPasswordResponse> {
  return request<ResetPasswordResponse>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function continueWithOAuth(
  payload: OAuthContinueRequest,
): Promise<OAuthContinueResponse> {
  return request<OAuthContinueResponse>(`/auth/oauth/${payload.provider}`, {
    method: "POST",
    body: JSON.stringify({ idToken: payload.idToken }),
  });
}
