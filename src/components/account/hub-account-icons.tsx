import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '../../constants/theme';

type IconProps = {
  size?: number;
  color?: string;
};

export function HubPersonalInfoIcon({ size = 24, color = colors.text }: Readonly<IconProps>) {
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

export function HubSecurityIcon({ size = 24, color = colors.text }: Readonly<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V7l8-4z"
        stroke={color}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <Path
        d="M9.5 12.5l2 2 4-4"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function HubPrivacyIcon({ size = 24, color = colors.text }: Readonly<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="1.75" />
      <Path
        d="M8 11V8a4 4 0 118 0v3"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function HubCardIcon({ size = 22, color = colors.primary }: Readonly<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="6" width="18" height="12" rx="2" stroke={color} strokeWidth="1.75" />
      <Path d="M3 10h18" stroke={color} strokeWidth="1.75" />
      <Path d="M7 15h4" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
    </Svg>
  );
}

export function StarIcon({ size = 12, color = '#f59e0b' }: Readonly<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7-6.3-3.8L5.7 21.2l1.7-7L2 9.5l7.1-.6L12 2z" />
    </Svg>
  );
}
