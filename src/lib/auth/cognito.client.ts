export type AuthenticationResultType = {
  AccessToken?: string;
  IdToken?: string;
  RefreshToken?: string;
  ExpiresIn?: number;
};

export type PasswordAuthResponse = {
  AuthenticationResult?: AuthenticationResultType;
  ChallengeName?: string;
};

export type SignUpAuthResponse = {
  UserConfirmed?: boolean;
};

type CognitoErrorBody = {
  __type?: string;
  message?: string;
  Message?: string;
};

function getCognitoConfig() {
  const region = process.env.EXPO_PUBLIC_COGNITO_REGION?.trim();
  const clientId = process.env.EXPO_PUBLIC_COGNITO_INSTRUCTOR_CLIENT_ID?.trim();

  if (!region) {
    throw new Error("EXPO_PUBLIC_COGNITO_REGION is not configured");
  }

  if (!clientId) {
    throw new Error("EXPO_PUBLIC_COGNITO_INSTRUCTOR_CLIENT_ID is not configured");
  }

  return { region, clientId };
}

function cognitoErrorName(type: string | undefined): string {
  if (!type) {
    return "CognitoError";
  }

  return type.split("#").pop() || type;
}

async function cognitoSend<T>(target: string, body: object): Promise<T> {
  const { region } = getCognitoConfig();
  const response = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as CognitoErrorBody &
    T;

  if (!response.ok) {
    const error = new Error(
      payload.message || payload.Message || "Unable to complete the request.",
    );
    error.name = cognitoErrorName(payload.__type);
    throw error;
  }

  return payload;
}

export function signInWithPassword(email: string, password: string) {
  const { clientId } = getCognitoConfig();

  return cognitoSend<PasswordAuthResponse>("InitiateAuth", {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: clientId,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });
}

export function signUpWithPassword(email: string, password: string) {
  const { clientId } = getCognitoConfig();

  return cognitoSend<SignUpAuthResponse>("SignUp", {
    ClientId: clientId,
    Username: email,
    Password: password,
    UserAttributes: [
      {
        Name: "email",
        Value: email,
      },
    ],
  });
}

export function confirmSignUp(email: string, code: string) {
  const { clientId } = getCognitoConfig();

  return cognitoSend("ConfirmSignUp", {
    ClientId: clientId,
    Username: email,
    ConfirmationCode: code,
  });
}

export function resendSignUpCode(email: string) {
  const { clientId } = getCognitoConfig();

  return cognitoSend("ResendConfirmationCode", {
    ClientId: clientId,
    Username: email,
  });
}

export function requestPasswordReset(email: string) {
  const { clientId } = getCognitoConfig();

  return cognitoSend("ForgotPassword", {
    ClientId: clientId,
    Username: email,
  });
}

export function confirmPasswordReset(
  email: string,
  code: string,
  newPassword: string,
) {
  const { clientId } = getCognitoConfig();

  return cognitoSend("ConfirmForgotPassword", {
    ClientId: clientId,
    Username: email,
    ConfirmationCode: code,
    Password: newPassword,
  });
}

export async function refreshCognitoSession(refreshToken: string) {
  const { clientId } = getCognitoConfig();
  const response = await cognitoSend<PasswordAuthResponse>("InitiateAuth", {
    AuthFlow: "REFRESH_TOKEN_AUTH",
    ClientId: clientId,
    AuthParameters: {
      REFRESH_TOKEN: refreshToken,
    },
  });

  const result = response.AuthenticationResult;

  if (!result?.AccessToken || !result.IdToken || !result.ExpiresIn) {
    throw new Error("Cognito did not return a complete refreshed session");
  }

  return {
    accessToken: result.AccessToken,
    idToken: result.IdToken,
    expiresIn: result.ExpiresIn,
  };
}

export async function revokeCognitoRefreshToken(
  refreshToken: string,
): Promise<void> {
  const { clientId } = getCognitoConfig();

  await cognitoSend("RevokeToken", {
    ClientId: clientId,
    Token: refreshToken,
  });
}
