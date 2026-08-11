import { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SheetCloseIcon } from "../icons/cancel-lesson-icons";
import { colors, spacing } from "../../constants/theme";
import type { SchoolDetail } from "../../types/school";

export type ManageChoice = "pause" | "resume" | "deactive" | "cancel";

type DeactivateSchoolDialogProps = {
  visible: boolean;
  schoolName: string;
  status: SchoolDetail["joinStatus"];
  onClose: () => void;
  onCancelRequest: () => void;
  onPause: () => void;
  onResume: () => void;
  onDeactivate: () => void;
};

type OptionConfig = {
  id: ManageChoice;
  title: string;
  description: string;
  variant: "warning" | "danger";
};

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 0, 0, 0.06)" } : undefined;

function getOptionsForStatus(
  status: SchoolDetail["joinStatus"],
): OptionConfig[] {
  if (status === "pending") {
    return [
      {
        id: "cancel",
        title: "Cancel Request",
        description:
          "Withdraw your application. You can always apply again later.",
        variant: "danger",
      },
    ];
  }

  if (status === "paused") {
    return [
      {
        id: "resume",
        title: "Resume",
        description: "Resume active status and lessons with this school.",
        variant: "warning",
      },
      {
        id: "deactive",
        title: "Deactivate",
        description:
          "You will lose this school and need to rejoin again if you want to come back.",
        variant: "danger",
      },
    ];
  }

  return [
    {
      id: "pause",
      title: "Pause",
      description:
        "Stop receiving lessons from this school. You stay connected and can resume later.",
      variant: "warning",
    },
    {
      id: "deactive",
      title: "Deactivate",
      description:
        "You will lose this school and need to rejoin again if you want to come back.",
      variant: "danger",
    },
  ];
}

export function DeactivateSchoolDialog({
  visible,
  schoolName,
  status,
  onClose,
  onCancelRequest,
  onPause,
  onResume,
  onDeactivate,
}: Readonly<DeactivateSchoolDialogProps>) {
  const [choice, setChoice] = useState<ManageChoice | null>(null);
  const options = getOptionsForStatus(status);

  useEffect(() => {
    if (visible) {
      setChoice(options.length === 1 ? options[0].id : null);
    }
  }, [visible, status, options.length]);

  function handleSubmit() {
    if (choice === "pause") onPause();
    if (choice === "resume") onResume();
    if (choice === "deactive") onDeactivate();
    if (choice === "cancel") onCancelRequest();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityLabel="Close"
        />

        <View style={styles.dialog}>
          <View style={styles.header}>
            <Text style={styles.title}>Manage school</Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              android_ripple={ANDROID_RIPPLE}
              accessibilityLabel="Close"
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <SheetCloseIcon />
            </Pressable>
          </View>

          <Text style={styles.body}>
            {status === "pending"
              ? `Manage your join request for ${schoolName}.`
              : `Choose what to do with ${schoolName}. You can pause lessons for now, or deactivate and leave the school.`}
          </Text>

          {options.map((option) => (
            <OptionItem
              key={option.id}
              item={option}
              isSelected={choice === option.id}
              onSelect={() => setChoice(option.id)}
            />
          ))}

          <Pressable
            onPress={handleSubmit}
            disabled={!choice}
            android_ripple={ANDROID_RIPPLE}
            style={({ pressed }) => [
              styles.submitButton,
              !choice && styles.submitButtonDisabled,
              pressed && choice && styles.pressed,
            ]}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function OptionItem({
  item,
  isSelected,
  onSelect,
}: Readonly<{
  item: OptionConfig;
  isSelected: boolean;
  onSelect: () => void;
}>) {
  const isDanger = item.variant === "danger";

  return (
    <Pressable
      onPress={onSelect}
      android_ripple={ANDROID_RIPPLE}
      style={({ pressed }) => [
        styles.optionCard,
        isDanger && styles.optionCardDanger,
        isSelected && !isDanger && styles.optionCardSelected,
        isSelected && isDanger && styles.optionCardDangerSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.optionTitle,
          !isDanger && styles.optionTitlePause,
          isSelected && !isDanger && styles.optionTitlePauseSelected,
          isDanger && styles.optionTitleDanger,
        ]}
      >
        {item.title}
      </Text>
      <Text style={styles.optionBody}>{item.description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dialog: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.inputBackground,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  optionCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
    gap: 4,
    backgroundColor: colors.background,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: "#e8f1ff",
  },
  optionCardDanger: {
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
  },
  optionCardDangerSelected: {
    borderColor: colors.error,
    backgroundColor: "#fee2e2",
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  optionTitlePause: {
    color: "#ca8a04",
  },
  optionTitlePauseSelected: {
    color: "#a16207",
  },
  optionTitleDanger: {
    color: colors.error,
  },
  optionBody: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  submitButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
  pressed: {
    opacity: 0.88,
  },
});
