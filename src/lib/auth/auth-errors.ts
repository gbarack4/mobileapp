export function authErrorName(error: unknown): string {
  if (!(error instanceof Error)) {
    return "";
  }

  const extra = error as Error & {
    underlyingError?: { name?: string };
    underlyingException?: { name?: string };
    cause?: { name?: string };
  };

  const raw =
    extra.underlyingException?.name ||
    extra.underlyingError?.name ||
    extra.cause?.name ||
    extra.name;

  switch (raw) {
    case "UsernameExistsError":
      return "UsernameExistsException";
    case "CodeMismatchError":
      return "CodeMismatchException";
    case "ExpiredCodeError":
      return "ExpiredCodeException";
    case "InvalidPasswordError":
      return "InvalidPasswordException";
    case "UserNotConfirmedError":
      return "UserNotConfirmedException";
    case "NotAuthorizedError":
      return "NotAuthorizedException";
    case "UserNotFoundError":
      return "UserNotFoundException";
    case "LimitExceededError":
      return "LimitExceededException";
    case "TooManyRequestsError":
      return "TooManyRequestsException";
    case "PasswordResetRequiredError":
      return "PasswordResetRequiredException";
    default:
      return raw;
  }
}
export function authErrorMessage(error: unknown): string {
  switch (authErrorName(error)) {
    case "UserLambdaValidationException":
    if (
    error instanceof Error &&
    error.message.includes("ACCOUNT_ALREADY_EXISTS:")
    ) {
    return "An account with this email already exists. Please sign in using the method you used to register.";
    }    
    return "Registration could not be completed. Please try again or contact support.";
    case "OAuthAccountAlreadyExists":
  return "An account with this email already exists. Please sign in using the method you used to register.";
    case "OAuthConfigurationError":
      return "Social sign-in is not configured. Please contact support.";
    case "OAuthExpoGoError":
      return "Social sign-in requires an installed app build. It is not available in Expo Go.";
    case "OAuthCancelledError":
      return "Sign-in was cancelled. You can try again.";
    case "OAuthStateError":
    case "OAuthInvalidGrant":
      return "This sign-in attempt has expired or was already used. Please start again.";
    case "OAuthProviderError":
    case "OAuthTokenError":
    case "OAuthResponseError":
      return "Unable to complete social sign-in. Please try again or contact support.";
    case "NotAuthorizedException":
    case "UserNotFoundException":
      return "Incorrect email or password.";
    case "UsernameExistsException":
      return "An account with this email already exists. Sign in to continue or verify your email.";
    case "CodeMismatchException":
      return "The code is incorrect. Please try again.";
    case "ExpiredCodeException":
      return "The code has expired. Request a new code.";
    case "InvalidPasswordException":
      return "Your password does not meet the requirements. Use at least 8 characters with uppercase and lowercase letters, a number and a symbol.";
    case "LimitExceededException":
    case "TooManyRequestsException":
      return "Too many attempts. Please wait and try again.";
    case "UserNotConfirmedException":
      return "Verify your email before signing in.";
    case "PasswordResetRequiredException":
      return "Please reset your password before signing in.";
    case "AuthSyncError":
      return "Unable to synchronize your account. Please try again.";
    case "ProfileUpdateError":
      return "Your email is verified, but your profile could not be saved. Please retry.";
    case "UnsupportedAuthChallenge":
      return "This account requires an additional sign-in step. Please contact support.";
    default:
      return "Unable to complete the request. Check your connection and try again.";
  }
}
