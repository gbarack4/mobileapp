import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

type ButtonSpinnerProps = Readonly<{
  inverse?: boolean;
  className?: string;
}>;

export function ButtonSpinner({ inverse = false }: ButtonSpinnerProps) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    animation.start();
    return () => animation.stop();
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
      style={[
        styles.spinner,
        inverse ? styles.spinnerInverse : styles.spinnerDefault,
        { transform: [{ rotate }] },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  spinner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  spinnerDefault: {
    borderColor: '#cbd5e1',
    borderTopColor: '#0f172a',
  },
  spinnerInverse: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: '#ffffff',
  },
});
