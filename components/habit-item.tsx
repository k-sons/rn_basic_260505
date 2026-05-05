import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
// todayKey 함수와 Habit 타입을 '@/types/habit'에서 가져옵니다.
import { todayKey, type Habit } from '@/types/habit';

type Props = {
  habit: Habit;
  onToggle: (id: string) => void;
  onEdit: (habit: Habit) => void;
};

export function HabitItem({ habit, onToggle, onEdit }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const checked = !!habit.history[todayKey()];

  const scale = useSharedValue(1);
  const checkProgress = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    checkProgress.value = withTiming(checked ? 1 : 0, { duration: 200 });
  }, [checked, checkProgress]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkBoxStyle = useAnimatedStyle(() => ({
    backgroundColor: checkProgress.value === 1 ? palette.success : 'transparent',
    borderColor: checkProgress.value === 1 ? palette.success : palette.icon,
    transform: [{ scale: 0.9 + checkProgress.value * 0.1 }],
  }));

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(
        checked ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
      );
    }
    scale.value = withSequence(
      withTiming(0.96, { duration: 80 }),
      withSpring(1, { damping: 8, stiffness: 180 })
    );
    onToggle(habit.id);
  };

  return (
    <Animated.View style={cardStyle}>
      <Pressable
        onPress={handlePress}
        onLongPress={() => onEdit(habit)}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: checked ? palette.successSoft : palette.surface,
            borderColor: checked ? palette.success : palette.border,
            opacity: pressed ? 0.9 : 1,
          },
        ]}>
        <Animated.View style={[styles.checkbox, checkBoxStyle]}>
          {checked && <MaterialIcons name="check" size={18} color="#fff" />}
        </Animated.View>

        <View style={styles.body}>
          <ThemedText
            type="defaultSemiBold"
            style={[styles.title, checked && styles.doneText]}>
            {habit.emoji}  {habit.name}
          </ThemedText>
          <ThemedText
            style={[
              styles.subText,
              { color: checked ? palette.success : palette.icon },
            ]}>
            {checked ? '오늘 완료!' : '탭하여 체크 · 길게 눌러 수정'}
          </ThemedText>
        </View>

        <MaterialIcons name="chevron-right" size={22} color={palette.icon} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 14,
    borderWidth: 1,
    elevation: 1,
  },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 16,
  },
  subText: {
    fontSize: 12,
    marginTop: 3,
  },
  doneText: {
    textDecorationLine: 'line-through',
    opacity: 0.55,
  },
});
