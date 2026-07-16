import { useSSO, useSignIn } from "@clerk/clerk-expo";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { VerifyCodeStep } from "../../components/auth/verify-code-step";
import {
  AppleIcon,
  GoogleIcon,
  LockIcon,
  PersonIcon,
} from "../../components/icons/auth-icons";
import { Logo } from "../../components/logo";
import { colors, radius, spacing } from "../../constants/theme";
import { setSessionEmail } from "../../services/session";
import {
  isValidIdentifier,
  isValidPassword,
  normalizeIdentifier,
} from "../../utils/validation";

WebBrowser.maybeCompleteAuthSession();

type LoginStep =
  | "identifier"
  | "password"
  | "verify-code"
  | "forgot-password"
  | "reset-password";
type FocusedField =
  | "identifier"
  | "password"
  | "code"
  | "newPassword"
  | "confirmPassword";

type PressableState = {
  pressed: boolean;
  hovered?: boolean;
};

const STEP_TITLES: Record<Exclude<LoginStep, "verify-code">, string> = {
  identifier: "Get started with InstructorHub",
  password: "Get started with InstructorHub",
  "forgot-password": "Forgot your password?",
  "reset-password": "Create a new password",
};

const STEP_SUBTITLES: Partial<Record<LoginStep, string>> = {
  "forgot-password":
    "Enter your email or mobile number and we'll text you a code to reset your password.",
  "reset-password":
    "Enter the code from your email/text message and choose a new password.",
};

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 94, 255, 0.14)" } : undefined;

const CONTINUING_MS = 1000;

export default function LoginScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();

  const passwordRef = useRef<TextInput>(null);
  const codeRef = useRef<TextInput>(null);

  const [step, setStep] = useState<LoginStep>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"apple" | "google" | null>(
    null,
  );
  const [focusedField, setFocusedField] = useState<FocusedField | null>(null);

  const trimmedIdentifier = normalizeIdentifier(identifier);
  const isBusy = isSubmitting || isContinuing || oauthLoading !== null;
  const showSocialLogin = step === "identifier";
  const identifierEditable =
    step === "identifier" || step === "forgot-password";
  const showPasswordField = step === "password";
  const showForgotPasswordLink = step === "password";
  const isForgotFlow = step === "forgot-password" || step === "reset-password";
  const isVerifyStep = step === "verify-code";

  function clearMessages() {
    setError(null);
    setSuccess(null);
  }

  function handleBackToIdentifier() {
    setStep("identifier");
    setPassword("");
    setVerificationCode("");
    setResetCode("");
    setNewPassword("");
    setConfirmPassword("");
    clearMessages();
    setFocusedField(null);
  }

  function handleBackToPassword() {
    setStep("password");
    setVerificationCode("");
    setResetCode("");
    setNewPassword("");
    setConfirmPassword("");
    clearMessages();
    setFocusedField(null);
    setTimeout(() => passwordRef.current?.focus(), 100);
  }

  function handleForgotPassword() {
    setStep("forgot-password");
    setPassword("");
    clearMessages();
    setFocusedField(null);
  }

  function runAfterContinuing(action: () => void) {
    setIsContinuing(true);
    setTimeout(() => {
      setIsContinuing(false);
      action();
    }, CONTINUING_MS);
  }

  async function handleVerifyAndSignIn() {
    if (!isLoaded) return;

    if (verificationCode.length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }

    clearMessages();
    setIsSubmitting(true);

    try {
      const completeSignIn = await signIn.attemptSecondFactor({
        strategy: "email_code",
        code: verificationCode,
      });

      if (completeSignIn.status === "complete") {
        await setActive({ session: completeSignIn.createdSessionId });
        if (trimmedIdentifier.includes("@")) {
          setSessionEmail(trimmedIdentifier);
        }
        router.replace("/dashboard");
      } else {
        setError("Verification failed.");
      }
    } catch (err: any) {
      setError(
        err.errors?.[0]?.longMessage || "Invalid code. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleContinue() {
    if (isContinuing || isSubmitting || !isLoaded) {
      return;
    }

    if (step === "identifier") {
      if (!isValidIdentifier(trimmedIdentifier)) {
        setError("Enter a valid mobile number or email address.");
        return;
      }

      clearMessages();
      runAfterContinuing(() => {
        setStep("password");
        setTimeout(() => passwordRef.current?.focus(), 100);
      });
      return;
    }

    if (step === "password") {
      if (!password.trim()) {
        setError("Enter your password.");
        return;
      }

      clearMessages();
      setIsSubmitting(true);

      try {
        const completeSignIn = await signIn.create({
          identifier: trimmedIdentifier,
          password,
        });

        if (completeSignIn.status === "complete") {
          await setActive({ session: completeSignIn.createdSessionId });
          if (trimmedIdentifier.includes("@")) {
            setSessionEmail(trimmedIdentifier);
          }
          router.replace("/dashboard");
        } else if (completeSignIn.status === "needs_second_factor") {
          await signIn.prepareSecondFactor({ strategy: "email_code" });
          setStep("verify-code");
        } else {
          setError("Unexpected status. Please try again.");
        }
      } catch (err: any) {
        setError(err.errors?.[0]?.longMessage || "Invalid email or password.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (step === "forgot-password") {
      if (!isValidIdentifier(trimmedIdentifier)) {
        setError("Enter a valid mobile number or email address.");
        return;
      }

      clearMessages();
      setIsSubmitting(true);

      try {
        await signIn.create({
          strategy: "reset_password_email_code",
          identifier: trimmedIdentifier,
        });

        setStep("reset-password");
        setTimeout(() => codeRef.current?.focus(), 100);
      } catch (err: any) {
        setError(
          err.errors?.[0]?.longMessage ||
            "Could not send reset code. Try again.",
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!resetCode.trim()) {
      setError("Enter the reset code.");
      return;
    }

    if (!isValidPassword(newPassword)) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    clearMessages();
    setIsSubmitting(true);

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: resetCode.trim(),
        password: newPassword,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        setSuccess("Password updated successfully!");
        setTimeout(() => router.replace("/dashboard"), 1500);
      } else {
        setError("Failed to reset password. Please try again.");
      }
    } catch (err: any) {
      setError(
        err.errors?.[0]?.longMessage ||
          "Unable to reset password. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleOAuth(provider: "apple" | "google") {
    clearMessages();
    setOauthLoading(provider);

    try {
      const strategy = provider === "apple" ? "oauth_apple" : "oauth_google";

      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,
      });

      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
        router.replace("/dashboard");
      } else {
        setError("Please sign up first to use OAuth.");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || "OAuth authentication failed.");
    } finally {
      setOauthLoading(null);
    }
  }

  function getPrimaryButtonLabel() {
    if (isContinuing) {
      switch (step) {
        case "identifier":
          return "Continuing....";
        case "password":
          return "Signing in....";
        case "forgot-password":
          return "Sending....";
        case "reset-password":
          return "Resetting....";
      }
    }

    if (isSubmitting) {
      switch (step) {
        case "password":
          return "Signing in....";
        case "forgot-password":
          return "Sending....";
        case "reset-password":
          return "Resetting....";
        default:
          return "Processing...";
      }
    }

    switch (step) {
      case "identifier":
        return "Continue";
      case "password":
        return "Sign in";
      case "forgot-password":
        return "Send reset code";
      case "reset-password":
        return "Reset password";
    }
  }

  function renderBackLink() {
    if (step === "password") {
      return (
        <Pressable onPress={handleBackToIdentifier} style={styles.backLink}>
          <Text style={styles.backLinkText}>
            ← Use a different email or number
          </Text>
        </Pressable>
      );
    }
    if (step === "forgot-password") {
      return (
        <Pressable onPress={handleBackToPassword} style={styles.backLink}>
          <Text style={styles.backLinkText}>← Back to sign in</Text>
        </Pressable>
      );
    }
    if (step === "reset-password") {
      return (
        <Pressable
          onPress={() => setStep("forgot-password")}
          style={styles.backLink}
        >
          <Text style={styles.backLinkText}>← Resend code</Text>
        </Pressable>
      );
    }
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {isVerifyStep ? (
        <VerifyCodeStep
          identifier={trimmedIdentifier}
          code={verificationCode}
          error={error}
          success={success}
          isSubmitting={isSubmitting}
          onChangeCode={(value) => {
            setVerificationCode(value);
            if (error) setError(null);
          }}
          onBack={handleBackToPassword}
          onNext={handleVerifyAndSignIn}
        />
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Logo size={64} />
              <Text style={styles.title}>
                {STEP_TITLES[step as Exclude<LoginStep, "verify-code">]}
              </Text>
              {STEP_SUBTITLES[step] ? (
                <Text style={styles.subtitle}>{STEP_SUBTITLES[step]}</Text>
              ) : null}
            </View>

            <View style={styles.form}>
              {renderBackLink()}

              <Text style={styles.label}>Mobile number or email</Text>

              <View style={styles.inputWrapper}>
                <TextInput
                  value={identifier}
                  onChangeText={(value) => {
                    setIdentifier(value);
                    if (error) setError(null);
                    if (success) setSuccess(null);
                  }}
                  onFocus={() => setFocusedField("identifier")}
                  onBlur={() =>
                    setFocusedField((current) =>
                      current === "identifier" ? null : current,
                    )
                  }
                  placeholder="Mobile number or email"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="username"
                  autoComplete="username"
                  returnKeyType={step === "identifier" ? "go" : "next"}
                  onSubmitEditing={
                    step === "identifier" ? handleContinue : undefined
                  }
                  style={[
                    styles.input,
                    focusedField === "identifier" && styles.inputFocused,
                    !identifierEditable && styles.inputDisabled,
                  ]}
                  editable={!isBusy && identifierEditable}
                />
                <View style={styles.inputIcon}>
                  <PersonIcon />
                </View>
              </View>

              {showPasswordField ? (
                <>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      ref={passwordRef}
                      value={password}
                      onChangeText={(value) => {
                        setPassword(value);
                        if (error) setError(null);
                        if (success) setSuccess(null);
                      }}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() =>
                        setFocusedField((current) =>
                          current === "password" ? null : current,
                        )
                      }
                      placeholder="Password"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      textContentType="password"
                      autoComplete="password"
                      returnKeyType="go"
                      onSubmitEditing={handleContinue}
                      style={[
                        styles.input,
                        focusedField === "password" && styles.inputFocused,
                      ]}
                      editable={!isBusy}
                    />
                    <View style={styles.inputIcon}>
                      <LockIcon />
                    </View>
                  </View>
                </>
              ) : null}

              {step === "reset-password" ? (
                <>
                  <Text style={styles.label}>Reset code</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      ref={codeRef}
                      value={resetCode}
                      onChangeText={(value) => {
                        setResetCode(value);
                        if (error) setError(null);
                      }}
                      onFocus={() => setFocusedField("code")}
                      onBlur={() =>
                        setFocusedField((current) =>
                          current === "code" ? null : current,
                        )
                      }
                      placeholder="Enter 6-digit code"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      textContentType="oneTimeCode"
                      autoComplete="one-time-code"
                      maxLength={6}
                      returnKeyType="next"
                      style={[
                        styles.input,
                        styles.inputPlain,
                        focusedField === "code" && styles.inputFocused,
                      ]}
                      editable={!isBusy}
                    />
                  </View>

                  <Text style={styles.label}>New password</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      value={newPassword}
                      onChangeText={(value) => {
                        setNewPassword(value);
                        if (error) setError(null);
                      }}
                      onFocus={() => setFocusedField("newPassword")}
                      onBlur={() =>
                        setFocusedField((current) =>
                          current === "newPassword" ? null : current,
                        )
                      }
                      placeholder="New password"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      textContentType="newPassword"
                      autoComplete="new-password"
                      returnKeyType="next"
                      style={[
                        styles.input,
                        focusedField === "newPassword" && styles.inputFocused,
                      ]}
                      editable={!isBusy}
                    />
                    <View style={styles.inputIcon}>
                      <LockIcon />
                    </View>
                  </View>

                  <Text style={styles.label}>Confirm password</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      value={confirmPassword}
                      onChangeText={(value) => {
                        setConfirmPassword(value);
                        if (error) setError(null);
                      }}
                      onFocus={() => setFocusedField("confirmPassword")}
                      onBlur={() =>
                        setFocusedField((current) =>
                          current === "confirmPassword" ? null : current,
                        )
                      }
                      placeholder="Confirm password"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      textContentType="newPassword"
                      autoComplete="new-password"
                      returnKeyType="go"
                      onSubmitEditing={handleContinue}
                      style={[
                        styles.input,
                        focusedField === "confirmPassword" &&
                          styles.inputFocused,
                      ]}
                      editable={!isBusy}
                    />
                    <View style={styles.inputIcon}>
                      <LockIcon />
                    </View>
                  </View>
                </>
              ) : null}

              {success ? <Text style={styles.success}>{success}</Text> : null}
              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                onPress={handleContinue}
                disabled={isBusy}
                android_ripple={ANDROID_RIPPLE}
                style={({ pressed, hovered }: PressableState) => [
                  styles.primaryButton,
                  isBusy && styles.primaryButtonDisabled,
                  hovered && !isBusy && !pressed && styles.primaryButtonHovered,
                  pressed && !isBusy && styles.buttonPressed,
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  {getPrimaryButtonLabel()}
                </Text>
              </Pressable>

              {showForgotPasswordLink ? (
                <Pressable
                  onPress={handleForgotPassword}
                  disabled={isBusy}
                  android_ripple={ANDROID_RIPPLE}
                  style={({ pressed, hovered }: PressableState) => [
                    styles.textButton,
                    (pressed || hovered) && styles.textButtonActive,
                  ]}
                >
                  <Text style={styles.textButtonLabel}>Forgot password?</Text>
                </Pressable>
              ) : null}

              {step === "reset-password" ? (
                <Pressable
                  onPress={handleBackToPassword}
                  disabled={isBusy}
                  style={({ pressed, hovered }: PressableState) => [
                    styles.textButton,
                    (pressed || hovered) && styles.textButtonActive,
                  ]}
                >
                  <Text style={styles.textButtonLabel}>Back to sign in</Text>
                </Pressable>
              ) : null}
            </View>

            {showSocialLogin ? (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.socialButtons}>
                  <Pressable
                    onPress={() => handleOAuth("apple")}
                    disabled={isBusy}
                    android_ripple={ANDROID_RIPPLE}
                    style={({ pressed, hovered }: PressableState) => [
                      styles.socialButton,
                      hovered &&
                        !pressed &&
                        !isBusy &&
                        styles.socialButtonHovered,
                      pressed && styles.buttonPressed,
                      oauthLoading === "apple" && styles.socialButtonLoading,
                    ]}
                  >
                    {oauthLoading === "apple" ? (
                      <ActivityIndicator color={colors.text} />
                    ) : (
                      <>
                        <AppleIcon />
                        <Text style={styles.socialButtonText}>
                          Continue with Apple
                        </Text>
                      </>
                    )}
                  </Pressable>

                  <Pressable
                    onPress={() => handleOAuth("google")}
                    disabled={isBusy}
                    android_ripple={ANDROID_RIPPLE}
                    style={({ pressed, hovered }: PressableState) => [
                      styles.socialButton,
                      hovered &&
                        !pressed &&
                        !isBusy &&
                        styles.socialButtonHovered,
                      pressed && styles.buttonPressed,
                      oauthLoading === "google" && styles.socialButtonLoading,
                    ]}
                  >
                    {oauthLoading === "google" ? (
                      <ActivityIndicator color={colors.text} />
                    ) : (
                      <>
                        <GoogleIcon />
                        <Text style={styles.socialButtonText}>
                          Continue with Google
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </>
            ) : null}

            {step === "identifier" ? (
              <View style={styles.signUpRow}>
                <Text style={styles.signUpText}>Don't have an account? </Text>
                <Pressable
                  onPress={() => router.push("/signup")}
                  disabled={isBusy}
                  style={({ pressed, hovered }: PressableState) => [
                    (pressed || hovered) && styles.textButtonActive,
                  ]}
                >
                  <Text style={styles.signUpLink}>Sign up</Text>
                </Pressable>
              </View>
            ) : null}

            {!isForgotFlow ? (
              <Text style={styles.disclaimer}>
                You consent to receive a verification code by text or WhatsApp.
                Message and data rates may apply.
              </Text>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: spacing.sm,
  },
  form: {
    gap: spacing.md,
  },
  backLink: {
    alignSelf: "flex-start",
    marginBottom: spacing.xs,
  },
  backLinkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  label: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
    fontWeight: "400",
  },
  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingRight: 48,
    paddingVertical: 16,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    borderWidth: 2,
    borderColor: "transparent",
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
  },
  inputPlain: {
    paddingRight: spacing.lg,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  inputDisabled: {
    opacity: 0.7,
  },
  inputIcon: {
    position: "absolute",
    right: spacing.lg,
  },
  error: {
    color: colors.error,
    fontSize: 14,
    lineHeight: 20,
  },
  success: {
    color: "#15803d",
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web"
      ? ({
          outlineStyle: "none",
          transition: "background-color 0.15s ease",
        } as object)
      : {}),
  },
  primaryButtonHovered: {
    backgroundColor: colors.primaryHover,
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "600",
  },
  textButton: {
    alignSelf: "center",
    paddingVertical: spacing.sm,
  },
  textButtonActive: {
    opacity: 0.7,
  },
  textButtonLabel: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "500",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.xl,
    gap: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  socialButtons: {
    gap: spacing.md,
  },
  socialButton: {
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    ...(Platform.OS === "web"
      ? ({
          outlineStyle: "none",
          transition: "background-color 0.15s ease",
        } as object)
      : {}),
  },
  socialButtonHovered: {
    backgroundColor: colors.inputBackgroundHover,
  },
  socialButtonLoading: {
    opacity: 0.8,
  },
  socialButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "500",
  },
  signUpRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },
  signUpText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  signUpLink: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "600",
  },
  disclaimer: {
    marginTop: "auto",
    paddingTop: spacing.xxxl,
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
