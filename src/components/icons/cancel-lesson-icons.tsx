import Svg, { Path } from 'react-native-svg';

type IconProps = {
  size?: number;
  color?: string;
};

export function WarningIcon({ size = 18, color = '#ea580c' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3L2 21h20L12 3z"
        stroke={color}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <Path d="M12 9v5M12 17h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function SheetCloseIcon({ size = 20, color = '#9ca3af' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function InfoIcon({ size = 18, color = '#2563eb' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
        stroke={color}
        strokeWidth="1.75"
      />
      <Path d="M12 10v6M12 7h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}
