import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SectionList,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookmarkItem } from '@/components/bookmark-item';
import { CategoryChip } from '@/components/category-chip';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useBookmarkStore } from '@/store/bookmark-store';
import type { Bookmark } from '@/types/bookmark';

type SortMode = 'newest' | 'oldest' | 'title' | 'category';

const MAX_RECENT_OPENED = 10;

const SORT_OPTIONS: { label: string; value: SortMode }[] = [
  { label: '최신순', value: 'newest' },
  { label: '오래된순', value: 'oldest' },
  { label: '제목순', value: 'title' },
  { label: '카테고리순', value: 'category' },
];

export default function BookmarksScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const tint = Colors[colorScheme].tint;

  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const categories = useBookmarkStore((s) => s.categories);
  const hasHydrated = useBookmarkStore((s) => s.hasHydrated);
  const hydrate = useBookmarkStore((s) => s.hydrate);

  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('newest');

  useEffect(() => {
    if (!hasHydrated) {
      hydrate();
    }
  }, [hasHydrated, hydrate]);

  const matchedBookmarks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookmarks.filter((b) => {
      if (selectedCat && b.categoryId !== selectedCat) return false;
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q)
      );
    });
  }, [bookmarks, query, selectedCat]);

  const categoryNameById = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  /** 최근 열어본: 열린 적 있는 항목만, lastOpenedAt 기준 내림차순(동시각이면 제목). 고정 여부보다 ‘최근’이 우선. */
  const recentOpened = useMemo(() => {
    return [...matchedBookmarks]
      .filter((b) => typeof b.lastOpenedAt === 'number')
      .sort((a, b) => {
        const dt = (b.lastOpenedAt ?? 0) - (a.lastOpenedAt ?? 0);
        if (dt !== 0) return dt;
        return a.title.localeCompare(b.title, 'ko');
      })
      .slice(0, MAX_RECENT_OPENED);
  }, [matchedBookmarks]);

  const recentOpenedIds = useMemo(
    () => new Set(recentOpened.map((b) => b.id)),
    [recentOpened]
  );

  /** 전체 목록: 최근 구역에 올린 id는 빼서 중복 방지. 정렬은 기존대로 고정 → 선택 정렬 */
  const mainBookmarks = useMemo(() => {
    const rest = matchedBookmarks.filter((b) => !recentOpenedIds.has(b.id));
    return [...rest].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      if (sortMode === 'oldest') return a.createdAt - b.createdAt;
      if (sortMode === 'title') return a.title.localeCompare(b.title, 'ko');
      if (sortMode === 'category') {
        const categoryCompare = (categoryNameById.get(a.categoryId) ?? '').localeCompare(
          categoryNameById.get(b.categoryId) ?? '',
          'ko'
        );
        return categoryCompare || a.title.localeCompare(b.title, 'ko');
      }
      return b.createdAt - a.createdAt;
    });
  }, [matchedBookmarks, categoryNameById, sortMode, recentOpenedIds]);

  const listSections = useMemo(() => {
    const sections: { title: string; data: Bookmark[] }[] = [];
    if (recentOpened.length > 0) {
      sections.push({ title: '최근 열어본', data: recentOpened });
    }
    if (recentOpened.length === 0 || mainBookmarks.length > 0) {
      sections.push({
        title: recentOpened.length > 0 ? '전체' : '',
        data: mainBookmarks,
      });
    }
    return sections;
  }, [recentOpened, mainBookmarks]);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const b of bookmarks) {
      m[b.categoryId] = (m[b.categoryId] ?? 0) + 1;
    }
    return m;
  }, [bookmarks]);

  if (!hasHydrated) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={styles.flex} edges={['bottom']}>
      <ThemedView style={styles.flex}>
        <View style={styles.header}>
          <View style={styles.searchBox}>
            <IconSymbol name="magnifyingglass" size={18} color="#888" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="제목 또는 URL 검색"
              placeholderTextColor="#888"
              style={[styles.searchInput, { color: Colors[colorScheme].text }]}
            />
          </View>
          <Pressable
            accessibilityLabel="북마크 추가"
            onPress={() => router.push('/add')}
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: tint, opacity: pressed ? 0.8 : 1 },
            ]}>
            <IconSymbol name="plus" size={22} color="#fff" />
          </Pressable>
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[null, ...categories]}
          keyExtractor={(c, idx) => (c ? c.id : `all-${idx}`)}
          contentContainerStyle={styles.chipRow}
          renderItem={({ item }) => (
            <CategoryChip
              category={item}
              count={item ? counts[item.id] ?? 0 : bookmarks.length}
              selected={item ? selectedCat === item.id : selectedCat === null}
              onPress={() => setSelectedCat(item ? item.id : null)}
            />
          )}
        />

        <View style={styles.sortRow}>
          {SORT_OPTIONS.map((option) => {
            const selected = sortMode === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setSortMode(option.value)}
                style={({ pressed }) => [
                  styles.sortBtn,
                  {
                    borderColor: selected ? tint : 'rgba(127,127,127,0.35)',
                    backgroundColor: selected ? tint : 'transparent',
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}>
                <ThemedText
                  style={[
                    styles.sortText,
                    { color: selected ? '#fff' : Colors[colorScheme].text },
                  ]}>
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <SectionList
          sections={listSections}
          keyExtractor={(b) => b.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section }) =>
            section.title ? (
              <View style={styles.sectionHeader}>
                <ThemedText type="subtitle">{section.title}</ThemedText>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <ThemedText type="subtitle">아직 북마크가 없어요</ThemedText>
              <ThemedText style={styles.emptyHint}>
                오른쪽 상단 + 버튼으로 첫 북마크를 추가해보세요.
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => (
            <BookmarkItem
              bookmark={item}
              category={categories.find((c) => c.id === item.categoryId)}
            />
          )}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(127,127,127,0.12)',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  sortBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  sortText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 24,
    flexGrow: 1,
  },
  sectionHeader: {
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: 'transparent',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyHint: {
    marginTop: 8,
    color: '#888',
    textAlign: 'center',
  },
});
