import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ResponsiveContainer } from '@/components/responsive-container';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  DEFAULT_CATEGORY_ID,
  HABIT_CATEGORIES,
  type CategoryId,
} from '@/constants/categories';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHabitStore } from '@/store/habit-store';

const EMOJI_OPTIONS = ['💪', '📚', '💧', '🏃', '🧘', '🥗', '😴', '✍️', '🎯', '⭐'];

export default function HabitFormModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const habits = useHabitStore((s) => s.habits);
  const addHabit = useHabitStore((s) => s.addHabit);
  const updateHabit = useHabitStore((s) => s.updateHabit);
  const deleteHabit = useHabitStore((s) => s.deleteHabit);

  const editing = useMemo(
    () => (params.id ? habits.find((h) => h.id === params.id) : undefined),
    [params.id, habits]
  );

  const [name, setName] = useState(editing?.name ?? '');
  const [emoji, setEmoji] = useState(editing?.emoji ?? EMOJI_OPTIONS[0]);
  const [categoryId, setCategoryId] = useState<CategoryId>(
    editing?.categoryId ?? DEFAULT_CATEGORY_ID
  );

  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    if (editing) {
      updateHabit(editing.id, name, emoji, categoryId);
    } else {
      addHabit(name, emoji, categoryId);
    }
    router.back();
  };

  const handleDelete = () => {
    if (!editing) return;
    deleteHabit(editing.id);
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ResponsiveContainer maxWidth={560}>
        <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>



        <View style={styles.content}>
          <ThemedText type="title">{editing ? '습관 수정' : '새 습관'}</ThemedText>

          <ThemedText style={[styles.label, { color: palette.icon }]}>이모지</ThemedText>
          <View style={styles.emojiRow}>
            {EMOJI_OPTIONS.map((e) => {
              const active = e === emoji;
              return (
                <Pressable
                  key={e}
                  onPress={() => setEmoji(e)}
                  style={[
                    styles.emojiBtn,
                    {
                      backgroundColor: active ? palette.tint : 'rgba(127,127,127,0.12)',
                    },
                  ]}>
                  <ThemedText style={styles.emojiText}>{e}</ThemedText>
                </Pressable>
              );
            })}
          </View>

          <ThemedText style={[styles.label, { color: palette.icon }]}>카테고리</ThemedText>
          <View style={styles.categoryRow}>
            {HABIT_CATEGORIES.map((cat) => {
              const active = cat.id === categoryId;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setCategoryId(cat.id)}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: active ? cat.color : cat.soft,
                      borderColor: active ? cat.color : 'transparent',
                    },
                  ]}>
                  <ThemedText
                    style={[
                      styles.categoryChipText,
                      { color: active ? '#fff' : cat.color },
                    ]}>
                    {cat.emoji} {cat.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <ThemedText style={[styles.label, { color: palette.icon }]}>이름</ThemedText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="예: 매일 30분 운동"
            placeholderTextColor={palette.icon}
            style={[
              styles.input,
              {
                color: palette.text,
                borderColor: palette.icon,
                backgroundColor: colorScheme === 'dark' ? '#1f2224' : '#f6f7f9',
              },
            ]}
            autoFocus={!editing}
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />

          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            style={({ pressed }) => [
              styles.saveBtn,
              {
                backgroundColor: palette.tint,
                opacity: !canSave ? 0.4 : pressed ? 0.85 : 1,
              },
            ]}>
            <ThemedText style={styles.saveText}>{editing ? '수정' : '추가'}</ThemedText>
          </Pressable>

          {editing && (
            <Pressable
              onPress={handleDelete}
              style={({ pressed }) => [styles.deleteBtn, { opacity: pressed ? 0.7 : 1 }]}>
              <ThemedText style={styles.deleteText}>이 습관 삭제</ThemedText>
            </Pressable>
          )}
        </View>
        </ScrollView>
        </ResponsiveContainer>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingBottom: 40, 
    padding: 20,
    gap: 12,
  },
  label: {
    marginTop: 12,
    fontSize: 13,
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 22,
    lineHeight: 26,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  saveBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  deleteBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteText: {
    color: '#e23a3a',
    fontSize: 14,
  },
});
