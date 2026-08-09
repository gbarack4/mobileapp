import { useEffect, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing } from "../../constants/theme";
import {
  getInboxMessageById,
  getThreadById,
} from "../../data/mock-inbox";
import type { ChatBubble } from "../../types/inbox";
import { ChevronLeftIcon } from "../icons/dashboard-icons";
import { ReplyComposer } from "./reply-composer";

type MessageThreadScreenProps = {
  messageId: string;
  onClose: () => void;
};

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 0, 0, 0.06)" } : undefined;

const HEADER_HEIGHT = 57;
const COMPOSER_HEIGHT = 50;
const BLUR_SCROLL_THRESHOLD = 8;

function formatNowLabel() {
  return new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MessageThreadScreen({
  messageId,
  onClose,
}: Readonly<MessageThreadScreenProps>) {
  const conversation = getInboxMessageById(messageId);
  const [messages, setMessages] = useState<ChatBubble[]>(() =>
    getThreadById(messageId),
  );
  const [draft, setDraft] = useState("");
  const [headerBlurred, setHeaderBlurred] = useState(false);
  const [composerBlurred, setComposerBlurred] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<unknown>(null);
  const headerBlurredRef = useRef(false);
  const composerBlurredRef = useRef(false);

  useEffect(() => {
    setMessages(getThreadById(messageId));
    setDraft("");
    setHeaderBlurred(false);
    setComposerBlurred(false);
    headerBlurredRef.current = false;
    composerBlurredRef.current = false;
  }, [messageId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return () => clearTimeout(timeout);
  }, [messages.length]);

  function handleThreadScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const nextHeaderBlurred = contentOffset.y > BLUR_SCROLL_THRESHOLD;
    const distanceFromBottom =
      contentSize.height - layoutMeasurement.height - contentOffset.y;
    const nextComposerBlurred = distanceFromBottom > BLUR_SCROLL_THRESHOLD;

    if (nextHeaderBlurred !== headerBlurredRef.current) {
      headerBlurredRef.current = nextHeaderBlurred;
      setHeaderBlurred(nextHeaderBlurred);
    }

    if (nextComposerBlurred !== composerBlurredRef.current) {
      composerBlurredRef.current = nextComposerBlurred;
      setComposerBlurred(nextComposerBlurred);
    }
  }

  if (!conversation) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.missingState}>
          <Text style={styles.missingTitle}>Conversation not found</Text>
          <Pressable onPress={onClose} style={styles.missingButton}>
            <Text style={styles.missingButtonText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  function handleSend() {
    const text = draft.trim();
    if (!text) return;

    setMessages((current) => [
      ...current,
      {
        id: `local-${Date.now()}`,
        text,
        timeLabel: formatNowLabel(),
        fromMe: true,
      },
    ]);
    setDraft("");
    const node = inputRef.current as { focus?: () => void } | null;
    node?.focus?.();
  }

  const content = (
    <>
      <View style={styles.threadWrap}>
        <ScrollView
          ref={scrollRef}
          style={styles.thread}
          contentContainerStyle={styles.threadContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          onScroll={handleThreadScroll}
          scrollEventThrottle={16}
        >
        {messages.map((bubble) => (
          <View
            key={bubble.id}
            style={[
              styles.bubbleWrap,
              bubble.fromMe ? styles.bubbleWrapMe : styles.bubbleWrapThem,
            ]}
          >
            <View
              style={[
                styles.bubble,
                bubble.fromMe ? styles.bubbleMe : styles.bubbleThem,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  bubble.fromMe && styles.bubbleTextMe,
                ]}
              >
                {bubble.text}
              </Text>
            </View>
            <Text
              style={[
                styles.bubbleTime,
                bubble.fromMe && styles.bubbleTimeMe,
              ]}
            >
              {bubble.timeLabel}
            </Text>
          </View>
        ))}
        </ScrollView>

        <View
          style={[styles.header, headerBlurred && styles.headerBlurred]}
          pointerEvents="box-none"
        >
          <Pressable
            onPress={onClose}
            hitSlop={10}
            android_ripple={ANDROID_RIPPLE}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
            accessibilityLabel="Go back"
          >
            <ChevronLeftIcon size={22} color={colors.text} />
          </Pressable>

          <View
            style={[
              styles.headerAvatar,
              conversation.fromSchool && styles.headerAvatarSchool,
            ]}
          >
            <Image
              source={{ uri: conversation.avatarUrl }}
              style={styles.headerAvatarImage}
            />
          </View>

          <View style={styles.headerText}>
            <Text style={styles.headerName} numberOfLines={1}>
              {conversation.senderName}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {conversation.fromSchool ? "School" : "Student"}
            </Text>
          </View>
        </View>
      </View>

      <ReplyComposer
        value={draft}
        onChangeText={setDraft}
        onSend={handleSend}
        inputRef={inputRef}
        blurred={composerBlurred}
      />
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {Platform.OS === "web" ? (
        <View style={styles.flex}>{content}</View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        >
          {content}
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    zIndex: 2,
    ...(Platform.OS === "web"
      ? ({ position: "relative" } as object)
      : {}),
  },
  flex: {
    flex: 1,
  },
  threadWrap: {
    flex: 1,
    minHeight: 0,
    position: "relative",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    minHeight: HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "transparent",
    backgroundColor: "rgba(255, 255, 255, 0.92)",
  },
  headerBlurred: {
    borderBottomColor: "rgba(238, 242, 247, 0.9)",
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    ...(Platform.OS === "web"
      ? ({
          backdropFilter: "saturate(180%) blur(16px)",
          WebkitBackdropFilter: "saturate(180%) blur(16px)",
        } as object)
      : {
          // Native fallback when expo-blur isn't installed
          backgroundColor: "rgba(255, 255, 255, 0.82)",
        }),
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: colors.inputBackground,
  },
  headerAvatarSchool: {
    borderRadius: 10,
  },
  headerAvatarImage: {
    width: "100%",
    height: "100%",
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  headerName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 1,
  },
  thread: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    overflow: "hidden",
  },
  threadContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: HEADER_HEIGHT + spacing.md,
    paddingBottom: COMPOSER_HEIGHT + spacing.lg,
    gap: spacing.md,
    flexGrow: 1,
    width: "100%",
    maxWidth: "100%",
  },
  bubbleWrap: {
    maxWidth: "82%",
    width: "auto",
    gap: 4,
    minWidth: 0,
  },
  bubbleWrapMe: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  bubbleWrapThem: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "100%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 6,
  },
  bubbleThem: {
    backgroundColor: colors.inputBackground,
    borderBottomLeftRadius: 6,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
    flexShrink: 1,
    ...(Platform.OS === "web"
      ? ({
          overflowWrap: "anywhere",
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
        } as object)
      : {}),
  },
  bubbleTextMe: {
    color: colors.white,
  },
  bubbleTime: {
    fontSize: 11,
    color: colors.textMuted,
  },
  bubbleTimeMe: {
    textAlign: "right",
  },
  pressed: {
    opacity: 0.85,
  },
  missingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
  missingTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
  },
  missingButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  missingButtonText: {
    color: colors.white,
    fontWeight: "600",
  },
});
