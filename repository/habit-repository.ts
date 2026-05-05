import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Habit } from '@/types/habit';

const STORAGE_KEY = '@habits/v1';

export const habitRepository = {
  async load(): Promise<Habit[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('[habitRepository] load failed', e);
      return [];
    }
  },

  async save(habits: Habit[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    } catch (e) {
      console.warn('[habitRepository] save failed', e);
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('[habitRepository] clear failed', e);
    }
  },
};
