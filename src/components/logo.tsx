import { Image, View, type ImageStyle, type StyleProp } from "react-native";

import { colors } from "../constants/theme";

/** Full-bleed opaque blue icon — clipped to rounded corners in UI (no black fringe). */
const logoSource = require("../../assets/logo-opaque.png");

type LogoProps = {
  size?: number;
  /** Kept for call-site compatibility; both variants use the brand asset. */
  variant?: "default" | "inverse";
  style?: StyleProp<ImageStyle>;
};

export function Logo({ size = 64, style }: Readonly<LogoProps>) {
  const radius = size * 0.22;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        overflow: "hidden",
        backgroundColor: colors.primary,
      }}
    >
      <Image
        source={logoSource}
        accessibilityLabel="Instructor Hub"
        style={[{ width: size, height: size }, style]}
        resizeMode="cover"
      />
    </View>
  );
}
