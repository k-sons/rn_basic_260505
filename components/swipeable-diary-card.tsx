import { ReactNode } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const SWIPE_THRESHOLD = 64;

type Props = {
  children: ReactNode;
  /** 손가락을 왼쪽으로 밀었을 때 (다음 날) */
  onSwipeLeft: () => void;
  /** 손가락을 오른쪽으로 밀었을 때 (이전 날) */
  onSwipeRight: () => void;
};

export function SwipeableDiaryCard({ children, onSwipeLeft, onSwipeRight }: Props) {
  const tx = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
    opacity: interpolate(Math.abs(tx.value), [0, 140], [1, 0.88], Extrapolation.CLAMP),
  }));

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-24, 24])
    .onUpdate((e) => {
      tx.value = e.translationX * 0.9;
    })
    .onEnd((e) => {
      if (e.translationX <= -SWIPE_THRESHOLD) {
        runOnJS(onSwipeLeft)();
      } else if (e.translationX >= SWIPE_THRESHOLD) {
        runOnJS(onSwipeRight)();
      }
      tx.value = withSpring(0);
    });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[{ flex: 1, justifyContent: 'flex-start', paddingTop: 8 }, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
