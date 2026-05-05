import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Alert, Pressable, Share, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useBookmarkStore } from '@/store/bookmark-store';
import { Bookmark, Category } from '@/types/bookmark';
import { extractDomain, getFaviconUrl, normalizeUrl } from '@/utils/favicon';

type BookmarkItemProps = {
  bookmark: Bookmark;
  category?: Category;
};

async function openInApp(url: string) {
  try {
    await WebBrowser.openBrowserAsync(url, { showTitle: true });
  } catch (e) {
    console.warn('[bookmark] in-app open failed', e);
    await Linking.openURL(url).catch(() => {});
  }
}

async function openExternal(url: string) {
  try {
    await Linking.openURL(url);
  } catch (e) {
    console.warn('[bookmark] external open failed', e);
  }
}

async function shareBookmark(title: string, url: string) {
  try {
    await Share.share({
      title,
      message: `${title}\n${url}`,
      url,
    });
  } catch (e) {
    console.warn('[bookmark] share failed', e);
    Alert.alert('공유 실패', '이 환경에서는 공유를 실행할 수 없습니다.');
  }
}

export function BookmarkItem({ bookmark, category }: BookmarkItemProps) {
  const router = useRouter();
  const removeBookmark = useBookmarkStore((s) => s.removeBookmark);
  const toggleBookmarkPin = useBookmarkStore((s) => s.toggleBookmarkPin);
  const markBookmarkOpened = useBookmarkStore((s) => s.markBookmarkOpened);

  const url = normalizeUrl(bookmark.url);
  const domain = extractDomain(url) ?? bookmark.url;
  const thumbnail = bookmark.thumbnailUrl?.trim() || getFaviconUrl(url) || undefined;
  const tint = category?.color ?? '#888';
  const pinColor = bookmark.isPinned ? '#f39c12' : '#888';
  const shareTitle = bookmark.title || domain;

  const handlePress = () => {
    markBookmarkOpened(bookmark.id);
    openInApp(url);
  };

  const handleOpenDetail = () => {
    router.push({ pathname: '/bookmark/[id]', params: { id: bookmark.id } });
  };

  const handleLongPress = () => {
    Alert.alert(shareTitle, '동작을 선택하세요', [
      { text: '상세 보기', onPress: handleOpenDetail },
      {
        text: bookmark.isPinned ? '고정 해제' : '상단 고정',
        onPress: () => toggleBookmarkPin(bookmark.id),
      },
      {
        text: '외부 브라우저로 열기',
        onPress: () => {
          markBookmarkOpened(bookmark.id);
          openExternal(url);
        },
      },
      { text: '공유', onPress: () => shareBookmark(shareTitle, url) },
      { text: '편집', onPress: () => router.push({ pathname: '/add', params: { id: bookmark.id } }) },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          Alert.alert('삭제 확인', '이 북마크를 삭제할까요?', [
            { text: '취소', style: 'cancel' },
            { text: '삭제', style: 'destructive', onPress: () => removeBookmark(bookmark.id) },
          ]);
        },
      },
      { text: '취소', style: 'cancel' },
    ]);
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.85 : 1 }]}>
      <View style={[styles.thumbWrap, { borderColor: tint }]}>
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={styles.thumb} contentFit="cover" />
        ) : (
          <View style={[styles.thumbFallback, { backgroundColor: tint }]}>
            <ThemedText style={styles.thumbLetter}>
              {(bookmark.title || domain).slice(0, 1).toUpperCase()}
            </ThemedText>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <ThemedText type="defaultSemiBold" numberOfLines={1}>
          {bookmark.isPinned ? '★ ' : ''}
          {bookmark.title || domain}
        </ThemedText>
        <ThemedText style={styles.domain} numberOfLines={1}>
          {domain}
        </ThemedText>
        {category ? (
          <View style={styles.catRow}>
            <View style={[styles.catDot, { backgroundColor: tint }]} />
            <ThemedText style={[styles.catName, { color: tint }]}>{category.name}</ThemedText>
          </View>
        ) : null}
        {(bookmark.tags?.length ?? 0) > 0 ? (
          <View style={styles.tagRow}>
            {(bookmark.tags ?? []).slice(0, 2).map((t) => (
              <View key={`${bookmark.id}-${t}`} style={styles.tagMini}>
                <ThemedText style={styles.tagMiniText} numberOfLines={1}>
                  {t}
                </ThemedText>
              </View>
            ))}
            {(bookmark.tags?.length ?? 0) > 2 ? (
              <ThemedText style={styles.tagMoreText}>
                +{(bookmark.tags?.length ?? 0) - 2}
              </ThemedText>
            ) : null}
          </View>
        ) : null}
      </View>

      <Pressable
        accessibilityLabel="상세 보기"
        onPress={(e) => {
          e.stopPropagation();
          handleOpenDetail();
        }}
        style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.65 : 1 }]}>
        <IconSymbol name="info.circle" size={22} color="#888" />
      </Pressable>

      <Pressable
        accessibilityLabel={bookmark.isPinned ? '고정 해제' : '상단 고정'}
        onPress={(event) => {
          event.stopPropagation();
          toggleBookmarkPin(bookmark.id);
        }}
        style={({ pressed }) => [styles.pinBtn, { opacity: pressed ? 0.6 : 1 }]}>
        <IconSymbol name={bookmark.isPinned ? 'star.fill' : 'star'} size={22} color={pinColor} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(127,127,127,0.08)',
    marginBottom: 8,
  },
  thumbWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: '#fff',
  },
  thumb: { width: '100%', height: '100%' },
  thumbFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbLetter: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  body: { flex: 1, minWidth: 0 },
  domain: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  catDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  catName: {
    fontSize: 11,
    fontWeight: '600',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  tagMini: {
    maxWidth: '46%',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(127,127,127,0.12)',
  },
  tagMiniText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  tagMoreText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#888',
  },
  iconBtn: {
    padding: 6,
  },
  pinBtn: {
    padding: 6,
  },
});
