import { create } from 'zustand';
import { DEFAULT_CATEGORY_ID, type CategoryId } from '@/constants/categories';
import { habitRepository } from '@/repository/habit-repository';
import { todayKey, type Habit } from '@/types/habit';

type HabitState = {
  habits: Habit[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addHabit: (name: string, emoji: string, categoryId?: CategoryId) => void;
  updateHabit: (
    id: string,
    name: string,
    emoji: string,
    categoryId?: CategoryId
  ) => void;
  deleteHabit: (id: string) => void;
  toggleToday: (id: string) => void;
  reorderHabits: (orderedIds: string[]) => void;
  clearAll: () => Promise<void>;
};

const persist = (habits: Habit[]) => {
  void habitRepository.save(habits);
};

const sortHabits = (habits: Habit[]) =>
  [...habits].sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);

const normalizeHabitOrders = (habits: Habit[]) =>
  sortHabits(
    habits.map((habit, index) => ({
      ...habit,
      order: typeof habit.order === 'number' ? habit.order : index,
      categoryId: habit.categoryId ?? DEFAULT_CATEGORY_ID,
    }))
  ).map((habit, index) => ({ ...habit, order: index }));

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  hydrated: false,

  hydrate: async () => {
    const habits = normalizeHabitOrders(await habitRepository.load());
    set({ habits, hydrated: true });
    if (habits.length > 0) {
      persist(habits);
    }
  },

  addHabit: (name, emoji, categoryId) => {
    const habits = get().habits;
    const newHabit: Habit = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      emoji: emoji || '⭐',
      createdAt: Date.now(),
      order: habits.length,
      history: {},
      categoryId: categoryId ?? DEFAULT_CATEGORY_ID,
    };
    const next = normalizeHabitOrders([...habits, newHabit]);
    set({ habits: next });
    persist(next);
  },

  updateHabit: (id, name, emoji, categoryId) => {
    const next = get().habits.map((h) =>
      h.id === id
        ? {
            ...h,
            name: name.trim(),
            emoji: emoji || h.emoji,
            categoryId: categoryId ?? h.categoryId ?? DEFAULT_CATEGORY_ID,
          }
        : h
    );
    set({ habits: next });
    persist(next);
  },

  deleteHabit: (id) => {
    const next = normalizeHabitOrders(get().habits.filter((h) => h.id !== id));
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

  reorderHabits: (orderedIds) => {
    const byId = new Map(get().habits.map((habit) => [habit.id, habit]));
    const ordered = orderedIds.flatMap((id) => {
      const habit = byId.get(id);
      return habit ? [habit] : [];
    });
    const missing = get().habits.filter((habit) => !orderedIds.includes(habit.id));
    const next = [...ordered, ...missing].map((habit, index) => ({
      ...habit,
      order: index,
    }));

    set({ habits: next });
    persist(next);
  },

  clearAll: async () => {
    await habitRepository.clear();
    set({ habits: [] });
  },
}));
