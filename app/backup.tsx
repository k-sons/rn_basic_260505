import * as Clipboard from 'expo-clipboard';
import { type ChangeEvent, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { parseDiaryStorage, stringifyDiaryDocument } from '@/lib/diary-format';
import { useDiaryStore } from '@/store/diary-store';

function prettyDiaryJson(entries: ReturnType<typeof useDiaryStore.getState>['entries']): string {
  return JSON.stringify(JSON.parse(stringifyDiaryDocument(entries)), null, 2);
}

function downloadJsonOnWeb(json: string) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return false;
  }

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `photo-memo-diary-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return true;
}

export default function BackupScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const entries = useDiaryStore((s) => s.entries);
  const replaceEntries = useDiaryStore((s) => s.replaceEntries);
  const [importText, setImportText] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  const exportJson = useMemo(() => prettyDiaryJson(entries), [entries]);
  const entryCount = useMemo(() => Object.keys(entries).length, [entries]);

  const backupButtonLabel = Platform.OS === 'web' ? '백업 JSON 내보내기' : '백업 JSON 복사';

  const downloadBackup = async () => {
    if (downloadJsonOnWeb(exportJson)) {
      return;
    }
    await Clipboard.setStringAsync(exportJson);
    Alert.alert('복사 완료', '백업 JSON을 클립보드에 복사했습니다.');
  };

  const readBackupFileOnWeb = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImportText(String(reader.result ?? ''));
    };
    reader.onerror = () => {
      Alert.alert('파일 읽기 실패', '백업 JSON 파일을 다시 선택해 주세요.');
    };
    reader.readAsText(file);
  };

  const confirmRestore = () => {
    if (!importText.trim() || isRestoring) {
      return;
    }

    let nextEntries;
    try {
      JSON.parse(importText);
      nextEntries = parseDiaryStorage(importText);
    } catch {
      Alert.alert('복원 실패', 'JSON 형식이 올바르지 않습니다.');
      return;
    }

    Alert.alert(
      '일기 복원',
      `현재 일기 ${entryCount}개를 백업 내용 ${Object.keys(nextEntries).length}개로 교체할까요?`,
      [
        { text: '취소', style: 'cancel', onPress: () => {} },
        {
          text: '복원',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setIsRestoring(true);
              try {
                const result = await replaceEntries(nextEntries);
                if (!result.ok) {
                  Alert.alert('복원 실패', result.error.message ?? '저장 공간을 확인한 뒤 다시 시도해 주세요.');
                  return;
                }
                setImportText('');
                Alert.alert('복원 완료', '백업 JSON으로 일기를 교체했습니다.');
              } finally {
                setIsRestoring(false);
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <ThemedText type="subtitle">내보내기</ThemedText>
          <ThemedText style={[styles.hint, { color: palette.icon }]}>
            현재 저장된 일기 {entryCount}개를 JSON으로 백업합니다. 웹에서는 파일 다운로드가 열리고, Expo Go에서는
            클립보드에 복사해 보관할 수 있습니다.
          </ThemedText>
          <Pressable
            accessibilityHint="웹에서는 JSON 파일을 다운로드하고, Expo Go에서는 백업 JSON을 클립보드에 복사합니다."
            accessibilityLabel={backupButtonLabel}
            accessibilityRole="button"
            onPress={() => void downloadBackup()}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: palette.tint,
                opacity: pressed ? 0.86 : 1,
              },
            ]}>
            <ThemedText style={[styles.primaryButtonText, { color: scheme === 'dark' ? '#111' : '#fff' }]}>
              {backupButtonLabel}
            </ThemedText>
          </Pressable>
          <TextInput
            accessibilityLabel="내보내기 백업 JSON 내용"
            editable={false}
            multiline
            value={exportJson}
            style={[
              styles.codeBox,
              {
                color: palette.text,
                borderColor: scheme === 'dark' ? '#2c3238' : '#dde3e8',
                backgroundColor: scheme === 'dark' ? '#1e2326' : '#f7f9fb',
              },
            ]}
          />
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle">가져오기</ThemedText>
          <ThemedText style={[styles.hint, { color: palette.icon }]}>
            웹에서는 백업 JSON 파일을 선택하거나 내용을 붙여넣을 수 있습니다. Expo Go에서는 복사해 둔 JSON을
            붙여넣고 복원하면 현재 일기 목록이 백업 내용으로 교체됩니다.
          </ThemedText>
          {Platform.OS === 'web' ? (
            <input
              aria-label="복원할 백업 JSON 파일 선택"
              accept="application/json,.json"
              onChange={readBackupFileOnWeb}
              style={styles.fileInput}
              type="file"
            />
          ) : null}
          <TextInput
            accessibilityLabel="복원할 백업 JSON 입력"
            editable={!isRestoring}
            multiline
            onChangeText={setImportText}
            placeholder="여기에 백업 JSON을 붙여넣으세요."
            placeholderTextColor={palette.icon}
            value={importText}
            style={[
              styles.importBox,
              {
                color: palette.text,
                borderColor: scheme === 'dark' ? '#2c3238' : '#dde3e8',
                backgroundColor: scheme === 'dark' ? '#1e2326' : '#fff',
                opacity: isRestoring ? 0.65 : 1,
              },
            ]}
          />
          <Pressable
            accessibilityHint="붙여넣은 JSON으로 현재 일기 데이터를 교체합니다."
            accessibilityLabel="붙여넣은 백업 JSON으로 일기 복원하기"
            accessibilityRole="button"
            disabled={!importText.trim() || isRestoring}
            onPress={confirmRestore}
            style={({ pressed }) => [
              styles.restoreButton,
              {
                borderColor: palette.tint,
                opacity: !importText.trim() || isRestoring ? 0.45 : pressed ? 0.76 : 1,
              },
            ]}>
            <ThemedText type="defaultSemiBold" style={{ color: palette.tint }}>
              {isRestoring ? '복원 중...' : '백업 JSON 복원'}
            </ThemedText>
          </Pressable>
        </View>
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
    gap: 24,
    paddingBottom: 36,
  },
  section: {
    gap: 12,
  },
  hint: {
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  codeBox: {
    minHeight: 180,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 12,
    lineHeight: 18,
    textAlignVertical: 'top',
  },
  importBox: {
    minHeight: 140,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  fileInput: {
    fontSize: 14,
  },
  restoreButton: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
  },
});
