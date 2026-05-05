/** 태그 문자열 정규화(앞뒤 공백 제거, 빈 문자열 제외) */
export function normalizeTagLabel(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

function dedupeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tags) {
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

/**
 * 쉼표·공백 등으로 구분된 입력을 태그 배열로 변환합니다.
 * - 쉼표(영문/전각)·줄바꿈으로 구문
 * - 각 토큰 내 연속 공백은 하나로 축약
 */
export function parseTagsFromInput(raw: string): string[] {
  if (!raw.trim()) return [];
  const parts = raw
    .split(/[,，\n]+/u)
    .flatMap((segment) => segment.split(/\s+/u))
    .map((s) => normalizeTagLabel(s))
    .filter(Boolean);
  return dedupeTags(parts);
}

export function normalizeBookmarkTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const tags = value
    .map((t) => normalizeTagLabel(String(t)))
    .filter(Boolean);
  return dedupeTags(tags);
}

export function bookmarkHasTag(bookmarkTags: string[] | undefined, needle: string): boolean {
  const q = needle.trim().toLowerCase();
  if (!q) return true;
  const tags = bookmarkTags ?? [];
  return tags.some((t) => t.toLowerCase() === q);
}

export function bookmarkMatchesQuery(
  bookmark: { title: string; url: string; tags?: string[] },
  qLower: string
): boolean {
  if (!qLower) return true;
  if (bookmark.title.toLowerCase().includes(qLower)) return true;
  if (bookmark.url.toLowerCase().includes(qLower)) return true;
  for (const t of bookmark.tags ?? []) {
    if (t.toLowerCase().includes(qLower)) return true;
  }
  return false;
}
