import Svg, { Path, Rect } from "react-native-svg";

type LogoProps = {
  size?: number;
};

export function Logo({ size = 64 }: Readonly<LogoProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <Rect width="40" height="40" rx="10" fill="#005eff" />
      <Rect x="7" y="11" width="3" height="18" rx="1" fill="white" />
      <Rect x="7" y="18.5" width="10" height="3" rx="1" fill="white" />
      <Rect x="14" y="11" width="3" height="18" rx="1" fill="white" />
      <Rect x="21" y="11" width="3" height="18" rx="1" fill="white" />
      <Path d="M24 11h5a4 4 0 010 8h-5z" fill="white" />
      <Path d="M24 19h5.5a4.5 4.5 0 010 9H24z" fill="white" />
    </Svg>
  );
}
