import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import type { DiaryEntry, DiaryMap } from '@/types/diary';

const STORAGE_KEY = '@diary_photo_memo_v1';

type DiaryState = {
  entries: DiaryMap;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setEntry: (dateKey: string, entry: DiaryEntry) => Promise<void>;
};

export const useDiaryStore = create<DiaryState>((set, get) => ({
  entries: {},
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const entries: DiaryMap = raw ? JSON.parse(raw) : {};
      set({ entries, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  setEntry: async (dateKey, entry) => {
    const next: DiaryMap = { ...get().entries, [dateKey]: entry };
    set({ entries: next });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  },
}));
