import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHabitStore } from '@/store/habit-store';

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const habits = useHabitStore((s) => s.habits);
  const clearAll = useHabitStore((s) => s.clearAll);

  const confirmClear = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('모든 습관과 기록을 삭제할까요?')) {
        void clearAll();
      }
      return;
    }
    Alert.alert('데이터 초기화', '모든 습관과 기록을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => void clearAll() },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.content}>
          <ThemedText type="title">설정</ThemedText>

          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              데이터
            </ThemedText>

            <Row
              icon="storage"
              label="저장된 습관"
              value={`${habits.length}개`}
              palette={palette}
            />

            <Pressable
              onPress={confirmClear}
              style={({ pressed }) => [
                styles.row,
                styles.dangerRow,
                { opacity: pressed ? 0.7 : 1 },
              ]}>
              <MaterialIcons name="delete-outline" size={22} color="#e23a3a" />
              <ThemedText style={styles.dangerText}>모든 데이터 초기화</ThemedText>
            </Pressable>
          </View>

          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              앱 정보
            </ThemedText>
            <Row icon="info-outline" label="버전" value="1.0.0" palette={palette} />
            <Row
              icon="palette"
              label="테마"
              value={colorScheme === 'dark' ? '다크' : '라이트'}
              palette={palette}
            />
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function Row({
  icon,
  label,
  value,
  palette,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  value: string;
  palette: { icon: string };
}) {
  return (
    <View style={styles.row}>
      <MaterialIcons name={icon} size={22} color={palette.icon} />
      <ThemedText style={styles.rowLabel}>{label}</ThemedText>
      <ThemedText style={[styles.rowValue, { color: palette.icon }]}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  content: { padding: 16 },
  section: { marginTop: 24 },
  sectionTitle: { marginBottom: 8, fontSize: 14, opacity: 0.8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(127,127,127,0.08)',
    gap: 12,
    marginBottom: 8,
  },
  rowLabel: { flex: 1 },
  rowValue: { fontSize: 14 },
  dangerRow: { backgroundColor: 'rgba(226,58,58,0.08)' },
  dangerText: { color: '#e23a3a', flex: 1, fontWeight: '600' },
});
