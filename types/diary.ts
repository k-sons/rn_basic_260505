/** AsyncStorage 문서·항목 마이그레이션용 버전 */
export const DIARY_STORAGE_FORMAT_VERSION = 2 as const;

export type DiaryEntry = {
  imageUri: string;
  memo: string;
  schemaVersion?: number;
};

export type DiaryMap = Record<string, DiaryEntry>;

export type DiaryPersistedDocument = {
  formatVersion: typeof DIARY_STORAGE_FORMAT_VERSION;
  entries: DiaryMap;
};

export type PersistResult = { ok: true } | { ok: false; error: Error };
