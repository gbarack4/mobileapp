import type { RefObject } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { colors } from "../../constants/theme";

type ReplyComposerProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  inputRef?: RefObject<TextInput | null>;
  blurred?: boolean;
};

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 0, 0, 0.06)" } : undefined;

export function ReplyComposer({
  value,
  onChangeText,
  onSend,
  inputRef,
  blurred = false,
}: Readonly<ReplyComposerProps>) {
  const canSend = value.trim().length > 0;

  return (
    <View style={[styles.composer, blurred && styles.composerBlurred]}>
      <View style={styles.inputShell}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder="Type a reply..."
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          editable
          multiline
          maxLength={1000}
          scrollEnabled
          blurOnSubmit={false}
          returnKeyType="default"
          autoCorrect
          autoCapitalize="sentences"
          accessibilityLabel="Type a reply"
          textAlignVertical="center"
        />
        <Pressable
          onPress={onSend}
          disabled={!canSend}
          android_ripple={ANDROID_RIPPLE}
          style={({ pressed }) => [
            styles.sendButton,
            !canSend && styles.sendButtonDisabled,
            pressed && canSend && styles.pressed,
          ]}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  composer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "transparent",
    backgroundColor: "rgba(255, 255, 255, 0.92)",
  },
  composerBlurred: {
    borderTopColor: "rgba(238, 242, 247, 0.9)",
    backgroundColor: "rgba(255, 255, 255, 0.82)",
  },
  inputShell: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    minHeight: 40,
    borderRadius: 20,
    backgroundColor: colors.inputBackground,
    paddingLeft: 12,
    paddingRight: 4,
    paddingTop: 4,
    paddingBottom: 4,
    overflow: "hidden",
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 32,
    maxHeight: 120,
    margin: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
    fontSize: 15,
    lineHeight: 32,
    fontWeight: "400",
    color: colors.text,
    backgroundColor: "transparent",
    textAlignVertical: "center",
  },
  sendButton: {
    height: 32,
    minHeight: 32,
    minWidth: 52,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sendButtonDisabled: {
    backgroundColor: "#93c5fd",
  },
  sendButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.white,
  },
  pressed: {
    opacity: 0.85,
  },
});
