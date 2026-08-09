import Svg, { Path, Rect } from "react-native-svg";

type LogoProps = {
  size?: number;
  /** `inverse` = white tile + blue mark for brand-blue backgrounds */
  variant?: "default" | "inverse";
};

export function Logo({
  size = 64,
  variant = "default",
}: Readonly<LogoProps>) {
  const tile = variant === "inverse" ? "#ffffff" : "#005eff";
  const mark = variant === "inverse" ? "#005eff" : "#ffffff";

  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <Rect width="40" height="40" rx="10" fill={tile} />
      <Rect x="7" y="11" width="3" height="18" rx="1" fill={mark} />
      <Rect x="7" y="18.5" width="10" height="3" rx="1" fill={mark} />
      <Rect x="14" y="11" width="3" height="18" rx="1" fill={mark} />
      <Rect x="21" y="11" width="3" height="18" rx="1" fill={mark} />
      <Path d="M24 11h5a4 4 0 010 8h-5z" fill={mark} />
      <Path d="M24 19h5.5a4.5 4.5 0 010 9H24z" fill={mark} />
    </Svg>
  );
}
