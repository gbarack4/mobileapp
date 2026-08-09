import {
  useEffect,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type MutableRefObject,
  type RefObject,
} from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../../constants/theme";

type ReplyComposerProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  inputRef?: RefObject<unknown>;
  blurred?: boolean;
};

/** Inner control height — must fit 15px / 20px line text + Send. */
const CONTROL_HEIGHT = 32;
const MAX_HEIGHT = 120;
const SHELL_PAD = 4;

export function ReplyComposer({
  value,
  onChangeText,
  onSend,
  inputRef,
  blurred = false,
}: Readonly<ReplyComposerProps>) {
  const localRef = useRef<HTMLTextAreaElement>(null);
  const canSend = value.trim().length > 0;

  useEffect(() => {
    if (inputRef) {
      (inputRef as MutableRefObject<HTMLTextAreaElement | null>).current =
        localRef.current;
    }
  }, [inputRef]);

  useLayoutEffect(() => {
    const el = localRef.current;
    if (!el) return;

    el.style.height = "0px";
    const nextHeight = Math.min(
      MAX_HEIGHT,
      Math.max(CONTROL_HEIGHT, el.scrollHeight),
    );
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? "auto" : "hidden";
  }, [value]);

  return (
    <View style={[styles.composer, blurred && styles.composerBlurred]}>
      <View style={styles.inputShell}>
        <div style={webInputWrapStyle}>
          <textarea
            ref={localRef}
            value={value}
            rows={1}
            onChange={(event) => onChangeText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSend();
              }
            }}
            placeholder="Type a reply..."
            maxLength={1000}
            aria-label="Type a reply"
            autoComplete="off"
            style={webInputStyle}
          />
        </div>
        <Pressable
          onPress={onSend}
          disabled={!canSend}
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

const webInputWrapStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  minHeight: CONTROL_HEIGHT,
  display: "flex",
  alignItems: "flex-end",
  overflow: "hidden",
};

/** Match react-native-web Text / chat bubble typography. */
const CHAT_FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const webInputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  minHeight: CONTROL_HEIGHT,
  maxHeight: MAX_HEIGHT,
  height: CONTROL_HEIGHT,
  margin: 0,
  padding: 0,
  border: "none",
  outline: "none",
  resize: "none",
  overflowX: "hidden",
  overflowY: "hidden",
  background: "transparent",
  fontSize: 15,
  lineHeight: `${CONTROL_HEIGHT}px`,
  fontWeight: 400,
  letterSpacing: "normal",
  color: colors.text,
  fontFamily: CHAT_FONT_FAMILY,
  boxSizing: "border-box",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  overflowWrap: "anywhere",
};

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
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    ...({
      backdropFilter: "saturate(180%) blur(16px)",
      WebkitBackdropFilter: "saturate(180%) blur(16px)",
    } as object),
  },
  inputShell: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    minHeight: CONTROL_HEIGHT + SHELL_PAD * 2,
    borderRadius: 20,
    backgroundColor: colors.inputBackground,
    paddingLeft: 12,
    paddingRight: SHELL_PAD,
    paddingTop: SHELL_PAD,
    paddingBottom: SHELL_PAD,
    overflow: "hidden",
  },
  sendButton: {
    width: CONTROL_HEIGHT,
    height: CONTROL_HEIGHT,
    minWidth: 52,
    borderRadius: CONTROL_HEIGHT / 2,
    paddingHorizontal: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sendButtonDisabled: {
    backgroundColor: "#93c5fd",
  },
  sendButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.white,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.85,
  },
});
