import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { getCategory } from '@/constants/categories';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCurrentStreak, todayKey, type Habit } from '@/types/habit';

type Props = {
  habit: Habit;
  onToggle: (id: string) => void;
  onEdit: (habit: Habit) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
};

export function HabitItem({
  habit,
  onToggle,
  onEdit,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const checked = !!habit.history[todayKey()];
  const currentStreak = getCurrentStreak(habit.history);
  const category = getCategory(habit.categoryId);

  const scale = useSharedValue(1);
  const checkProgress = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    checkProgress.value = withTiming(checked ? 1 : 0, { duration: 200 });
  }, [checked, checkProgress]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkBoxStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      checkProgress.value,
      [0, 1],
      ['rgba(0,0,0,0)', palette.success]
    ),
    borderColor: interpolateColor(
      checkProgress.value,
      [0, 1],
      [palette.icon, palette.success]
    ),
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
      <View
        style={[
          styles.card,
          {
            backgroundColor: checked ? palette.successSoft : palette.surface,
            borderColor: checked ? palette.success : palette.border,
          },
        ]}>
        <View style={[styles.accent, { backgroundColor: category.color }]} />
        <Pressable
          onPress={handlePress}
          onLongPress={() => onEdit(habit)}
          style={({ pressed }) => [styles.pressArea, { opacity: pressed ? 0.9 : 1 }]}>
          <Animated.View style={[styles.checkbox, checkBoxStyle]}>
            {checked && <MaterialIcons name="check" size={18} color="#fff" />}
          </Animated.View>

          <View style={styles.body}>
            <View style={styles.titleRow}>
              <ThemedText
                type="defaultSemiBold"
                style={[styles.title, checked && styles.doneText]}
                numberOfLines={1}>
                {habit.emoji}  {habit.name}
              </ThemedText>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: category.soft, borderColor: category.color },
                ]}>
                <ThemedText style={[styles.badgeText, { color: category.color }]}>
                  {category.label}
                </ThemedText>
              </View>
            </View>
            <ThemedText
              style={[
                styles.subText,
                { color: checked ? palette.success : palette.icon },
              ]}>
              {checked ? `${currentStreak}일째 연속 달성` : '탭 체크 · 길게 눌러 수정'}
            </ThemedText>
          </View>
        </Pressable>

        <View style={styles.moveCol}>
          <Pressable
            onPress={() => onMoveUp?.(habit.id)}
            disabled={!canMoveUp || !onMoveUp}
            hitSlop={6}
            style={({ pressed }) => [
              styles.moveBtn,
              {
                backgroundColor: palette.surfaceAlt,
                opacity: !canMoveUp ? 0.3 : pressed ? 0.6 : 1,
              },
            ]}>
            <MaterialIcons name="keyboard-arrow-up" size={20} color={palette.icon} />
          </Pressable>
          <Pressable
            onPress={() => onMoveDown?.(habit.id)}
            disabled={!canMoveDown || !onMoveDown}
            hitSlop={6}
            style={({ pressed }) => [
              styles.moveBtn,
              {
                backgroundColor: palette.surfaceAlt,
                opacity: !canMoveDown ? 0.3 : pressed ? 0.6 : 1,
              },
            ]}>
            <MaterialIcons name="keyboard-arrow-down" size={20} color={palette.icon} />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingLeft: 18,
    borderRadius: 16,
    marginBottom: 12,
    gap: 14,
    borderWidth: 1,
    elevation: 1,
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  pressArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  subText: {
    fontSize: 12,
    marginTop: 3,
  },
  doneText: {
    textDecorationLine: 'line-through',
    opacity: 0.55,
  },
  moveCol: {
    gap: 4,
  },
  moveBtn: {
    width: 32,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
