import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHabitStore } from '@/store/habit-store';
import { todayKey } from '@/types/habit';

const DAYS = 7;
const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];

export default function StatsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const habits = useHabitStore((s) => s.habits);

  const last7 = useMemo(() => {
    const result: { key: string; label: string; rate: number }[] = [];
    const today = new Date();
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = todayKey(d);
      const total = habits.length;
      const done = habits.filter((h) => h.history[key]).length;
      const rate = total === 0 ? 0 : Math.round((done / total) * 100);
      result.push({ key, label: WEEKDAY[d.getDay()], rate });
    }
    return result;
  }, [habits]);

  const avgRate =
    last7.length === 0 ? 0 : Math.round(last7.reduce((a, b) => a + b.rate, 0) / last7.length);

  const todayRate = last7[last7.length - 1]?.rate ?? 0;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="title">통계</ThemedText>
          <ThemedText style={[styles.sub, { color: palette.icon }]}>최근 7일 달성률</ThemedText>

          <View style={styles.summaryRow}>
            <SummaryCard label="오늘" value={`${todayRate}%`} palette={palette} />
            <SummaryCard label="7일 평균" value={`${avgRate}%`} palette={palette} />
            <SummaryCard label="습관 수" value={`${habits.length}`} palette={palette} />
          </View>

          <View style={styles.chartCard}>
            <ThemedText type="defaultSemiBold" style={styles.chartTitle}>
              일별 달성률
            </ThemedText>
            <View style={styles.chart}>
              {last7.map((d) => (
                <View key={d.key} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${Math.max(d.rate, 4)}%`,
                          backgroundColor: palette.tint,
                          opacity: d.rate === 0 ? 0.25 : 1,
                        },
                      ]}
                    />
                  </View>
                  <ThemedText style={[styles.barLabel, { color: palette.icon }]}>
                    {d.label}
                  </ThemedText>
                  <ThemedText style={styles.barValue}>{d.rate}%</ThemedText>
                </View>
              ))}
            </View>
          </View>

          {habits.length === 0 && (
            <ThemedText style={[styles.empty, { color: palette.icon }]}>
              습관을 추가하면 여기에 통계가 표시됩니다.
            </ThemedText>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function SummaryCard({
  label,
  value,
  palette,
}: {
  label: string;
  value: string;
  palette: { icon: string };
}) {
  return (
    <View style={styles.summaryCard}>
      <ThemedText style={[styles.summaryLabel, { color: palette.icon }]}>{label}</ThemedText>
      <ThemedText type="title" style={styles.summaryValue}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  sub: { marginTop: 4, fontSize: 13, marginBottom: 16 },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(127,127,127,0.1)',
    borderRadius: 12,
    padding: 14,
  },
  summaryLabel: { fontSize: 12 },
  summaryValue: { fontSize: 24, marginTop: 4 },
  chartCard: {
    backgroundColor: 'rgba(127,127,127,0.08)',
    borderRadius: 14,
    padding: 16,
  },
  chartTitle: { marginBottom: 14 },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 180,
    gap: 6,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    width: '100%',
    height: 130,
    justifyContent: 'flex-end',
    borderRadius: 6,
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 11,
    marginTop: 6,
  },
  barValue: {
    fontSize: 11,
    marginTop: 2,
  },
  empty: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 13,
  },
});
