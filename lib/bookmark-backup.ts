import type { DocumentPickerAsset } from 'expo-document-picker';
import { File as ExpoFile } from 'expo-file-system';

import {
  Bookmark,
  Category,
  DEFAULT_CATEGORIES,
  type PersistedState,
} from '@/types/bookmark';

export const BACKUP_SCHEMA_VERSION = 1 as const;

export type BookmarkBackupFile = {
  schemaVersion: typeof BACKUP_SCHEMA_VERSION;
  exportedAt: string;
  /** AsyncStorage 키(같은 앱에서 복원 검증용, 다른 버전과 호환 시 참고) */
  storageKey: string;
  bookmarks: Bookmark[];
  categories: Category[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isBookmarkItem(value: unknown): value is Bookmark {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.url === 'string' &&
    typeof value.categoryId === 'string' &&
    typeof value.createdAt === 'number'
  );
}

function isCategoryItem(value: unknown): value is Category {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.color === 'string'
  );
}

export function mergePersistedState(local: PersistedState, remote: PersistedState): PersistedState {
  const remoteCats =
    remote.categories.length > 0 ? remote.categories : DEFAULT_CATEGORIES;
  const remoteCatById = new Map(remoteCats.map((c) => [c.id, c]));
  const mergedCategories = [
    ...local.categories.map((c) => remoteCatById.get(c.id) ?? c),
    ...remoteCats.filter((c) => !local.categories.some((lc) => lc.id === c.id)),
  ];

  const remoteBmById = new Map(remote.bookmarks.map((b) => [b.id, b]));
  const mergedBookmarks = [
    ...local.bookmarks.map((b) => remoteBmById.get(b.id) ?? b),
    ...remote.bookmarks.filter((b) => !local.bookmarks.some((lb) => lb.id === b.id)),
  ];

  return { categories: mergedCategories, bookmarks: mergedBookmarks };
}

export function serializeBackup(state: PersistedState, appStorageKey: string): string {
  const body: BookmarkBackupFile = {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    storageKey: appStorageKey,
    bookmarks: state.bookmarks,
    categories: state.categories,
  };
  return JSON.stringify(body, null, 2);
}

export function parseBackupJson(raw: string): PersistedState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('JSON을 읽을 수 없습니다.');
  }

  if (!isRecord(parsed)) {
    throw new Error('백업 파일 형식이 올바르지 않습니다.');
  }

  let bookmarksRaw: unknown;
  let categoriesRaw: unknown;

  if ('bookmarks' in parsed && 'categories' in parsed) {
    if ('schemaVersion' in parsed) {
      const v = parsed.schemaVersion;
      if (v !== BACKUP_SCHEMA_VERSION) {
        throw new Error(`지원하지 않는 백업 버전입니다 (${String(v)}).`);
      }
    }
    bookmarksRaw = parsed.bookmarks;
    categoriesRaw = parsed.categories;
  } else {
    throw new Error('북마크·카테고리 데이터가 없습니다.');
  }

  if (!Array.isArray(bookmarksRaw) || !Array.isArray(categoriesRaw)) {
    throw new Error('북마크·카테고리는 배열이어야 합니다.');
  }

  const bookmarks = bookmarksRaw.filter(isBookmarkItem);
  const categories = categoriesRaw.filter(isCategoryItem);

  if (bookmarks.length !== bookmarksRaw.length || categories.length !== categoriesRaw.length) {
    throw new Error('백업에 잘못된 항목이 포함되어 있습니다.');
  }

  return { bookmarks, categories };
}

function readWebFileAsText(file: globalThis.File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('파일을 읽지 못했습니다.'));
    reader.readAsText(file, 'utf-8');
  });
}

/** 문서 선택 결과에서 UTF-8 텍스트(백업 JSON)를 읽습니다. */
export async function readPickedAssetUtf8(asset: DocumentPickerAsset): Promise<string> {
  if (asset.file) {
    return readWebFileAsText(asset.file);
  }
  const f = new ExpoFile(asset.uri);
  return f.text();
}

export function backupFileName(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `zfree-bookmarks-backup-${y}${m}${day}.json`;
}
