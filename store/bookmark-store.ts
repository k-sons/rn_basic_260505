import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import {
  Bookmark,
  Category,
  DEFAULT_CATEGORIES,
  DEFAULT_CATEGORY_ID,
} from '@/types/bookmark';

const STORAGE_KEY = '@rn_basic_260505/bookmark_store_v1';

type PersistedState = {
  bookmarks: Bookmark[];
  categories: Category[];
};

type BookmarkStore = PersistedState & {
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  resetAll: () => Promise<void>;

  addBookmark: (input: Omit<Bookmark, 'id' | 'createdAt'>) => void;
  updateBookmark: (id: string, patch: Partial<Omit<Bookmark, 'id' | 'createdAt'>>) => void;
  removeBookmark: (id: string) => void;
  getBookmark: (id: string) => Bookmark | undefined;

  addCategory: (input: { name: string; color: string }) => void;
  updateCategory: (id: string, patch: Partial<Pick<Category, 'name' | 'color'>>) => void;
  removeCategory: (id: string) => void;
};

const generateId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

async function persist(state: PersistedState) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[bookmark-store] persist failed', e);
  }
}

function snapshot(state: BookmarkStore): PersistedState {
  return { bookmarks: state.bookmarks, categories: state.categories };
}

export const useBookmarkStore = create<BookmarkStore>((set, get) => ({
  bookmarks: [],
  categories: DEFAULT_CATEGORIES,
  hasHydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedState>;
        const categories =
          parsed.categories && parsed.categories.length > 0
            ? parsed.categories
            : DEFAULT_CATEGORIES;
        set({
          bookmarks: parsed.bookmarks ?? [],
          categories,
          hasHydrated: true,
        });
      } else {
        set({ hasHydrated: true });
      }
    } catch (e) {
      console.warn('[bookmark-store] hydrate failed', e);
      set({ hasHydrated: true });
    }
  },

  resetAll: async () => {
    set({ bookmarks: [], categories: DEFAULT_CATEGORIES });
    await persist(snapshot(get()));
  },

  addBookmark: (input) => {
    const bookmark: Bookmark = {
      id: generateId('bm'),
      createdAt: Date.now(),
      ...input,
    };
    set((s) => ({ bookmarks: [bookmark, ...s.bookmarks] }));
    persist(snapshot(get()));
  },

  updateBookmark: (id, patch) => {
    set((s) => ({
      bookmarks: s.bookmarks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
    persist(snapshot(get()));
  },

  removeBookmark: (id) => {
    set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== id) }));
    persist(snapshot(get()));
  },

  getBookmark: (id) => get().bookmarks.find((b) => b.id === id),

  addCategory: ({ name, color }) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const cat: Category = { id: generateId('cat'), name: trimmed, color };
    set((s) => ({ categories: [...s.categories, cat] }));
    persist(snapshot(get()));
  },

  updateCategory: (id, patch) => {
    set((s) => ({
      categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
    persist(snapshot(get()));
  },

  removeCategory: (id) => {
    const target = get().categories.find((c) => c.id === id);
    if (!target || target.isDefault) return;
    set((s) => ({
      categories: s.categories.filter((c) => c.id !== id),
      bookmarks: s.bookmarks.map((b) =>
        b.categoryId === id ? { ...b, categoryId: DEFAULT_CATEGORY_ID } : b
      ),
    }));
    persist(snapshot(get()));
  },
}));
