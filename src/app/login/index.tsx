import { useAuth } from "../../lib/auth/auth-provider";
import {
  confirmSignUp,
  resendSignUpCode,
  signInWithPassword,
  requestPasswordReset,
  confirmPasswordReset,
} from "../../lib/auth/cognito.client";
import { authErrorMessage, authErrorName } from "../../lib/auth/auth-errors";
import { getAuthOperationVersion } from "../../lib/auth/session-manager";
import { startSocialSignIn } from "../../lib/auth/social-sign-in";
import type { SocialProvider } from "../../lib/auth/oauth-config";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Linking,
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
import { isValidPassword, normalizeIdentifier } from "../../utils/validation";

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
    "Enter your email and we'll send you a code to reset your password.",
  "reset-password": "Enter the code from your email and choose a new password.",
};

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 94, 255, 0.14)" } : undefined;

const STEP_DROPDOWN_MS = 360;
const PASSWORD_DROPDOWN_HEIGHT = 160;
const TERMS_URL = "https://driveinstructor.pro/terms";
const PRIVACY_URL = "https://driveinstructor.pro/privacy";

export default function LoginScreen() {
  const { completeSignIn, isLoaded } = useAuth();
  const passwordRef = useRef<TextInput>(null);
  const codeRef = useRef<TextInput>(null);
  const passwordReveal = useRef(new Animated.Value(0)).current;
  const mounted = useRef(true);
  const busy = useRef(false);
  const verified = useRef(false);
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
  const [focusedField, setFocusedField] = useState<FocusedField | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const trimmedIdentifier = normalizeIdentifier(identifier);
  const isBusy = isSubmitting;
  const identifierEditable =
    step === "identifier" || step === "forgot-password";
  const showPasswordLogin = step === "identifier" || step === "password";
  const showForgotPasswordLink = step === "password";
  const isForgotFlow = step === "forgot-password" || step === "reset-password";
  const isVerifyStep = step === "verify-code";
  const primaryDisabled = isBusy || !isLoaded;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    const animation = Animated.timing(passwordReveal, {
      toValue: step === "password" ? 1 : 0,
      duration: STEP_DROPDOWN_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (finished && step === "password") passwordRef.current?.focus();
    });
    return () => animation.stop();
  }, [passwordReveal, step]);

  function clearMessages() {
    setError(null);
    setSuccess(null);
  }
  function handleBackToIdentifier() {
    if (busy.current) return;
    verified.current = false;
    setStep("identifier");
    setPassword("");
    setVerificationCode("");
    clearMessages();
  }
  function handleBackToPassword() {
    if (busy.current) return;
    setStep("password");
    setVerificationCode("");
    setResetCode("");
    setNewPassword("");
    setConfirmPassword("");
    clearMessages();
  }
  function handleForgotPassword() {
    if (busy.current) return;
    setStep("forgot-password");
    setPassword("");
    clearMessages();
  }
  function handleSignUpPress() {
    if (!busy.current) router.push("/signup");
  }
  function isCurrent(version: number) {
    return mounted.current && version === getAuthOperationVersion();
  }
  async function finishSignIn(version: number) {
    const response = await signInWithPassword(trimmedIdentifier, password);
    if (!isCurrent(version)) return;
    if (!response.AuthenticationResult || response.ChallengeName) {
      const challenge = new Error("Additional authentication is required");
      challenge.name = "UnsupportedAuthChallenge";
      throw challenge;
    }
    await completeSignIn(response.AuthenticationResult, undefined, version);
  }
  async function runAction(action: (version: number) => Promise<void>) {
    if (!isLoaded || busy.current) return;
    busy.current = true;
    setIsSubmitting(true);
    clearMessages();
    const version = getAuthOperationVersion();
    try {
      await action(version);
    } catch (err: unknown) {
      if (mounted.current) setError(authErrorMessage(err));
    } finally {
      busy.current = false;
      if (mounted.current) setIsSubmitting(false);
    }
  }
  function handleResendCode() {
    void runAction(async () => {
      await resendSignUpCode(trimmedIdentifier);
      if (mounted.current)
        setSuccess("A new verification code has been sent to your email.");
    });
  }
  function handleSocialSignIn(provider: SocialProvider) {
    void runAction((version) => startSocialSignIn(provider, version));
  }
  function handleVerifyAndSignIn() {
    if (!verified.current && !/^\d{6}$/.test(verificationCode)) {
      setError("Enter the 6-digit code.");
      return;
    }
    void runAction(async (version) => {
      if (!verified.current) {
        await confirmSignUp(trimmedIdentifier, verificationCode);
        if (!isCurrent(version)) return;
        verified.current = true;
      }
      await finishSignIn(version);
    });
  }
  function handleContinue() {
    if (busy.current || !isLoaded) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedIdentifier)) {
      setError("Enter a valid email address.");
      return;
    }
    if (step === "identifier") {
      clearMessages();
      setStep("password");
      return;
    }
    if (step === "password") {
      if (!password) {
        setError("Enter your password.");
        return;
      }
      void runAction(async (version) => {
        try {
          await finishSignIn(version);
        } catch (err: unknown) {
          if (!isCurrent(version)) throw err;
          if (authErrorName(err) === "UserNotConfirmedException") {
            verified.current = false;
            setStep("verify-code");
            await resendSignUpCode(trimmedIdentifier);
          } else if (authErrorName(err) === "PasswordResetRequiredException") {
            setStep("forgot-password");
            setSuccess("Please reset your password to continue.");
          } else {
            throw err;
          }
        }
      });
      return;
    }
    if (step === "forgot-password") {
      void runAction(async (version) => {
        await requestPasswordReset(trimmedIdentifier);
        if (isCurrent(version)) {
          setStep("reset-password");
          setResetCode("");
        }
      });
      return;
    }
    if (!/^\d{6}$/.test(resetCode.trim())) {
      setError("Enter the 6-digit reset code.");
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
    void runAction(async (version) => {
      await confirmPasswordReset(
        trimmedIdentifier,
        resetCode.trim(),
        newPassword,
      );
      if (!isCurrent(version)) return;
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setResetCode("");
      setStep("password");
      setSuccess("Password updated. Sign in with your new password.");
    });
  }

  function getPrimaryButtonLabel() {
    if (!isLoaded) {
      return "Loading...";
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
          <Text style={styles.backLinkText}>← Use a different email</Text>
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
          disabled={isBusy}
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
          onResend={handleResendCode}
        />
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header} pointerEvents="box-none">
              <Logo size={64} />
              <Text style={styles.title} numberOfLines={1}>
                {STEP_TITLES[step as Exclude<LoginStep, "verify-code">]}
              </Text>
              {STEP_SUBTITLES[step] ? (
                <Text style={styles.subtitle}>{STEP_SUBTITLES[step]}</Text>
              ) : null}
            </View>

            <View style={styles.form}>
              <View>
                {showPasswordLogin ? (
                  <Animated.View
                    pointerEvents={step === "password" ? "auto" : "none"}
                    style={[
                      styles.dropdownSection,
                      {
                        opacity: passwordReveal,
                        maxHeight: passwordReveal.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 36],
                        }),
                        marginBottom: passwordReveal.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, spacing.sm],
                        }),
                      },
                    ]}
                  >
                    <Pressable
                      onPress={handleBackToIdentifier}
                      style={styles.backLink}
                    >
                      <Text style={styles.backLinkText}>
                        ← Use a different email
                      </Text>
                    </Pressable>
                  </Animated.View>
                ) : (
                  renderBackLink()
                )}

                <Text style={styles.label}>Email</Text>

                <View style={[styles.inputWrapper, styles.identifierField]}>
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
                    placeholder="Email"
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
                  <View style={styles.inputIcon} pointerEvents="none">
                    <PersonIcon />
                  </View>
                </View>

                {showPasswordLogin ? (
                  <Animated.View
                    pointerEvents={step === "password" ? "auto" : "none"}
                    style={[
                      styles.passwordDropdown,
                      {
                        opacity: passwordReveal,
                        maxHeight: passwordReveal.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, PASSWORD_DROPDOWN_HEIGHT],
                        }),
                        marginTop: passwordReveal.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, spacing.md],
                        }),
                        transform: [
                          {
                            translateY: passwordReveal.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-10, 0],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
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
                        secureTextEntry={!passwordVisible}
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
                        editable={!isBusy && step === "password"}
                      />
                      <Pressable
                        onPress={() =>
                          setPasswordVisible((current) => !current)
                        }
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={
                          passwordVisible ? "Hide password" : "Show password"
                        }
                        style={styles.inputIcon}
                      >
                        <LockIcon unlocked={passwordVisible} />
                      </Pressable>
                    </View>
                  </Animated.View>
                ) : null}
              </View>

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
                      secureTextEntry={!newPasswordVisible}
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
                    <Pressable
                      onPress={() =>
                        setNewPasswordVisible((current) => !current)
                      }
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={
                        newPasswordVisible ? "Hide password" : "Show password"
                      }
                      style={styles.inputIcon}
                    >
                      <LockIcon unlocked={newPasswordVisible} />
                    </Pressable>
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
                      secureTextEntry={!confirmPasswordVisible}
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
                    <Pressable
                      onPress={() =>
                        setConfirmPasswordVisible((current) => !current)
                      }
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={
                        confirmPasswordVisible
                          ? "Hide password"
                          : "Show password"
                      }
                      style={styles.inputIcon}
                    >
                      <LockIcon unlocked={confirmPasswordVisible} />
                    </Pressable>
                  </View>
                </>
              ) : null}

              {success ? <Text style={styles.success}>{success}</Text> : null}
              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                onPress={handleContinue}
                disabled={primaryDisabled}
                android_ripple={ANDROID_RIPPLE}
                style={({ pressed, hovered }: PressableState) => [
                  styles.primaryButton,
                  primaryDisabled && styles.primaryButtonDisabled,
                  hovered &&
                    !primaryDisabled &&
                    !pressed &&
                    styles.primaryButtonHovered,
                  pressed && !primaryDisabled && styles.buttonPressed,
                ]}
              >
                {!isLoaded ? (
                  <View style={styles.buttonLoadingRow}>
                    <ActivityIndicator color={colors.white} />
                    <Text style={styles.primaryButtonText}>
                      {getPrimaryButtonLabel()}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {getPrimaryButtonLabel()}
                  </Text>
                )}
              </Pressable>

              {showPasswordLogin ? (
                <Animated.View
                  pointerEvents={step === "password" ? "auto" : "none"}
                  style={[
                    styles.dropdownSection,
                    {
                      opacity: passwordReveal,
                      maxHeight: passwordReveal.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 48],
                      }),
                    },
                  ]}
                >
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
                </Animated.View>
              ) : showForgotPasswordLink ? (
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
              {showPasswordLogin ? (
                <>
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                  </View>
                  <View style={styles.socialButtons}>
                    <Pressable
                      accessibilityRole="button"
                      disabled={primaryDisabled}
                      onPress={() => handleSocialSignIn("Google")}
                      style={({ pressed }) => [
                        styles.socialButton,
                        primaryDisabled && styles.socialButtonLoading,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <GoogleIcon />
                      <Text style={styles.socialButtonText}>
                        Continue with Google
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      disabled={primaryDisabled}
                      onPress={() => handleSocialSignIn("SignInWithApple")}
                      style={({ pressed }) => [
                        styles.socialButton,
                        primaryDisabled && styles.socialButtonLoading,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <AppleIcon />
                      <Text style={styles.socialButtonText}>
                        Sign in with Apple
                      </Text>
                    </Pressable>
                  </View>
                </>
              ) : null}
            </View>

            {showPasswordLogin ? (
              <View style={styles.signUpRow}>
                <Text style={styles.signUpText}>Don't have an account? </Text>
                <Pressable
                  onPress={handleSignUpPress}
                  disabled={isBusy}
                  hitSlop={8}
                >
                  <Text style={styles.signUpLink}>Sign up</Text>
                </Pressable>
              </View>
            ) : null}

            {!isForgotFlow ? (
              <Text style={styles.termsDisclaimer}>
                By signing in, you agree to our{" "}
                <Text
                  style={styles.termsLink}
                  onPress={() => void Linking.openURL(TERMS_URL)}
                >
                  Terms and Conditions
                </Text>{" "}
                and acknowledge our{" "}
                <Text
                  style={styles.termsLink}
                  onPress={() => void Linking.openURL(PRIVACY_URL)}
                >
                  Privacy Policy
                </Text>
                .
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
    width: "100%",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    letterSpacing: -0.3,
    ...(Platform.OS === "web"
      ? ({
          whiteSpace: "nowrap",
          fontSize: "clamp(18px, 5.6vw, 28px)",
          lineHeight: 34,
        } as object)
      : {}),
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
    zIndex: 1,
  },
  dropdownSection: {
    overflow: "hidden",
  },
  identifierField: {
    marginTop: spacing.md,
  },
  passwordDropdown: {
    overflow: "hidden",
    gap: spacing.md,
  },
  socialDropdown: {
    overflow: "hidden",
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
    fontWeight: "600",
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
    // Avoid lineHeight on native TextInput — it clips/hides typed text on iOS.
    ...(Platform.OS === "web" ? { lineHeight: 22 } : {}),
    color: colors.text,
    fontWeight: "500",
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
    zIndex: 2,
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
  buttonLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
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
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
  socialButtons: {
    gap: spacing.md,
    zIndex: 1,
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
    fontWeight: "600",
  },
  signUpRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
    zIndex: 1,
  },
  signUpPressable: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  signUpText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "500",
  },
  signUpLink: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  termsDisclaimer: {
    marginTop: "auto",
    paddingTop: spacing.xxxl,
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  termsLink: {
    color: colors.primary,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
