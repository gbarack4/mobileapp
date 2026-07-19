import Svg, { Circle, Path } from "react-native-svg";

import { colors } from "../../constants/theme";

type IconProps = {
  size?: number;
  color?: string;
};

export function InfoCircleIcon({
  size = 20,
  color = colors.textMuted,
}: Readonly<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.75" />
      <Path
        d="M12 10v6"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <Circle cx="12" cy="7.5" r="1" fill={color} />
    </Svg>
  );
}

export function PlusCircleIcon({
  size = 24,
  color = colors.textMuted,
}: Readonly<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.75" />
      <Path
        d="M12 8v8M8 12h8"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function CheckCircleIcon({
  size = 24,
  color = colors.primary,
}: Readonly<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill={color} />
      <Path
        d="M8 12.2l2.4 2.4L16 9.2"
        stroke={colors.white}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
