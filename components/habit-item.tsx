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
    backgroundColor: checkProgress.value === 1 ? palette.tint : 'transparent',
    borderColor: checkProgress.value === 1 ? palette.tint : palette.icon,
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
            backgroundColor: colorScheme === 'dark' ? '#1f2224' : '#f6f7f9',
            opacity: pressed ? 0.85 : 1,
          },
        ]}>
        <Animated.View style={[styles.checkbox, checkBoxStyle]}>
          {checked && <MaterialIcons name="check" size={18} color="#fff" />}
        </Animated.View>

        <View style={styles.body}>
          <ThemedText type="defaultSemiBold" style={checked ? styles.doneText : undefined}>
            {habit.emoji} {habit.name}
          </ThemedText>
          <ThemedText style={[styles.subText, { color: palette.icon }]}>
            {checked ? '오늘 완료!' : '길게 눌러 수정'}
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
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    gap: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  subText: {
    fontSize: 12,
    marginTop: 2,
  },
  doneText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
});
