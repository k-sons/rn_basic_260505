import { Image } from 'expo-image';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { DiaryEntry } from '@/types/diary';

type Props = {
  dateLabel: string;
  entry: DiaryEntry | undefined;
};

export function DiaryDayCard({ dateLabel, entry }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const { height, width } = useWindowDimensions();
  const palette = Colors[scheme];
  const cardBg = scheme === 'dark' ? '#1e2326' : '#f4f6f8';
  const border = scheme === 'dark' ? '#2c3238' : '#dde3e8';

  const hasImage = Boolean(entry?.imageUri?.trim());
  const imageHeight =
    Platform.OS === 'web'
      ? Math.min(300, Math.max(160, Math.round(Math.min(width * 0.28, height * 0.34))))
      : height < 720
        ? 148
        : 188;

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
      <ThemedText type="subtitle" style={styles.dateHeading}>
        {dateLabel}
      </ThemedText>

      <View
        style={[
          styles.imageWrap,
          {
            backgroundColor: scheme === 'dark' ? '#121518' : '#e8ecf0',
            height: imageHeight,
          },
        ]}>
        {hasImage ? (
          <Image
            accessibilityLabel={`${dateLabel} 일기 사진`}
            source={{ uri: entry!.imageUri }}
            style={styles.image}
            contentFit={Platform.OS === 'web' ? 'contain' : 'cover'}
            transition={160}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={styles.placeholder}>
            <ThemedText style={[styles.placeholderTitle, { color: palette.icon }]}>이 날짜의 사진이 없어요</ThemedText>
            <ThemedText style={[styles.placeholderHint, { color: palette.icon }]}>
              아래 버튼에서 사진과 메모를 추가할 수 있어요.
            </ThemedText>
          </View>
        )}
      </View>

      <View style={styles.memoBox}>
        <ThemedText type="defaultSemiBold">메모</ThemedText>
        {entry?.memo?.trim() ? (
          <ThemedText style={styles.memo}>{entry.memo.trim()}</ThemedText>
        ) : (
          <ThemedText style={[styles.memoEmpty, { color: palette.icon }]}>
            메모가 비어 있어요. 편집 화면에서 적어보세요.
          </ThemedText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginHorizontal: 16,
    maxHeight: '100%',
    flexShrink: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  dateHeading: {
    marginBottom: 14,
    textAlign: 'center',
  },
  imageWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  placeholderTitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  placeholderHint: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  memoBox: {
    marginTop: 16,
    gap: 8,
  },
  memo: {
    fontSize: 16,
    lineHeight: 24,
  },
  memoEmpty: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
});
