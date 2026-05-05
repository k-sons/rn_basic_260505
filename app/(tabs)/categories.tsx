import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useBookmarkStore } from '@/store/bookmark-store';

const PALETTE = [
  '#0a7ea4',
  '#e74c3c',
  '#f39c12',
  '#27ae60',
  '#8e44ad',
  '#16a085',
  '#2c3e50',
  '#7f8c8d',
];

export default function CategoriesScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const tint = Colors[colorScheme].tint;
  const textColor = Colors[colorScheme].text;

  const categories = useBookmarkStore((s) => s.categories);
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const addCategory = useBookmarkStore((s) => s.addCategory);
  const removeCategory = useBookmarkStore((s) => s.removeCategory);

  const [name, setName] = useState('');
  const [color, setColor] = useState(PALETTE[0]);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const b of bookmarks) {
      m[b.categoryId] = (m[b.categoryId] ?? 0) + 1;
    }
    return m;
  }, [bookmarks]);

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (categories.some((c) => c.name === trimmed)) {
      Alert.alert('이미 존재', '같은 이름의 카테고리가 이미 있어요.');
      return;
    }
    addCategory({ name: trimmed, color });
    setName('');
  };

  const handleRemove = (id: string, isDefault?: boolean) => {
    if (isDefault) {
      Alert.alert('삭제 불가', '기본 카테고리는 삭제할 수 없어요.');
      return;
    }
    Alert.alert(
      '카테고리 삭제',
      '이 카테고리를 삭제하면, 해당 북마크들은 "기타"로 이동합니다.',
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: () => removeCategory(id) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.flex} edges={['bottom']}>
      <ThemedView style={styles.flex}>
        <View style={styles.formBox}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="새 카테고리 이름"
            placeholderTextColor="#888"
            onSubmitEditing={handleAdd}
            returnKeyType="done"
            style={[styles.input, { color: textColor, borderColor: '#ccc' }]}
          />
          <View style={styles.paletteRow}>
            {PALETTE.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.paletteDot,
                  { backgroundColor: c, borderWidth: c === color ? 3 : 0 },
                ]}
              />
            ))}
          </View>
          <Pressable
            onPress={handleAdd}
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: tint, opacity: pressed || !name.trim() ? 0.6 : 1 },
            ]}
            disabled={!name.trim()}>
            <IconSymbol name="plus" size={18} color="#fff" />
            <ThemedText style={styles.addBtnText}>카테고리 추가</ThemedText>
          </Pressable>
        </View>

        <FlatList
          data={categories}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={[styles.colorChip, { backgroundColor: item.color }]} />
              <View style={styles.rowBody}>
                <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                <ThemedText style={styles.meta}>
                  북마크 {counts[item.id] ?? 0}개 {item.isDefault ? '· 기본' : ''}
                </ThemedText>
              </View>
              <Pressable
                onPress={() => handleRemove(item.id, item.isDefault)}
                style={({ pressed }) => [styles.removeBtn, { opacity: pressed ? 0.6 : 1 }]}>
                <IconSymbol
                  name="trash"
                  size={20}
                  color={item.isDefault ? '#bbb' : '#e74c3c'}
                />
              </Pressable>
            </View>
          )}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  formBox: {
    padding: 14,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#999',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  paletteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  paletteDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderColor: '#fff',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 14,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(127,127,127,0.08)',
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
  },
  colorChip: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  rowBody: { flex: 1 },
  meta: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  removeBtn: {
    padding: 8,
  },
});
