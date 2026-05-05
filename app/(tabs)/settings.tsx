import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useEffect } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  backupFileName,
  parseBackupJson,
  readPickedAssetUtf8,
  serializeBackup,
} from '@/lib/bookmark-backup';
import { STORAGE_KEY, useBookmarkStore } from '@/store/bookmark-store';
import type { PersistedState } from '@/types/bookmark';

const ACCENT = '#0a7ea4';

function downloadJsonWeb(filename: string, contents: string) {
  const blob = new Blob([contents], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function alertMessage(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

function promptRestoreMode(onChoose: (mode: 'overwrite' | 'merge') => void) {
  if (Platform.OS === 'web') {
    const overwrite = window.confirm(
      '[확인] 덮어쓰기: 기존 북마크·카테고리를 모두 지우고 백업으로 바꿉니다.\n[취소] 다음에서 병합 여부를 선택합니다.'
    );
    if (overwrite) {
      onChoose('overwrite');
      return;
    }
    if (
      window.confirm(
        '병합: 같은 ID는 백업 내용으로 덮어쓰고, 백업에만 있는 항목은 추가합니다. 진행할까요?'
      )
    ) {
      onChoose('merge');
    }
    return;
  }
  Alert.alert(
    '복원 방법',
    '덮어쓰기는 현재 데이터를 모두 교체합니다. 병합은 같은 ID를 백업 값으로 갱신하고, 백업에만 있는 항목은 추가합니다.',
    [
      { text: '취소', style: 'cancel' },
      { text: '병합', onPress: () => onChoose('merge') },
      { text: '덮어쓰기', style: 'destructive', onPress: () => onChoose('overwrite') },
    ]
  );
}

export default function SettingsScreen() {
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const categories = useBookmarkStore((s) => s.categories);
  const hasHydrated = useBookmarkStore((s) => s.hasHydrated);
  const hydrate = useBookmarkStore((s) => s.hydrate);
  const resetAll = useBookmarkStore((s) => s.resetAll);
  const restoreFromBackup = useBookmarkStore((s) => s.restoreFromBackup);

  useEffect(() => {
    if (!hasHydrated) {
      hydrate();
    }
  }, [hasHydrated, hydrate]);

  const handleExportBackup = async () => {
    const json = serializeBackup({ bookmarks, categories }, STORAGE_KEY);
    const name = backupFileName();
    try {
      if (Platform.OS === 'web') {
        downloadJsonWeb(name, json);
        return;
      }
      const outFile = new File(Paths.cache, name);
      outFile.create({ overwrite: true });
      outFile.write(json, { encoding: 'utf8' });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(outFile.uri, {
          mimeType: 'application/json',
          dialogTitle: '백업 내보내기',
        });
      } else {
        alertMessage(
          '내보내기',
          '백업 파일을 앱 캐시에 저장했습니다. 이 환경에서는 공유 시트를 쓸 수 없습니다.'
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '알 수 없는 오류';
      alertMessage('내보내기 실패', msg);
    }
  };

  const handleImportBackup = async () => {
    try {
      const pick = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain'],
        copyToCacheDirectory: true,
      });
      if (pick.canceled || !pick.assets?.[0]) return;

      const raw = await readPickedAssetUtf8(pick.assets[0]);
      let data: PersistedState;
      try {
        data = parseBackupJson(raw);
      } catch (err) {
        alertMessage('복원 실패', err instanceof Error ? err.message : '형식 오류');
        return;
      }

      const applyRestore = async (mode: 'overwrite' | 'merge') => {
        try {
          await restoreFromBackup(data, mode);
          alertMessage('완료', '백업에서 복원했습니다.');
        } catch (err) {
          alertMessage('복원 실패', err instanceof Error ? err.message : '알 수 없는 오류');
        }
      };

      promptRestoreMode((mode) => {
        void applyRestore(mode);
      });
    } catch (e) {
      alertMessage('가져오기 실패', e instanceof Error ? e.message : '알 수 없는 오류');
    }
  };

  const handleReset = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        '저장된 모든 북마크와 사용자 카테고리가 삭제됩니다. 계속할까요?'
      );
      if (confirmed) {
        resetAll();
      }
      return;
    }

    Alert.alert(
      '모든 데이터 초기화',
      '저장된 모든 북마크와 사용자 카테고리가 삭제됩니다. 계속할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화',
          style: 'destructive',
          onPress: async () => {
            await resetAll();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.flex} edges={['bottom']}>
      <ThemedView style={styles.flex}>
        <View style={styles.section}>
          <ThemedText type="subtitle">통계</ThemedText>
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <ThemedText type="title">{bookmarks.length}</ThemedText>
              <ThemedText style={styles.statLabel}>북마크</ThemedText>
            </View>
            <View style={styles.statBox}>
              <ThemedText type="title">{categories.length}</ThemedText>
              <ThemedText style={styles.statLabel}>카테고리</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle">사용 안내</ThemedText>
          <ThemedText style={styles.help}>· 북마크를 탭하면 인앱 브라우저로 열립니다.</ThemedText>
          <ThemedText style={styles.help}>· 길게 누르면 외부 브라우저/편집/삭제 메뉴가 열립니다.</ThemedText>
          <ThemedText style={styles.help}>· 카테고리 탭에서 색상과 이름을 자유롭게 추가할 수 있어요.</ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle">백업 / 복원</ThemedText>
          <ThemedText style={styles.help}>
            · Android: 내보내기 후 공유 시트로 저장소·메일 등에 저장할 수 있습니다.
          </ThemedText>
          <ThemedText style={styles.help}>
            · 웹: JSON 파일로 다운로드·파일 선택 가져오기만 지원합니다.
          </ThemedText>
          <View style={styles.backupRow}>
            <Pressable
              onPress={() => {
                void handleExportBackup();
              }}
              style={({ pressed }) => [
                styles.backupBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}>
              <IconSymbol name="square.and.arrow.up" size={18} color="#fff" />
              <ThemedText style={styles.backupBtnText}>백업 내보내기</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => {
                void handleImportBackup();
              }}
              style={({ pressed }) => [
                styles.backupBtn,
                styles.backupBtnSecondary,
                { opacity: pressed ? 0.85 : 1 },
              ]}>
              <IconSymbol name="square.and.arrow.down" size={18} color="#fff" />
              <ThemedText style={styles.backupBtnText}>복원 가져오기</ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle">데이터</ThemedText>
          <Pressable
            onPress={handleReset}
            style={({ pressed }) => [
              styles.dangerBtn,
              { opacity: pressed ? 0.7 : 1 },
            ]}>
            <IconSymbol name="trash" size={18} color="#fff" />
            <ThemedText style={styles.dangerText}>모든 데이터 초기화</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#999',
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(127,127,127,0.08)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statLabel: {
    marginTop: 4,
    color: '#888',
  },
  help: {
    color: '#888',
    fontSize: 14,
  },
  backupRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  backupBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  backupBtnSecondary: {
    backgroundColor: '#34495e',
  },
  backupBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  dangerText: {
    color: '#fff',
    fontWeight: '600',
  },
});
