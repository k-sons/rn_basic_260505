import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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

  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    if (editing) {
      updateHabit(editing.id, name, emoji);
    } else {
      addHabit(name, emoji);
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
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
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
