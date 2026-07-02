import { forwardRef, type ReactNode } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import { colors, radius, spacing } from '../../constants/theme';

type AuthTextFieldProps = TextInputProps & {
  label: string;
  focused: boolean;
  icon?: ReactNode;
};

export const AuthTextField = forwardRef<TextInput, AuthTextFieldProps>(function AuthTextField(
  { label, focused, icon, style, ...inputProps },
  ref,
) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            icon ? styles.inputWithIcon : null,
            focused && styles.inputFocused,
            style,
          ]}
          {...inputProps}
        />
        {icon ? <View style={styles.inputIcon}>{icon}</View> : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  field: {
    gap: spacing.md,
  },
  label: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
    fontWeight: '400',
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    borderWidth: 2,
    borderColor: 'transparent',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
  inputWithIcon: {
    paddingRight: 48,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  inputIcon: {
    position: 'absolute',
    right: spacing.lg,
  },
});
