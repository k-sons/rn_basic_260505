import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Celebration } from '@/components/celebration';
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

  const [celebrate, setCelebrate] = useState(false);
  const prevProgress = useRef(0);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const todayDoneCount = useMemo(() => {
    const key = todayKey();
    return habits.filter((h) => h.history[key]).length;
  }, [habits]);

  const total = habits.length;
  const progress = total === 0 ? 0 : Math.round((todayDoneCount / total) * 100);

  useEffect(() => {
    if (progress === 100 && prevProgress.current < 100 && total > 0) {
      setCelebrate(true);
    }
    prevProgress.current = progress;
  }, [progress, total]);

  const handleEdit = (habit: Habit) => {
    router.push({ pathname: '/modal', params: { id: habit.id } });
  };

  const handleAdd = () => {
    router.push('/modal');
  };

  const isAllDone = total > 0 && progress === 100;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <ThemedText type="title">오늘의 습관</ThemedText>
            <ThemedText style={[styles.headerSub, { color: palette.icon }]}>
              {total === 0
                ? '아직 습관이 없어요. 추가해보세요!'
                : isAllDone
                  ? `🎉 오늘 ${total}개 모두 완료!`
                  : `${todayDoneCount} / ${total} 완료 · ${progress}%`}
            </ThemedText>
          </View>
          <Pressable
            onPress={handleAdd}
            style={({ pressed }) => [
              styles.addBtn,
              {
                backgroundColor: palette.tint,
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <MaterialIcons name="add" size={24} color="#fff" />
          </Pressable>
        </View>

        <View style={[styles.progressTrack, { backgroundColor: palette.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,
                backgroundColor: isAllDone ? palette.success : palette.tint,
              },
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
              <View
                style={[
                  styles.emptyIconWrap,
                  { backgroundColor: palette.surfaceAlt },
                ]}>
                <ThemedText style={styles.emptyEmoji}>🌱</ThemedText>
              </View>
              <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
                작은 습관이 큰 변화를 만듭니다
              </ThemedText>
              <ThemedText style={[styles.emptyText, { color: palette.icon }]}>
                오른쪽 위 + 버튼을 눌러 첫 습관을 추가해보세요
              </ThemedText>
              <Pressable
                onPress={handleAdd}
                style={({ pressed }) => [
                  styles.emptyCta,
                  { backgroundColor: palette.tint, opacity: pressed ? 0.85 : 1 },
                ]}>
                <MaterialIcons name="add" size={18} color="#fff" />
                <ThemedText style={styles.emptyCtaText}>습관 추가하기</ThemedText>
              </Pressable>
            </View>
          }
        />
      </SafeAreaView>

      <Celebration visible={celebrate} onDone={() => setCelebrate(false)} />
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
    paddingTop: 60,
    gap: 10,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyEmoji: {
    fontSize: 48,
    lineHeight: 56,
  },
  emptyTitle: {
    fontSize: 16,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  emptyCta: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyCtaText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
