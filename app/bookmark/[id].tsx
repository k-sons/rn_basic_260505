import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useMemo } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useBookmarkStore } from '@/store/bookmark-store';
import { extractDomain, getFaviconUrl, normalizeUrl } from '@/utils/favicon';

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

export default function BookmarkDetailScreen() {
  const router = useRouter();
  const rawId = useLocalSearchParams<{ id: string }>().id;
  const resolved = Array.isArray(rawId) ? rawId[0] : rawId;
  const id = typeof resolved === 'string' ? resolved : '';

  const colorScheme = useColorScheme() ?? 'light';
  const tint = Colors[colorScheme].tint;
  const textColor = Colors[colorScheme].text;

  const getBookmark = useBookmarkStore((s) => s.getBookmark);
  const categories = useBookmarkStore((s) => s.categories);
  const removeBookmark = useBookmarkStore((s) => s.removeBookmark);
  const toggleBookmarkPin = useBookmarkStore((s) => s.toggleBookmarkPin);
  const markBookmarkOpened = useBookmarkStore((s) => s.markBookmarkOpened);

  const bookmark = id ? getBookmark(id) : undefined;
  const category = bookmark
    ? categories.find((c) => c.id === bookmark.categoryId)
    : undefined;

  const url = useMemo(
    () => (bookmark ? normalizeUrl(bookmark.url) : ''),
    [bookmark]
  );
  const domain = bookmark ? extractDomain(url) ?? bookmark.url : '';
  const thumbnail = bookmark
    ? bookmark.thumbnailUrl?.trim() || getFaviconUrl(url) || undefined
    : undefined;
  const shareTitle = bookmark ? bookmark.title || domain : '';

  if (!bookmark) {
    return (
      <ThemedView style={styles.center}>
        <Stack.Screen options={{ title: '북마크' }} />
        <ThemedText>북마크를 찾을 수 없습니다.</ThemedText>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ThemedText style={{ color: tint }}>돌아가기</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const catColor = category?.color ?? '#888';

  const handleOpen = () => {
    markBookmarkOpened(bookmark.id);
    openInApp(url);
  };

  const handleExternal = () => {
    markBookmarkOpened(bookmark.id);
    openExternal(url);
  };

  const handleDelete = () => {
    Alert.alert('삭제 확인', '이 북마크를 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          removeBookmark(bookmark.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.flex} edges={['bottom']}>
      <Stack.Screen options={{ title: '상세' }} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">
        <ThemedView style={styles.hero}>
          <View style={[styles.thumbWrap, { borderColor: catColor }]}>
            {thumbnail ? (
              <Image
                source={{ uri: thumbnail }}
                style={styles.thumb}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.thumbFallback, { backgroundColor: catColor }]}>
                <ThemedText style={styles.thumbLetter}>
                  {(bookmark.title || domain).slice(0, 1).toUpperCase()}
                </ThemedText>
              </View>
            )}
          </View>
          <ThemedText type="title" style={styles.title}>
            {bookmark.isPinned ? '★ ' : ''}
            {bookmark.title || domain}
          </ThemedText>
          {category ? (
            <View style={styles.catRow}>
              <View style={[styles.catDot, { backgroundColor: catColor }]} />
              <ThemedText style={[styles.catName, { color: catColor }]}>
                {category.name}
              </ThemedText>
            </View>
          ) : null}
        </ThemedView>

        <View style={styles.block}>
          <ThemedText type="defaultSemiBold">URL</ThemedText>
          <ThemedText style={[styles.urlText, { color: textColor }]} selectable>
            {url}
          </ThemedText>
        </View>

        {(bookmark.tags?.length ?? 0) > 0 ? (
          <View style={styles.block}>
            <ThemedText type="defaultSemiBold">태그</ThemedText>
            <View style={styles.tagWrap}>
              {(bookmark.tags ?? []).map((t) => (
                <View key={t} style={[styles.tagPill, { borderColor: tint }]}>
                  <ThemedText style={[styles.tagText, { color: tint }]}>{t}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.block}>
            <ThemedText type="defaultSemiBold">태그</ThemedText>
            <ThemedText style={styles.muted}>없음</ThemedText>
          </View>
        )}

        <View style={styles.block}>
          <ThemedText type="defaultSemiBold">고정</ThemedText>
          <ThemedText style={styles.muted}>
            {bookmark.isPinned ? '상단에 고정됨' : '고정 안 됨'}
          </ThemedText>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={handleOpen}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: tint, opacity: pressed ? 0.85 : 1 },
            ]}>
            <IconSymbol name="arrow.up.right.square" size={20} color="#fff" />
            <ThemedText style={styles.primaryBtnText}>앱 내에서 열기</ThemedText>
          </Pressable>

          <View style={styles.rowBtns}>
            <Pressable
              onPress={handleExternal}
              style={({ pressed }) => [
                styles.secondaryBtn,
                { opacity: pressed ? 0.75 : 1 },
              ]}>
              <ThemedText style={styles.secondaryBtnText}>외부 브라우저</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => shareBookmark(shareTitle, url)}
              style={({ pressed }) => [
                styles.secondaryBtn,
                { opacity: pressed ? 0.75 : 1 },
              ]}>
              <ThemedText style={styles.secondaryBtnText}>공유</ThemedText>
            </Pressable>
          </View>

          <View style={styles.rowBtns}>
            <Pressable
              onPress={() => toggleBookmarkPin(bookmark.id)}
              style={({ pressed }) => [
                styles.secondaryBtn,
                { opacity: pressed ? 0.75 : 1 },
              ]}>
              <ThemedText style={styles.secondaryBtnText}>
                {bookmark.isPinned ? '고정 해제' : '상단 고정'}
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() =>
                router.push({ pathname: '/add', params: { id: bookmark.id } })
              }
              style={({ pressed }) => [
                styles.secondaryBtn,
                { opacity: pressed ? 0.75 : 1 },
              ]}>
              <ThemedText style={styles.secondaryBtnText}>편집</ThemedText>
            </Pressable>
          </View>

          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.dangerBtn,
              { opacity: pressed ? 0.8 : 1 },
            ]}>
            <ThemedText style={styles.dangerText}>삭제</ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  backBtn: { padding: 8 },
  scroll: {
    padding: 20,
    paddingBottom: 32,
    gap: 16,
  },
  hero: { alignItems: 'center', gap: 10 },
  thumbWrap: {
    width: 72,
    height: 72,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  thumb: { width: '100%', height: '100%' },
  thumbFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbLetter: { color: '#fff', fontWeight: 'bold', fontSize: 28 },
  title: { textAlign: 'center' },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catName: { fontSize: 14, fontWeight: '600' },
  block: { gap: 6 },
  urlText: { fontSize: 14, lineHeight: 20 },
  muted: { color: '#888', fontSize: 14 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(127,127,127,0.06)',
  },
  tagText: { fontSize: 13, fontWeight: '600' },
  actions: { gap: 12, marginTop: 8 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  rowBtns: { flexDirection: 'row', gap: 10 },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(127,127,127,0.14)',
  },
  secondaryBtnText: { fontWeight: '600', fontSize: 14 },
  dangerBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(231,76,60,0.12)',
  },
  dangerText: { color: '#c0392b', fontWeight: '700', fontSize: 15 },
});
