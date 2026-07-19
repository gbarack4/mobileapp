import Svg, { Circle, Line, Path, Rect } from "react-native-svg";

import { colors } from "../../constants/theme";

type IconProps = {
  size?: number;
  color?: string;
};

export function ClockIcon({
  size = 14,
  color = colors.textMuted,
}: Readonly<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.75" />
      <Path
        d="M12 8v4l2.5 2.5"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function CopyIcon({
  size = 16,
  color = colors.primary,
}: Readonly<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="8"
        y="8"
        width="11"
        height="11"
        rx="2"
        stroke={color}
        strokeWidth="1.75"
      />
      <Path
        d="M6 16V6a2 2 0 012-2h10"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function TrashIcon({
  size = 18,
  color = "#ef4444",
}: Readonly<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7h16M9 7V5h6v2M10 11v5M14 11v5M7 7l1 12h8l1-12"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CheckIcon({
  size = 18,
  color = colors.white,
}: Readonly<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12.5l4.5 4.5L19 7"
        stroke={color}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function MapLayersIcon({
  size = 14,
  color = colors.white,
}: Readonly<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7l8-4 8 4-8 4-8-4z"
        stroke={color}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <Path
        d="M4 12l8 4 8-4"
        stroke={color}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <Path
        d="M4 17l8 4 8-4"
        stroke={color}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function LightningIcon({
  size = 18,
  color = "#f59e0b",
}: Readonly<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"
        stroke={color}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function LocationPinSmallIcon({
  size = 14,
  color = colors.primary,
}: Readonly<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21s6-4.5 6-10a6 6 0 10-12 0c0 5.5 6 10 6 10z"
        stroke={color}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="11" r="2" stroke={color} strokeWidth="1.75" />
    </Svg>
  );
}

export function CloseSmallIcon({
  size = 14,
  color = colors.primary,
}: Readonly<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line
        x1="7"
        y1="7"
        x2="17"
        y2="17"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Line
        x1="17"
        y1="7"
        x2="7"
        y2="17"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}
