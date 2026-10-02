export function authErrorName(error: unknown): string {
  return error instanceof Error ? error.name : "";
}
export function authErrorMessage(error: unknown): string {
  switch (authErrorName(error)) {
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
