export type RequestLoginVerificationRequest = {
  identifier: string;
  password: string;
};

export type RequestLoginVerificationResponse = {
  message?: string;
};

export type VerifyLoginCodeRequest = {
  identifier: string;
  password: string;
  code: string;
};

export type VerifyLoginCodeResponse = {
  accessToken?: string;
  refreshToken?: string;
};

export type ForgotPasswordRequest = {
  identifier: string;
};

export type ForgotPasswordResponse = {
  message?: string;
};

export type ResetPasswordRequest = {
  identifier: string;
  code: string;
  newPassword: string;
};

export type ResetPasswordResponse = {
  message?: string;
};

export type LoginWithPasswordRequest = {
  identifier: string;
  password: string;
};

export type LoginWithPasswordResponse = {
  accessToken?: string;
  refreshToken?: string;
};

export type ContinueWithIdentifierRequest = {
  identifier: string;
};

export type ContinueWithIdentifierResponse = {
  sessionId?: string;
  message?: string;
};

export type OAuthContinueRequest = {
  provider: 'apple' | 'google';
  idToken: string;
};

export type OAuthContinueResponse = {
  accessToken?: string;
  refreshToken?: string;
};
