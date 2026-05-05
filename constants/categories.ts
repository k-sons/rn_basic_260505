export type CategoryId = 'exercise' | 'study' | 'health' | 'life' | 'etc';

export type HabitCategory = {
  id: CategoryId;
  label: string;
  emoji: string;
  color: string;
  soft: string;
};

export const HABIT_CATEGORIES: HabitCategory[] = [
  {
    id: 'exercise',
    label: '운동',
    emoji: '💪',
    color: '#ef4444',
    soft: 'rgba(239,68,68,0.14)',
  },
  {
    id: 'study',
    label: '공부',
    emoji: '📚',
    color: '#3b82f6',
    soft: 'rgba(59,130,246,0.14)',
  },
  {
    id: 'health',
    label: '건강',
    emoji: '🥗',
    color: '#22c55e',
    soft: 'rgba(34,197,94,0.14)',
  },
  {
    id: 'life',
    label: '생활',
    emoji: '🏠',
    color: '#f59e0b',
    soft: 'rgba(245,158,11,0.16)',
  },
  {
    id: 'etc',
    label: '기타',
    emoji: '⭐',
    color: '#6b7280',
    soft: 'rgba(107,114,128,0.16)',
  },
];

export const DEFAULT_CATEGORY_ID: CategoryId = 'etc';

const CATEGORY_MAP: Record<CategoryId, HabitCategory> = HABIT_CATEGORIES.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<CategoryId, HabitCategory>
);

export const getCategory = (id?: string | null): HabitCategory => {
  if (id && (id in CATEGORY_MAP)) {
    return CATEGORY_MAP[id as CategoryId];
  }
  return CATEGORY_MAP[DEFAULT_CATEGORY_ID];
};
