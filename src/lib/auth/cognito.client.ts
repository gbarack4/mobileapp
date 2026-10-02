import {
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
  RevokeTokenCommand,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const region = process.env.EXPO_PUBLIC_COGNITO_REGION;
const clientId = process.env.EXPO_PUBLIC_COGNITO_INSTRUCTOR_CLIENT_ID;

if (!region) {
  throw new Error("EXPO_PUBLIC_COGNITO_REGION is not configured");
}

if (!clientId) {
  throw new Error("EXPO_PUBLIC_COGNITO_INSTRUCTOR_CLIENT_ID is not configured");
}

const cognitoClient = new CognitoIdentityProviderClient({
  region,
});

export function signInWithPassword(email: string, password: string) {
  return cognitoClient.send(
    new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: clientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    }),
  );
}

export function signUpWithPassword(email: string, password: string) {
  return cognitoClient.send(
    new SignUpCommand({
      ClientId: clientId,
      Username: email,
      Password: password,
      UserAttributes: [
        {
          Name: "email",
          Value: email,
        },
      ],
    }),
  );
}

export function confirmSignUp(email: string, code: string) {
  return cognitoClient.send(
    new ConfirmSignUpCommand({
      ClientId: clientId,
      Username: email,
      ConfirmationCode: code,
    }),
  );
}

export function resendSignUpCode(email: string) {
  return cognitoClient.send(
    new ResendConfirmationCodeCommand({
      ClientId: clientId,
      Username: email,
    }),
  );
}

export function requestPasswordReset(email: string) {
  return cognitoClient.send(
    new ForgotPasswordCommand({
      ClientId: clientId,
      Username: email,
    }),
  );
}

export function confirmPasswordReset(
  email: string,
  code: string,
  newPassword: string,
) {
  return cognitoClient.send(
    new ConfirmForgotPasswordCommand({
      ClientId: clientId,
      Username: email,
      ConfirmationCode: code,
      Password: newPassword,
    }),
  );
}

export async function refreshCognitoSession(refreshToken: string) {
  const response = await cognitoClient.send(
    new InitiateAuthCommand({
      AuthFlow: "REFRESH_TOKEN_AUTH",
      ClientId: clientId,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    }),
  );

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
  await cognitoClient.send(
    new RevokeTokenCommand({
      ClientId: clientId,
      Token: refreshToken,
    }),
  );
}
