import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

const USE_NATIVE_DRIVER = Platform.OS !== "web";
const PIECE_COUNT = 36;
const COLORS = [
  "#005eff",
  "#22c55e",
  "#f59e0b",
  "#38bdf8",
  "#fb7185",
  "#a78bfa",
  "#fbbf24",
];

type Piece = {
  left: `${number}%`;
  width: number;
  height: number;
  color: string;
  radius: number;
  delay: number;
  duration: number;
  sway: number;
  spin: number;
};

function seeded(index: number, salt: number) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function createPieces(): Piece[] {
  return Array.from({ length: PIECE_COUNT }, (_, index) => {
    const tall = seeded(index, 2) > 0.55;
    const round = seeded(index, 3) > 0.72;
    const width = round ? 8 : 6 + seeded(index, 4) * 6;
    const height = round ? width : tall ? width * 1.8 : width * 0.7;

    return {
      left: `${seeded(index, 1) * 100}%`,
      width,
      height,
      color: COLORS[index % COLORS.length],
      radius: round ? width / 2 : 2,
      delay: seeded(index, 5) * 700,
      duration: 2200 + seeded(index, 6) * 1600,
      sway: 12 + seeded(index, 7) * 28,
      spin: (seeded(index, 8) > 0.5 ? 1 : -1) * (220 + seeded(index, 9) * 420),
    };
  });
}

export function CongratulationsPieces() {
  const { height } = useWindowDimensions();
  const pieces = useMemo(() => createPieces(), []);
  const progress = useRef(pieces.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animation = Animated.parallel(
      pieces.map((piece, index) =>
        Animated.timing(progress[index], {
          toValue: 1,
          duration: piece.duration,
          delay: piece.delay,
          easing: Easing.in(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [pieces, progress]);

  return (
    <View pointerEvents="none" style={styles.layer}>
      {pieces.map((piece, index) => (
        <Animated.View
          key={`${piece.left}-${piece.color}-${index}`}
          style={[
            styles.piece,
            {
              left: piece.left,
              width: piece.width,
              height: piece.height,
              backgroundColor: piece.color,
              borderRadius: piece.radius,
              opacity: progress[index].interpolate({
                inputRange: [0, 0.08, 0.72, 1],
                outputRange: [0, 1, 1, 0],
              }),
              transform: [
                {
                  translateY: progress[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [-36, height + 40],
                  }),
                },
                {
                  translateX: progress[index].interpolate({
                    inputRange: [0, 0.22, 0.48, 0.74, 1],
                    outputRange: [
                      0,
                      piece.sway,
                      -piece.sway,
                      piece.sway * 0.55,
                      0,
                    ],
                  }),
                },
                {
                  rotate: progress[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", `${piece.spin}deg`],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  piece: {
    position: "absolute",
    top: 0,
    marginLeft: -4,
  },
});
