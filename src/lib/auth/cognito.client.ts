import {
  confirmResetPassword as amplifyConfirmResetPassword,
  confirmSignUp as amplifyConfirmSignUp,
  fetchAuthSession,
  resendSignUpCode as amplifyResendSignUpCode,
  resetPassword as amplifyResetPassword,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  signUp as amplifySignUp,
} from "aws-amplify/auth";

import { ensureAmplifyConfigured } from "./amplify";

export type CognitoAuthenticationResult = {
  AccessToken: string;
  IdToken: string;
  RefreshToken?: string;
  ExpiresIn: number;
};

export type PasswordAuthResponse = {
  AuthenticationResult?: CognitoAuthenticationResult;
  ChallengeName?: string;
};

export type SignUpAuthResponse = {
  UserConfirmed?: boolean;
};

const AMPLIFY_ERROR_NAMES: Record<string, string> = {
  UsernameExistsError: "UsernameExistsException",
  CodeMismatchError: "CodeMismatchException",
  ExpiredCodeError: "ExpiredCodeException",
  InvalidPasswordError: "InvalidPasswordException",
  UserNotConfirmedError: "UserNotConfirmedException",
  NotAuthorizedError: "NotAuthorizedException",
  UserNotFoundError: "UserNotFoundException",
  LimitExceededError: "LimitExceededException",
  TooManyRequestsError: "TooManyRequestsException",
  PasswordResetRequiredError: "PasswordResetRequiredException",
};

function namedError(name: string, message: string) {
  const error = new Error(message);
  error.name = name;
  return error;
}

function rawErrorName(error: unknown): string {
  if (!(error instanceof Error)) {
    return "";
  }

  const extra = error as Error & {
    underlyingError?: { name?: string };
    underlyingException?: { name?: string };
    cause?: { name?: string };
  };

  return (
    extra.underlyingException?.name ||
    extra.underlyingError?.name ||
    extra.cause?.name ||
    extra.name
  );
}

function toAuthError(error: unknown): Error {
  if (!(error instanceof Error)) {
    return new Error("Unable to complete the request.");
  }

  const mapped = AMPLIFY_ERROR_NAMES[rawErrorName(error)] ?? rawErrorName(error);

  if (mapped && error.name !== mapped) {
    error.name = mapped;
  }

  return error;
}

function expiresInFromToken(exp: unknown) {
  if (typeof exp !== "number" || !Number.isFinite(exp)) {
    return 3600;
  }

  return Math.max(1, exp - Math.floor(Date.now() / 1000));
}

export async function getAuthenticationResult(
  forceRefresh = false,
): Promise<CognitoAuthenticationResult | null> {
  ensureAmplifyConfigured();

  const session = await fetchAuthSession({ forceRefresh });
  const accessToken = session.tokens?.accessToken;
  const idToken = session.tokens?.idToken;

  if (!accessToken || !idToken) {
    return null;
  }

  return {
    AccessToken: accessToken.toString(),
    IdToken: idToken.toString(),
    ExpiresIn: expiresInFromToken(accessToken.payload.exp),
  };
}

export async function signInWithPassword(email: string, password: string) {
  ensureAmplifyConfigured();

  try {
    const output = await amplifySignIn({
      username: email,
      password,
    });

    if (output.nextStep.signInStep === "CONFIRM_SIGN_UP") {
      throw namedError(
        "UserNotConfirmedException",
        "Verify your email before signing in.",
      );
    }

    if (output.nextStep.signInStep === "RESET_PASSWORD") {
      throw namedError(
        "PasswordResetRequiredException",
        "Please reset your password before signing in.",
      );
    }

    if (!output.isSignedIn && output.nextStep.signInStep !== "DONE") {
      throw namedError(
        "UnsupportedAuthChallenge",
        "Additional authentication is required",
      );
    }

    const result = await getAuthenticationResult();

    if (!result) {
      throw new Error("Cognito did not return a complete session");
    }

    const response: PasswordAuthResponse = {
      AuthenticationResult: result,
    };

    return response;
  } catch (error: unknown) {
    if (rawErrorName(error) === "UserAlreadyAuthenticatedException") {
      const result = await getAuthenticationResult();

      if (result) {
        return { AuthenticationResult: result };
      }
    }

    throw toAuthError(error);
  }
}

export async function signUpWithPassword(email: string, password: string) {
  ensureAmplifyConfigured();

  try {
    const output = await amplifySignUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
        },
      },
    });

    const response: SignUpAuthResponse = {
      UserConfirmed: output.isSignUpComplete,
    };

    return response;
  } catch (error: unknown) {
    throw toAuthError(error);
  }
}

export async function confirmSignUp(email: string, code: string) {
  ensureAmplifyConfigured();

  try {
    await amplifyConfirmSignUp({
      username: email,
      confirmationCode: code,
    });
  } catch (error: unknown) {
    throw toAuthError(error);
  }
}

export async function resendSignUpCode(email: string) {
  ensureAmplifyConfigured();

  try {
    await amplifyResendSignUpCode({
      username: email,
    });
  } catch (error: unknown) {
    throw toAuthError(error);
  }
}

export async function requestPasswordReset(email: string) {
  ensureAmplifyConfigured();

  try {
    await amplifyResetPassword({
      username: email,
    });
  } catch (error: unknown) {
    throw toAuthError(error);
  }
}

export async function confirmPasswordReset(
  email: string,
  code: string,
  newPassword: string,
) {
  ensureAmplifyConfigured();

  try {
    await amplifyConfirmResetPassword({
      username: email,
      confirmationCode: code,
      newPassword,
    });
  } catch (error: unknown) {
    throw toAuthError(error);
  }
}

export async function signOutAmplifySession() {
  ensureAmplifyConfigured();

  try {
    await amplifySignOut();
  } catch (error: unknown) {
    throw toAuthError(error);
  }
}
