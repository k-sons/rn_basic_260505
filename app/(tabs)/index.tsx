import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HabitItem } from '@/components/habit-item';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHabitStore } from '@/store/habit-store';
import { todayKey, type Habit } from '@/types/habit';

export default function TodayScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const habits = useHabitStore((s) => s.habits);
  const hydrated = useHabitStore((s) => s.hydrated);
  const hydrate = useHabitStore((s) => s.hydrate);
  const toggleToday = useHabitStore((s) => s.toggleToday);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const todayDoneCount = useMemo(() => {
    const key = todayKey();
    return habits.filter((h) => h.history[key]).length;
  }, [habits]);

  const total = habits.length;
  const progress = total === 0 ? 0 : Math.round((todayDoneCount / total) * 100);

  const handleEdit = (habit: Habit) => {
    router.push({ pathname: '/modal', params: { id: habit.id } });
  };

  const handleAdd = () => {
    router.push('/modal');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <ThemedText type="title">오늘의 습관</ThemedText>
            <ThemedText style={[styles.headerSub, { color: palette.icon }]}>
              {total === 0
                ? '아직 습관이 없어요. 추가해보세요!'
                : `${todayDoneCount} / ${total} 완료 · ${progress}%`}
            </ThemedText>
          </View>
          <Pressable
            onPress={handleAdd}
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: palette.tint, opacity: pressed ? 0.85 : 1 },
            ]}>
            <MaterialIcons name="add" size={24} color="#fff" />
          </Pressable>
        </View>

        <View
          style={[
            styles.progressTrack,
            { backgroundColor: colorScheme === 'dark' ? '#2a2d2f' : '#e6e8eb' },
          ]}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%`, backgroundColor: palette.tint },
            ]}
          />
        </View>

        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <HabitItem habit={item} onToggle={toggleToday} onEdit={handleEdit} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="emoji-events" size={56} color={palette.icon} />
              <ThemedText style={[styles.emptyText, { color: palette.icon }]}>
                + 버튼으로 첫 습관을 추가하세요
              </ThemedText>
            </View>
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  headerSub: {
    marginTop: 4,
    fontSize: 13,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  list: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
});
