import { isValidDateKey } from '@/lib/date-key';
import { DIARY_STORAGE_FORMAT_VERSION, type DiaryMap } from '@/types/diary';

function isDateKey(key: string): boolean {
  return isValidDateKey(key);
}

function normalizeEntry(value: unknown): { imageUri: string; memo: string } | null {
  if (!value || typeof value !== 'object') return null;
  const o = value as { imageUri?: unknown; memo?: unknown };
  const imageUri = typeof o.imageUri === 'string' ? o.imageUri : '';
  const memo = typeof o.memo === 'string' ? o.memo : '';
  return { imageUri, memo };
}

/** 레거시: 최상위가 `{ "YYYY-MM-DD": {...} }` 만 있는 JSON */
export function needsRootFormatUpgrade(raw: string | null): boolean {
  if (!raw) return false;
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    if (!data || typeof data !== 'object') return false;
    if ('formatVersion' in data || 'entries' in data) return false;
    return Object.keys(data).some(isDateKey);
  } catch {
    return false;
  }
}

export function parseDiaryStorage(raw: string | null): DiaryMap {
  if (!raw) return {};
  try {
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== 'object') return {};

    const root = data as Record<string, unknown>;
    if ('entries' in root && root.entries && typeof root.entries === 'object') {
      const out: DiaryMap = {};
      for (const [k, v] of Object.entries(root.entries as Record<string, unknown>)) {
        if (!isDateKey(k)) continue;
        const n = normalizeEntry(v);
        if (n) out[k] = { ...n, schemaVersion: DIARY_STORAGE_FORMAT_VERSION };
      }
      return out;
    }

    const out: DiaryMap = {};
    for (const [k, v] of Object.entries(root)) {
      if (!isDateKey(k)) continue;
      const n = normalizeEntry(v);
      if (n) out[k] = { ...n, schemaVersion: DIARY_STORAGE_FORMAT_VERSION };
    }
    return out;
  } catch {
    return {};
  }
}

export function stringifyDiaryDocument(entries: DiaryMap): string {
  return JSON.stringify({
    formatVersion: DIARY_STORAGE_FORMAT_VERSION,
    entries,
  });
}
