import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { deleteDiaryImageFileIfOwned } from '@/lib/delete-diary-image';
import {
  needsRootFormatUpgrade,
  parseDiaryStorage,
  stringifyDiaryDocument,
} from '@/lib/diary-format';
import {
  DIARY_STORAGE_FORMAT_VERSION,
  type DiaryEntry,
  type DiaryMap,
  type PersistResult,
} from '@/types/diary';

const STORAGE_KEY = '@diary_photo_memo_v1';

type DiaryState = {
  entries: DiaryMap;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setEntry: (dateKey: string, entry: DiaryEntry) => Promise<PersistResult>;
  removeEntry: (dateKey: string) => Promise<PersistResult>;
};

async function writeStorage(entries: DiaryMap): Promise<PersistResult> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, stringifyDiaryDocument(entries));
    return { ok: true };
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    return { ok: false, error };
  }
}

export const useDiaryStore = create<DiaryState>((set, get) => ({
  entries: {},
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const entries = parseDiaryStorage(raw);
      set({ entries, hydrated: true });

      if (raw && needsRootFormatUpgrade(raw)) {
        await writeStorage(entries);
      }
    } catch {
      set({ hydrated: true });
    }
  },

  setEntry: async (dateKey, entry) => {
    const snapshot = get().entries;
    const prev = snapshot[dateKey];
    const isEmpty = !entry.imageUri?.trim() && !entry.memo.trim();

    const next: DiaryMap = { ...snapshot };
    if (isEmpty) {
      delete next[dateKey];
    } else {
      next[dateKey] = {
        ...entry,
        schemaVersion: DIARY_STORAGE_FORMAT_VERSION,
      };
    }

    set({ entries: next });

    const persisted = await writeStorage(next);
    if (!persisted.ok) {
      set({ entries: snapshot });
      return persisted;
    }

    const prevUri = prev?.imageUri?.trim();
    const newUri = next[dateKey]?.imageUri?.trim();
    if (prevUri && prevUri !== newUri) {
      await deleteDiaryImageFileIfOwned(prevUri);
    }

    return { ok: true };
  },

  removeEntry: async (dateKey) => {
    const snapshot = get().entries;
    const prev = snapshot[dateKey];
    if (!prev) {
      return { ok: true };
    }

    const next: DiaryMap = { ...snapshot };
    delete next[dateKey];

    set({ entries: next });

    const persisted = await writeStorage(next);
    if (!persisted.ok) {
      set({ entries: snapshot });
      return persisted;
    }

    await deleteDiaryImageFileIfOwned(prev.imageUri);
    return { ok: true };
  },
}));
