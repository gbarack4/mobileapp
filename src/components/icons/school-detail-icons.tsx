import Svg, { Path } from 'react-native-svg';

import { colors } from '../../constants/theme';

type IconProps = {
  size?: number;
  color?: string;
};

export function VerifiedBadgeIcon({ size = 18, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l2.39 1.22 2.67-.39 1.22 2.39 2.39 1.22-.39 2.67 1.22 2.39-2.39 1.22-.39 2.67-2.39 1.22-2.67-.39L12 22l-2.39-1.22-2.67.39-1.22-2.39-2.39-1.22.39-2.67L1.72 12l2.39-1.22.39-2.67 2.39-1.22 1.22-2.39 2.67.39L12 2z"
        fill={color}
      />
      <Path
        d="M9 12.2l1.8 1.8 4.2-4.4"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ContactPhoneIcon({ size = 18, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.5 4h3l1.2 4.2-2 1.2a12.5 12.5 0 005.1 5.1l1.2-2 4.2 1.2v3A2 2 0 0116.2 20C9.9 20 4 14.1 4 7.8 4 6.3 5.1 5.2 6.5 4z"
        stroke={color}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ContactEmailIcon({ size = 18, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7.5l8 5 8-5"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 7.5V17a1 1 0 001 1h14a1 1 0 001-1V7.5"
        stroke={color}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ContactGlobeIcon({ size = 18, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21a9 9 0 100-18 9 9 0 000 18z"
        stroke={color}
        strokeWidth="1.75"
      />
      <Path d="M3 12h18M12 3c2.5 2.7 4 6 4 9s-1.5 6.3-4 9M12 3c-2.5 2.7-4 6-4 9s1.5 6.3 4 9" stroke={color} strokeWidth="1.75" />
    </Svg>
  );
}

export function ContactLocationIcon({ size = 18, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10z"
        stroke={color}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <Path d="M12 11.5a2 2 0 100-4 2 2 0 000 4z" stroke={color} strokeWidth="1.75" />
    </Svg>
  );
}
