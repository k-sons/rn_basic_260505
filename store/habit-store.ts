import { create } from 'zustand';
import { habitRepository } from '@/repository/habit-repository';
import { todayKey, type Habit } from '@/types/habit';

type HabitState = {
  habits: Habit[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addHabit: (name: string, emoji: string) => void;
  updateHabit: (id: string, name: string, emoji: string) => void;
  deleteHabit: (id: string) => void;
  toggleToday: (id: string) => void;
  clearAll: () => Promise<void>;
};

const persist = (habits: Habit[]) => {
  void habitRepository.save(habits);
};

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  hydrated: false,

  hydrate: async () => {
    const habits = await habitRepository.load();
    set({ habits, hydrated: true });
  },

  addHabit: (name, emoji) => {
    const newHabit: Habit = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      emoji: emoji || '⭐',
      createdAt: Date.now(),
      history: {},
    };
    const next = [...get().habits, newHabit];
    set({ habits: next });
    persist(next);
  },

  updateHabit: (id, name, emoji) => {
    const next = get().habits.map((h) =>
      h.id === id ? { ...h, name: name.trim(), emoji: emoji || h.emoji } : h
    );
    set({ habits: next });
    persist(next);
  },

  deleteHabit: (id) => {
    const next = get().habits.filter((h) => h.id !== id);
    set({ habits: next });
    persist(next);
  },

  toggleToday: (id) => {
    const key = todayKey();
    const next = get().habits.map((h) => {
      if (h.id !== id) return h;
      const checked = !h.history[key];
      const history = { ...h.history, [key]: checked };
      if (!checked) delete history[key];
      return { ...h, history };
    });
    set({ habits: next });
    persist(next);
  },

  clearAll: async () => {
    await habitRepository.clear();
    set({ habits: [] });
  },
}));
