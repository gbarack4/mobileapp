import Svg, { Circle, Path, Rect } from "react-native-svg";

import { colors } from "../../constants/theme";

type IconProps = {
  size?: number;
  color?: string;
};

export function VehiclesIcon({
  size = 22,
  color = colors.text,
}: Readonly<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={color}>
      <Path d="M160-120q-17 0-28.5-11.5T120-160v-320l84-240q6-18 21.5-29t34.5-11h223q-2 10-2.5 19.5T480-720q0 11 .5 20.5T483-680H274l-42 120h309q33 37 79 58.5T720-480H200v200h560v-204q21-4 41-11t39-18v353q0 17-11.5 28.5T800-120h-40q-17 0-28.5-11.5T720-160v-40H240v40q0 17-11.5 28.5T200-120h-40Zm533-440-11-47q-11-4-21.5-10T641-631l-46 15-27-46 35-34q-2-12-2-24t2-24l-35-32 27-46 45 13q9-8 19.5-14t22.5-10l11-47h53l12 46q12 5 22.5 11t19.5 14l45-13 27 46-34 32q2 12 2.5 24.5T838-695l34 32-26 46-46-14q-9 8-20 14t-22 10l-12 47h-53Zm69.5-117.5Q780-695 780-720t-17.5-42.5Q745-780 720-780t-42.5 17.5Q660-745 660-720t17.5 42.5Q695-660 720-660t42.5-17.5ZM200-480v200-200Zm100 160q25 0 42.5-17.5T360-380q0-25-17.5-42.5T300-440q-25 0-42.5 17.5T240-380q0 25 17.5 42.5T300-320Zm360 0q25 0 42.5-17.5T720-380q0-25-17.5-42.5T660-440q-25 0-42.5 17.5T600-380q0 25 17.5 42.5T660-320Z" />
    </Svg>
  );
}

export function DocumentsIcon({
  size = 22,
  color = colors.text,
}: Readonly<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 4h7l5 5v11a1 1 0 01-1 1H8a1 1 0 01-1-1V5a1 1 0 011-1z"
        stroke={color}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <Path
        d="M15 4v5h5"
        stroke={color}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PaymentIcon({
  size = 22,
  color = colors.text,
}: Readonly<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="6"
        width="18"
        height="12"
        rx="2"
        stroke={color}
        strokeWidth="1.75"
      />
      <Path d="M3 10h18" stroke={color} strokeWidth="1.75" />
      <Path
        d="M7 15h3"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function AvailabilityIcon({
  size = 22,
  color = colors.text,
}: Readonly<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
        stroke={color}
        strokeWidth="1.75"
      />
      <Path
        d="M3 9h18M8 3v4M16 3v4"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function ManageAccountIcon({
  size = 22,
  color = colors.text,
}: Readonly<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.75" />
      <Path
        d="M5 20c0-3.314 3.134-6 7-6s7 2.686 7 6"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function EditAddressIcon({
  size = 22,
  color = colors.text,
}: Readonly<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.75" />
      <Path
        d="M12 8v5M12 16h.01"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function InsuranceIcon({
  size = 22,
  color = colors.text,
}: Readonly<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V7l8-4z"
        stroke={color}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PrivacyIcon({
  size = 22,
  color = colors.text,
}: Readonly<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2"
        stroke={color}
        strokeWidth="1.75"
      />
      <Path
        d="M8 11V8a4 4 0 118 0v3"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function AppSettingsIcon({
  size = 22,
  color = colors.text,
}: Readonly<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.75" />
      <Path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function AboutIcon({
  size = 22,
  color = colors.text,
}: Readonly<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.75" />
      <Path
        d="M12 8v5M12 16h.01"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}
