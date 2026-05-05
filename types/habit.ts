import type { CategoryId } from '@/constants/categories';

export type Habit = {
  id: string;
  name: string;
  emoji: string;
  createdAt: number;
  order: number;
  history: Record<string, boolean>;
  categoryId?: CategoryId;
};

export const todayKey = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const dateFromKey = (key: string): Date | null => {
  const [year, month, day] = key.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const daysBetween = (from: string, to: string): number | null => {
  const fromDate = dateFromKey(from);
  const toDate = dateFromKey(to);
  if (!fromDate || !toDate) return null;

  const fromMidnight = new Date(
    fromDate.getFullYear(),
    fromDate.getMonth(),
    fromDate.getDate()
  ).getTime();
  const toMidnight = new Date(
    toDate.getFullYear(),
    toDate.getMonth(),
    toDate.getDate()
  ).getTime();

  return Math.round((toMidnight - fromMidnight) / 86400000);
};

export const getCurrentStreak = (
  history: Habit['history'],
  date: Date = new Date()
): number => {
  let streak = 0;
  const cursor = new Date(date);

  while (history[todayKey(cursor)]) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

export const getBestStreak = (history: Habit['history']): number => {
  const doneKeys = Object.keys(history)
    .filter((key) => history[key] && dateFromKey(key))
    .sort();

  let best = 0;
  let current = 0;
  let previousKey: string | null = null;

  for (const key of doneKeys) {
    const diff = previousKey ? daysBetween(previousKey, key) : null;
    current = diff === 1 ? current + 1 : 1;
    best = Math.max(best, current);
    previousKey = key;
  }

  return best;
};
