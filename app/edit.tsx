import { usePreventRemove } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
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
  const navigation = useNavigation();
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
  const removeEntry = useDiaryStore((s) => s.removeEntry);

  const [baseline, setBaseline] = useState({ memo: '', imageKey: null as string | null });
  const [memo, setMemo] = useState('');
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const m = existing?.memo ?? '';
    const img = existing?.imageUri?.trim() ? existing.imageUri : null;
    setBaseline({ memo: m, imageKey: img });
    setMemo(m);
    setPickedUri(img);
  }, [dateKey, existing?.memo, existing?.imageUri]);

  const isDirty = useMemo(() => {
    return memo.trim() !== baseline.memo.trim() || (pickedUri ?? '') !== (baseline.imageKey ?? '');
  }, [memo, pickedUri, baseline.memo, baseline.imageKey]);

  usePreventRemove(isDirty && !isSaving, ({ data }) => {
    Alert.alert('저장하지 않았어요', '변경 내용을 버리고 나갈까요?', [
      { text: '계속 편집', style: 'cancel', onPress: () => {} },
      {
        text: '나가기',
        style: 'destructive',
        onPress: () => navigation.dispatch(data.action),
      },
    ]);
  });

  const hasSavedEntry = Boolean(existing?.memo.trim() || existing?.imageUri.trim());

  const pickImage = useCallback(async () => {
    if (isSaving) return;
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
  }, [isSaving]);

  const save = useCallback(async () => {
    setIsSaving(true);
    try {
      let imageUri = '';
      if (pickedUri?.trim()) {
        const stableWeb = Platform.OS === 'web' ? await ensurePersistableUri(pickedUri) : pickedUri;
        imageUri = await persistPickedImage(stableWeb, dateKey);
      }

      const result = await setEntry(dateKey, {
        imageUri,
        memo: memo.trim(),
      });

      if (!result.ok) {
        Alert.alert(
          '저장 실패',
          result.error.message ?? '저장 공간을 확인한 뒤 다시 시도해 주세요.',
          [
            { text: '닫기', style: 'cancel' },
            {
              text: '재시도',
              onPress: () => {
                void save();
              },
            },
          ],
        );
        return;
      }

      router.back();
    } finally {
      setIsSaving(false);
    }
  }, [dateKey, memo, pickedUri, router, setEntry]);

  const confirmDeleteSaved = useCallback(() => {
    if (!hasSavedEntry || isSaving) return;
    Alert.alert(
      '일기 삭제',
      '이 날짜에 저장된 일기를 삭제할까요? 편집 중인 내용도 함께 버려지며 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel', onPress: () => {} },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setIsSaving(true);
              try {
                const result = await removeEntry(dateKey);
                if (!result.ok) {
                  Alert.alert(
                    '삭제 실패',
                    result.error.message ?? '잠시 후 다시 시도해 주세요.',
                  );
                  return;
                }
                router.back();
              } finally {
                setIsSaving(false);
              }
            })();
          },
        },
      ],
    );
  }, [dateKey, hasSavedEntry, isSaving, removeEntry, router]);

  const primaryLabelColor = scheme === 'dark' ? '#111' : '#fff';
  const destructive = scheme === 'dark' ? '#ff8a80' : '#c62828';

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
            disabled={isSaving}
            onPress={pickImage}
            style={({ pressed }) => [
              styles.secondaryBtn,
              {
                borderColor: palette.icon,
                opacity: isSaving ? 0.45 : pressed ? 0.85 : 1,
              },
            ]}>
            <ThemedText type="defaultSemiBold">사진 선택</ThemedText>
          </Pressable>
          {pickedUri ? (
            <Pressable disabled={isSaving} onPress={() => setPickedUri(null)} hitSlop={8}>
              <ThemedText style={[styles.removePhoto, { color: palette.tint, opacity: isSaving ? 0.45 : 1 }]}>
                사진 제거
              </ThemedText>
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
          editable={!isSaving}
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
              opacity: isSaving ? 0.65 : 1,
            },
          ]}
        />

        <Pressable
          disabled={isSaving}
          onPress={() => void save()}
          style={({ pressed }) => [
            styles.primaryBtn,
            {
              backgroundColor: tint,
              opacity: isSaving ? 0.55 : pressed ? 0.88 : 1,
            },
          ]}>
          <ThemedText style={[styles.primaryBtnText, { color: primaryLabelColor }]}>
            {isSaving ? '저장 중…' : '저장'}
          </ThemedText>
        </Pressable>

        {hasSavedEntry ? (
          <Pressable
            disabled={isSaving}
            onPress={confirmDeleteSaved}
            style={({ pressed }) => [
              styles.deleteBtn,
              { opacity: isSaving ? 0.45 : pressed ? 0.75 : 1 },
            ]}>
            <ThemedText style={[styles.deleteBtnText, { color: destructive }]}>저장된 일기 삭제</ThemedText>
          </Pressable>
        ) : null}
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
  deleteBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
