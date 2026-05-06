import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { parseDateKey } from '@/lib/date-key';
import { useDiaryStore } from '@/store/diary-store';
import type { DiaryEntry } from '@/types/diary';

type EntryItem = {
  dateKey: string;
  entry: DiaryEntry;
};

function formatDateLabel(dateKey: string): string {
  const dt = parseDateKey(dateKey);
  if (!dt) return dateKey;
  return dt.toLocaleDateString('ko-KR', {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function DiaryEntriesScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const hydrate = useDiaryStore((s) => s.hydrate);
  const entries = useDiaryStore((s) => s.entries);

  useFocusEffect(
    useCallback(() => {
      void hydrate();
    }, [hydrate]),
  );

  const items = useMemo<EntryItem[]>(() => {
    return Object.entries(entries)
      .filter(([, entry]) => entry.memo.trim() || entry.imageUri.trim())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateKey, entry]) => ({ dateKey, entry }));
  }, [entries]);

  const openDate = useCallback((dateKey: string) => {
    router.push({ pathname: '/', params: { date: dateKey } });
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          작성한 날
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: palette.icon }]}>
          저장된 일기를 눌러 해당 날짜 카드로 이동할 수 있어요.
        </ThemedText>
        <Pressable
          accessibilityHint="저장된 일기를 JSON으로 내보내거나 백업 JSON에서 복원합니다."
          accessibilityLabel="일기 백업과 복원 화면 열기"
          accessibilityRole="button"
          onPress={() => router.push('/backup')}
          style={({ pressed }) => [
            styles.backupButton,
            {
              borderColor: palette.tint,
              opacity: pressed ? 0.78 : 1,
            },
          ]}>
          <ThemedText type="defaultSemiBold" style={{ color: palette.tint }}>
            백업·복원
          </ThemedText>
        </Pressable>
      </View>

      <FlatList
        contentContainerStyle={[styles.list, items.length === 0 ? styles.emptyList : null]}
        data={items}
        keyExtractor={(item) => item.dateKey}
        ListEmptyComponent={
          <View style={[styles.emptyCard, { borderColor: scheme === 'dark' ? '#2c3238' : '#dde3e8' }]}>
            <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
              아직 저장된 일기가 없어요
            </ThemedText>
            <ThemedText style={[styles.emptyHint, { color: palette.icon }]}>
              일기 탭에서 사진과 메모를 저장하면 여기에 날짜별로 모입니다.
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => {
          const hasImage = Boolean(item.entry.imageUri.trim());
          const previewText = item.entry.memo.trim() || '사진만 저장된 일기';
          return (
            <Pressable
              accessibilityHint="일기 탭으로 이동해 선택한 날짜의 카드를 보여줍니다."
              accessibilityLabel={`${formatDateLabel(item.dateKey)} 일기로 이동`}
              accessibilityRole="button"
              onPress={() => openDate(item.dateKey)}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: scheme === 'dark' ? '#1e2326' : '#f4f6f8',
                  borderColor: scheme === 'dark' ? '#2c3238' : '#dde3e8',
                  opacity: pressed ? 0.82 : 1,
                },
              ]}>
              <View style={[styles.thumb, { backgroundColor: scheme === 'dark' ? '#121518' : '#e8ecf0' }]}>
                {hasImage ? (
                  <Image
                    accessibilityLabel={`${formatDateLabel(item.dateKey)} 일기 사진`}
                    source={{ uri: item.entry.imageUri }}
                    style={styles.thumbImage}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <ThemedText style={[styles.thumbText, { color: palette.icon }]}>메모</ThemedText>
                )}
              </View>
              <View style={styles.rowBody}>
                <ThemedText type="defaultSemiBold">{formatDateLabel(item.dateKey)}</ThemedText>
                <ThemedText numberOfLines={2} style={[styles.preview, { color: palette.icon }]}>
                  {previewText}
                </ThemedText>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 6,
  },
  title: {
    fontSize: 26,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  backupButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginTop: 6,
    justifyContent: 'center',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptyHint: {
    textAlign: 'center',
    lineHeight: 20,
  },
  row: {
    minHeight: 96,
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbText: {
    fontSize: 13,
    fontWeight: '700',
  },
  rowBody: {
    flex: 1,
    gap: 6,
  },
  preview: {
    fontSize: 14,
    lineHeight: 20,
  },
});
