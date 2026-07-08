import { useEffect, useRef } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors, radius, spacing } from "../../constants/theme";

const CODE_LENGTH = 6;

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
};

export function OtpInput({
  value,
  onChange,
  length = CODE_LENGTH,
  disabled = false,
}: Readonly<OtpInputProps>) {
  const inputRef = useRef<TextInput>(null);
  const digits = value.padEnd(length, " ").slice(0, length).split("");
  const activeIndex = value.length < length ? value.length : -1;

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, []);

  function handleChange(text: string) {
    onChange(text.replace(/\D/g, "").slice(0, length));
  }

  return (
    <View style={styles.container}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === "android" ? "sms-otp" : "one-time-code"}
        maxLength={length}
        editable={!disabled}
        caretHidden
        style={styles.hiddenInput}
        accessibilityLabel="Verification code"
      />

      <View style={styles.boxRow}>
        {digits.map((digit, index) => {
          const isFocused =
            !disabled && value.length < length && index === activeIndex;
          const isFilled = digit.trim().length > 0;

          return (
            <Pressable
              key={index}
              onPress={() => inputRef.current?.focus()}
              style={[
                styles.box,
                isFocused && styles.boxFocused,
                isFilled && styles.boxFilled,
              ]}
            >
              <Text style={styles.boxDigit}>{digit.trim()}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  hiddenInput: {
    ...StyleSheet.absoluteFill,
    opacity: 0,
  },
  boxRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  box: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 72,
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  boxFocused: {
    borderColor: colors.primary,
  },
  boxFilled: {
    backgroundColor: colors.inputBackground,
  },
  boxDigit: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.text,
  },
});
