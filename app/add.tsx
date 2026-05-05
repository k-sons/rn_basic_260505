import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useBookmarkStore } from '@/store/bookmark-store';
import { DEFAULT_CATEGORY_ID } from '@/types/bookmark';
import { extractDomain, getFaviconUrl, normalizeUrl } from '@/utils/favicon';

export default function AddBookmarkScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = typeof params.id === 'string' ? params.id : undefined;

  const colorScheme = useColorScheme() ?? 'light';
  const tint = Colors[colorScheme].tint;
  const textColor = Colors[colorScheme].text;

  const categories = useBookmarkStore((s) => s.categories);
  const addBookmark = useBookmarkStore((s) => s.addBookmark);
  const updateBookmark = useBookmarkStore((s) => s.updateBookmark);
  const getBookmark = useBookmarkStore((s) => s.getBookmark);

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [thumb, setThumb] = useState('');
  const [categoryId, setCategoryId] = useState<string>(DEFAULT_CATEGORY_ID);

  useEffect(() => {
    if (!editId) return;
    const target = getBookmark(editId);
    if (target) {
      setTitle(target.title);
      setUrl(target.url);
      setThumb(target.thumbnailUrl ?? '');
      setCategoryId(target.categoryId);
    }
  }, [editId, getBookmark]);

  const previewThumb = useMemo(() => {
    if (thumb.trim()) return thumb.trim();
    const fav = getFaviconUrl(url);
    return fav ?? null;
  }, [thumb, url]);

  const previewDomain = useMemo(() => extractDomain(url) ?? '', [url]);

  const handleSubmit = () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      Alert.alert('URL 필요', 'URL을 입력해주세요.');
      return;
    }
    if (!extractDomain(trimmedUrl)) {
      Alert.alert('URL 형식 오류', '올바른 형식의 URL이 아닙니다.');
      return;
    }
    const finalTitle = title.trim() || extractDomain(trimmedUrl) || trimmedUrl;
    const normalizedUrl = normalizeUrl(trimmedUrl);
    const payload = {
      title: finalTitle,
      url: normalizedUrl,
      categoryId,
      thumbnailUrl: thumb.trim() || undefined,
    };

    if (editId) {
      updateBookmark(editId, payload);
    } else {
      addBookmark(payload);
    }
    router.back();
  };

  return (
    <ThemedView style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <ThemedText type="title">{editId ? '북마크 편집' : '북마크 추가'}</ThemedText>

          <View style={styles.field}>
            <ThemedText type="defaultSemiBold">URL *</ThemedText>
            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder="https://example.com"
              placeholderTextColor="#888"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={[styles.input, { color: textColor }]}
            />
          </View>

          <View style={styles.field}>
            <ThemedText type="defaultSemiBold">제목</ThemedText>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="비워두면 도메인이 사용됨"
              placeholderTextColor="#888"
              style={[styles.input, { color: textColor }]}
            />
          </View>

          <View style={styles.field}>
            <ThemedText type="defaultSemiBold">썸네일 URL (선택)</ThemedText>
            <TextInput
              value={thumb}
              onChangeText={setThumb}
              placeholder="비우면 favicon 자동"
              placeholderTextColor="#888"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={[styles.input, { color: textColor }]}
            />
            {previewThumb ? (
              <View style={styles.previewRow}>
                <Image
                  source={{ uri: previewThumb }}
                  style={styles.previewImage}
                  contentFit="cover"
                />
                <ThemedText style={styles.previewDomain} numberOfLines={1}>
                  {previewDomain || '미리보기'}
                </ThemedText>
              </View>
            ) : null}
          </View>

          <View style={styles.field}>
            <ThemedText type="defaultSemiBold">카테고리</ThemedText>
            <View style={styles.catWrap}>
              {categories.map((c) => {
                const selected = c.id === categoryId;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setCategoryId(c.id)}
                    style={[
                      styles.catChip,
                      {
                        borderColor: c.color,
                        backgroundColor: selected ? c.color : 'transparent',
                      },
                    ]}>
                    <ThemedText
                      style={[styles.catChipText, { color: selected ? '#fff' : c.color }]}>
                      {c.name}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.btn,
                styles.cancelBtn,
                { opacity: pressed ? 0.7 : 1 },
              ]}>
              <ThemedText style={styles.cancelText}>취소</ThemedText>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: tint, opacity: pressed ? 0.8 : 1 },
              ]}>
              <ThemedText style={styles.submitText}>{editId ? '저장' : '추가'}</ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    padding: 20,
    gap: 16,
  },
  field: { gap: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  previewImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  previewDomain: {
    flex: 1,
    color: '#888',
    fontSize: 12,
  },
  catWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  catChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: 'rgba(127,127,127,0.15)',
  },
  cancelText: { fontWeight: '600' },
  submitText: {
    color: '#fff',
    fontWeight: '700',
  },
});
