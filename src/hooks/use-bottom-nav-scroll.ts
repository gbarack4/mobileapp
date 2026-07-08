import { useCallback, useRef } from 'react';
import { Animated, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

const HIDE_OFFSET = 150;
const HIDE_ACCUMULATED = 6;
const SHOW_ACCUMULATED = 4;
const TOP_SNAP_OFFSET = 4;

export function useBottomNavScroll() {
  const translateY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const accumulatedDelta = useRef(0);
  const isHiddenRef = useRef(false);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const animateTo = useCallback(
    (toValue: number) => {
      animationRef.current?.stop();
      animationRef.current = Animated.spring(translateY, {
        toValue,
        useNativeDriver: true,
        tension: 380,
        friction: 26,
        overshootClamping: true,
      });
      animationRef.current.start();
    },
    [translateY],
  );

  const setNavHidden = useCallback(
    (hidden: boolean) => {
      if (isHiddenRef.current === hidden) {
        return;
      }

      isHiddenRef.current = hidden;
      animateTo(hidden ? HIDE_OFFSET : 0);
    },
    [animateTo],
  );

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentY = event.nativeEvent.contentOffset.y;
      const diff = currentY - lastScrollY.current;
      lastScrollY.current = currentY;

      if (currentY <= TOP_SNAP_OFFSET) {
        accumulatedDelta.current = 0;
        setNavHidden(false);
        return;
      }

      if (diff === 0) {
        return;
      }

      if (diff > 0) {
        accumulatedDelta.current =
          accumulatedDelta.current > 0 ? accumulatedDelta.current + diff : diff;

        if (accumulatedDelta.current >= HIDE_ACCUMULATED) {
          setNavHidden(true);
          accumulatedDelta.current = 0;
        }

        return;
      }

      accumulatedDelta.current =
        accumulatedDelta.current < 0 ? accumulatedDelta.current + diff : diff;

      if (accumulatedDelta.current <= -SHOW_ACCUMULATED) {
        setNavHidden(false);
        accumulatedDelta.current = 0;
      }
    },
    [setNavHidden],
  );

  const resetNav = useCallback(() => {
    animationRef.current?.stop();
    lastScrollY.current = 0;
    accumulatedDelta.current = 0;
    isHiddenRef.current = false;
    translateY.setValue(0);
  }, [translateY]);

  return { translateY, onScroll, resetNav };
}
