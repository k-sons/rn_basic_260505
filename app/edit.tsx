import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { isValidDateKey, parseDateKey, toDateKey } from '@/lib/date-key';
import { ensurePersistableUri, persistPickedImage } from '@/lib/persist-image';
import { useDiaryStore } from '@/store/diary-store';

export default function EditDiaryScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const tint = palette.tint;

  const rawDate = useLocalSearchParams<{ date?: string | string[] }>().date;
  const dateParam = Array.isArray(rawDate) ? rawDate[0] : rawDate;

  const dateKey = useMemo(() => {
    if (dateParam && isValidDateKey(dateParam)) return dateParam;
    return toDateKey(new Date());
  }, [dateParam]);

  const formatted = useMemo(() => {
    const dt = parseDateKey(dateKey);
    if (!dt) return dateKey;
    return dt.toLocaleDateString('ko-KR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [dateKey]);

  const existing = useDiaryStore((s) => s.entries[dateKey]);
  const setEntry = useDiaryStore((s) => s.setEntry);

  const [memo, setMemo] = useState('');
  const [pickedUri, setPickedUri] = useState<string | null>(null);

  useEffect(() => {
    setMemo(existing?.memo ?? '');
    setPickedUri(existing?.imageUri?.trim() ? existing.imageUri : null);
  }, [dateKey, existing?.memo, existing?.imageUri]);

  const pickImage = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        '권한 필요',
        Platform.OS === 'android'
          ? '갤러리에서 사진을 고르려면 저장소·사진 권한을 허용해 주세요.'
          : '사진 라이브러리 접근을 허용해 주세요.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setPickedUri(result.assets[0].uri);
    }
  }, []);

  const save = useCallback(async () => {
    let imageUri = '';
    if (pickedUri?.trim()) {
      const stableWeb = Platform.OS === 'web' ? await ensurePersistableUri(pickedUri) : pickedUri;
      imageUri = await persistPickedImage(stableWeb, dateKey);
    }

    await setEntry(dateKey, {
      imageUri,
      memo: memo.trim(),
    });

    router.back();
  }, [dateKey, memo, pickedUri, router, setEntry]);

  const primaryLabelColor = scheme === 'dark' ? '#111' : '#fff';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <ThemedText type="subtitle">{formatted}</ThemedText>
          <ThemedText style={[styles.hint, { color: palette.icon }]}>
            {Platform.OS === 'web'
              ? '웹에서는 선택한 이미지를 data URL로 저장합니다. 용량이 크면 브라우저 저장소 부담이 커질 수 있어요.'
              : '선택한 사진은 앱 저장 공간으로 복사해 두어 재실행 후에도 안정적으로 불러옵니다.'}
          </ThemedText>

          <View style={styles.pickRow}>
            <Pressable
              onPress={pickImage}
              style={({ pressed }) => [
                styles.secondaryBtn,
                {
                  borderColor: palette.icon,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <ThemedText type="defaultSemiBold">사진 선택</ThemedText>
            </Pressable>
            {pickedUri ? (
              <Pressable onPress={() => setPickedUri(null)} hitSlop={8}>
                <ThemedText style={[styles.removePhoto, { color: palette.tint }]}>사진 제거</ThemedText>
              </Pressable>
            ) : null}
          </View>

          {pickedUri ? (
            <View style={[styles.previewWrap, { backgroundColor: scheme === 'dark' ? '#121518' : '#e8ecf0' }]}>
              <Image source={{ uri: pickedUri }} style={styles.preview} contentFit="cover" transition={120} />
            </View>
          ) : null}

          <ThemedText type="defaultSemiBold" style={styles.memoLabel}>
            메모
          </ThemedText>
          <TextInput
            value={memo}
            onChangeText={setMemo}
            placeholder="짧게 오늘을 기록해 보세요."
            placeholderTextColor={palette.icon}
            multiline
            style={[
              styles.input,
              {
                color: palette.text,
                borderColor: scheme === 'dark' ? '#2c3238' : '#dde3e8',
                backgroundColor: scheme === 'dark' ? '#1e2326' : '#fff',
              },
            ]}
          />

          <Pressable
            onPress={() => void save()}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: tint, opacity: pressed ? 0.88 : 1 },
            ]}>
            <ThemedText style={[styles.primaryBtnText, { color: primaryLabelColor }]}>저장</ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    gap: 12,
    paddingBottom: 32,
  },
  hint: {
    fontSize: 13,
    lineHeight: 19,
  },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  secondaryBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  removePhoto: {
    fontSize: 15,
    fontWeight: '600',
  },
  previewWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    aspectRatio: 4 / 3,
    marginTop: 4,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  memoLabel: {
    marginTop: 8,
  },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  primaryBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: '700',
  },
});
