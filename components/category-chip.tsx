import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Category } from '@/types/bookmark';

type CategoryChipProps = {
  category: Category | null;
  selected?: boolean;
  count?: number;
  onPress?: () => void;
};

const ALL_LABEL = '전체';

export function CategoryChip({ category, selected, count, onPress }: CategoryChipProps) {
  const label = category ? category.name : ALL_LABEL;
  const tint = category?.color ?? '#0a7ea4';
  const bg = selected ? tint : 'transparent';
  const textColor = selected ? '#fff' : tint;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { borderColor: tint, backgroundColor: bg, opacity: pressed ? 0.7 : 1 },
      ]}>
      <View style={[styles.dot, { backgroundColor: selected ? '#fff' : tint }]} />
      <ThemedText style={[styles.label, { color: textColor }]}>
        {label}
        {typeof count === 'number' ? ` (${count})` : ''}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    marginRight: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
});
