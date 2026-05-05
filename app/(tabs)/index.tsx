import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, AppState, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DiaryDayCard } from '@/components/diary-day-card';
import { SwipeableDiaryCard } from '@/components/swipeable-diary-card';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { addDaysToKey, parseDateKey, toDateKey } from '@/lib/date-key';
import { useDiaryStore } from '@/store/diary-store';

export default function DiaryHomeScreen() {
  const scheme = useColorScheme() ?? 'light';
  const tint = Colors[scheme].tint;
  const destructive = scheme === 'dark' ? '#ff8a80' : '#c62828';

  const hydrated = useDiaryStore((s) => s.hydrated);
  const hydrate = useDiaryStore((s) => s.hydrate);
  const entries = useDiaryStore((s) => s.entries);
  const removeEntry = useDiaryStore((s) => s.removeEntry);

  const [dateKey, setDateKey] = useState(() => toDateKey(new Date()));

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void hydrate();
      }
    });
    return () => sub.remove();
  }, [hydrate]);

  const entry = entries[dateKey];

  const dateLabel = useMemo(() => {
    const dt = parseDateKey(dateKey);
    if (!dt) return dateKey;
    return dt.toLocaleDateString('ko-KR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [dateKey]);

  const bumpDay = useCallback(
    (delta: number) => {
      if (Platform.OS !== 'web') {
        void Haptics.selectionAsync();
      }
      setDateKey((k) => addDaysToKey(k, delta));
    },
    [setDateKey],
  );

  const onSwipeLeft = useCallback(() => bumpDay(1), [bumpDay]);
  const onSwipeRight = useCallback(() => bumpDay(-1), [bumpDay]);

  const openEdit = useCallback(() => {
    router.push({ pathname: '/edit', params: { date: dateKey } });
  }, [dateKey]);

  const canDelete = Boolean(entry && (entry.memo.trim() || entry.imageUri.trim()));

  const confirmDeleteDay = useCallback(() => {
    if (!canDelete) return;
    Alert.alert('일기 삭제', '이 날짜의 저장된 일기를 삭제할까요? 되돌릴 수 없습니다.', [
      { text: '취소', style: 'cancel', onPress: () => {} },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            const result = await removeEntry(dateKey);
            if (!result.ok) {
              Alert.alert('삭제 실패', result.error.message ?? '잠시 후 다시 시도해 주세요.');
            }
          })();
        },
      },
    ]);
  }, [canDelete, dateKey, removeEntry]);

  if (!hydrated) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: Colors[scheme].background }]}>
        <View style={styles.center}>
          <ThemedText>불러오는 중…</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: Colors[scheme].background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          오늘의 한 장
        </ThemedText>
        <ThemedText style={[styles.headerSub, { color: Colors[scheme].icon }]}>
          카드를 좌우로 스와이프해 날짜를 바꿔 보세요.
        </ThemedText>
      </View>

      <SwipeableDiaryCard onSwipeLeft={onSwipeLeft} onSwipeRight={onSwipeRight}>
        <DiaryDayCard dateLabel={dateLabel} entry={entry} />
      </SwipeableDiaryCard>

      <View style={styles.footer}>
        <Pressable
          onPress={openEdit}
          style={({ pressed }) => [
            styles.primaryBtn,
            { backgroundColor: tint, opacity: pressed ? 0.85 : 1 },
          ]}>
          <ThemedText style={[styles.primaryBtnText, { color: scheme === 'dark' ? '#111' : '#fff' }]}>
            이 날짜 편집
          </ThemedText>
        </Pressable>

        {canDelete ? (
          <Pressable onPress={confirmDeleteDay} style={styles.deleteLink}>
            <ThemedText style={[styles.deleteLinkText, { color: destructive }]}>이 날 일기 삭제</ThemedText>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 6,
  },
  headerTitle: {
    fontSize: 26,
  },
  headerSub: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: '700',
  },
  deleteLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  deleteLinkText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
