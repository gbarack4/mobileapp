import Svg, { Path } from 'react-native-svg';

type IconProps = {
  size?: number;
  color?: string;
};

export function FoldedMapIcon({ size = 16, color = '#0d5af2' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={color}>
      <Path d="M640-560v-126 126ZM174-132q-20 8-37-4.5T120-170v-560q0-13 7.5-23t20.5-15l212-72 240 84 186-72q20-8 37 4.5t17 33.5v337q-15-23-35.5-42T760-528v-204l-120 46v126q-21 0-41 3.5T560-546v-140l-160-56v523l-226 87Zm26-96 120-46v-468l-120 40v474Zm496.5-32q22.5-20 23.5-60 1-34-22.5-57T640-400q-34 0-57 23t-23 57q0 34 23 57t57 23q34 0 56.5-20ZM640-160q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 23-5.5 43.5T778-238l102 102-56 56-102-102q-18 11-38.5 16.5T640-160ZM320-742v468-468Z" />
    </Svg>
  );
}

export function MapCarIcon({ size = 20, color = '#111827' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={color}>
      <Path d="M240-200h56l23-64h304l23 64h56q17 0 28.5-11.5T720-240v-200q0-10-5.5-17.5T698-470l-90-300q-5-17-19.5-23.5T560-800H400q-14 0-28.5 6.5T352-770l-90 300q-16 5-21.5 12.5T240-440v200q0 17 11.5 28.5T280-200Zm40-120q33 0 56.5-23.5T360-400q0-33-23.5-56.5T280-480q-33 0-56.5 23.5T200-400q0 33 23.5 56.5T280-320Zm400 0q33 0 56.5-23.5T760-400q0-33-23.5-56.5T680-480q-33 0-56.5 23.5T600-400q0 33 23.5 56.5T680-320ZM400-680h160l54 180H346l54-180Z" />
    </Svg>
  );
}

export function MapNavigateIcon({ size = 20, color = '#0d5af2' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={color}>
      <Path d="M480-120 280-320l56-58 104 104v-326h80v326l104-104 56 58-200 200Z" />
    </Svg>
  );
}

export function MapCompassIcon({ size = 22, color = '#111827' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path d="M12 8l-2.5 6.5L12 14l2.5.5L12 8z" fill={color} />
    </Svg>
  );
}
