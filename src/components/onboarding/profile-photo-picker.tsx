import * as ImagePicker from "expo-image-picker";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, radius, spacing } from "../../constants/theme";

type ProfilePhotoPickerProps = {
  photoUri: string | null;
  photoName?: string | null;
  onSelect: (uri: string, fileName: string, mimeType?: string) => void;
  onRemove: () => void;
};

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 94, 255, 0.14)" } : undefined;

export function ProfilePhotoPicker({
  photoUri,
  photoName,
  onSelect,
  onRemove,
}: Readonly<ProfilePhotoPickerProps>) {
  async function handlePickPhoto() {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Sorry, we need camera roll permissions to upload a photo.",
        );
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];

      const uri = asset.uri;
      const fileName =
        asset.fileName || uri.split("/").pop() || "profile-photo.jpg";
      const mimeType = asset.mimeType || "image/jpeg";

      onSelect(uri, fileName, mimeType);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Profile photo</Text>
      <Text style={styles.hint}>
        A clear headshot helps schools recognise you. JPG or PNG, max 5 MB.
      </Text>

      <View style={styles.card}>
        <Pressable
          onPress={handlePickPhoto}
          android_ripple={ANDROID_RIPPLE}
          accessibilityLabel={
            photoUri ? "Change profile photo" : "Add profile photo"
          }
          style={({ pressed }) => [
            styles.previewButton,
            pressed && styles.pressed,
          ]}
        >
          <View
            style={[styles.photoCircle, photoUri && styles.photoCircleFilled]}
          >
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoImage} />
            ) : (
              <Text style={styles.photoPlaceholder}>+</Text>
            )}
          </View>

          <View style={styles.photoTextWrap}>
            <Text style={styles.photoTitle}>
              {photoUri ? "Photo added" : "Add profile photo"}
            </Text>
            <Text style={styles.photoSubtitle}>
              {photoName ??
                (photoUri ? "Tap to change" : "Tap to upload from your device")}
            </Text>
          </View>
        </Pressable>

        {photoUri ? (
          <View style={styles.actionsRow}>
            <Pressable
              onPress={handlePickPhoto}
              android_ripple={ANDROID_RIPPLE}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.actionButtonText}>Change photo</Text>
            </Pressable>
            <Pressable
              onPress={onRemove}
              android_ripple={ANDROID_RIPPLE}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    color: colors.text,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  photoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photoCircleFilled: {
    borderStyle: "solid",
    borderColor: colors.primary,
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    fontSize: 28,
    color: colors.primary,
    fontWeight: "600",
  },
  photoTextWrap: {
    flex: 1,
    gap: 4,
  },
  photoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  photoSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: "#ececec",
  },
  actionButton: {
    paddingVertical: spacing.xs,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.error,
  },
  pressed: {
    opacity: 0.85,
  },
});
