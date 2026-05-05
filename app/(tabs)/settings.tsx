import { useEffect } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useBookmarkStore } from '@/store/bookmark-store';

export default function SettingsScreen() {
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const categories = useBookmarkStore((s) => s.categories);
  const hasHydrated = useBookmarkStore((s) => s.hasHydrated);
  const hydrate = useBookmarkStore((s) => s.hydrate);
  const resetAll = useBookmarkStore((s) => s.resetAll);

  useEffect(() => {
    if (!hasHydrated) {
      hydrate();
    }
  }, [hasHydrated, hydrate]);

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
