import { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  visible: boolean;
  onDone?: () => void;
};

const EMOJIS = ['🎉', '✨', '🌟', '🎊', '💜', '🥳', '🎈', '⭐'];
const PIECES = 16;
const DURATION = 1800;

export function Celebration({ visible, onDone }: Props) {
  const { width, height } = Dimensions.get('window');

  const pieces = useMemo(
    () =>
      Array.from({ length: PIECES }, (_, i) => ({
        id: i,
        emoji: EMOJIS[i % EMOJIS.length],
        startX: Math.random() * width,
        delay: Math.floor(Math.random() * 300),
        rotateDir: Math.random() > 0.5 ? 1 : -1,
        size: 22 + Math.random() * 14,
      })),
    [width]
  );

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => onDone?.(), DURATION + 350);
    return () => clearTimeout(t);
  }, [visible, onDone]);

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={[styles.overlay, { width, height }]}>
      {pieces.map((p) => (
        <Piece key={p.id} {...p} screenHeight={height} />
      ))}
    </View>
  );
}

type PieceProps = {
  emoji: string;
  startX: number;
  delay: number;
  rotateDir: number;
  size: number;
  screenHeight: number;
};

function Piece({ emoji, startX, delay, rotateDir, size, screenHeight }: PieceProps) {
  const translateY = useSharedValue(-40);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withTiming(screenHeight + 60, {
        duration: DURATION,
        easing: Easing.out(Easing.quad),
      })
    );
    rotate.value = withDelay(
      delay,
      withTiming(rotateDir * 540, { duration: DURATION })
    );
    opacity.value = withDelay(
      delay + DURATION - 400,
      withTiming(0, { duration: 400 })
    );
  }, [translateY, rotate, opacity, delay, rotateDir, screenHeight]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.piece, { left: startX }, animatedStyle]}>
      <Text style={{ fontSize: size }}>{emoji}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 999,
  },
  piece: {
    position: 'absolute',
    top: 0,
  },
});
