export type Category = {
  id: string;
  name: string;
  color: string;
  isDefault?: boolean;
};

export type Bookmark = {
  id: string;
  title: string;
  url: string;
  categoryId: string;
  /** 여러 개 태그(대소문자 구분 없이 중복 제거, 표시는 첫 입력 형태 유지) */
  tags?: string[];
  thumbnailUrl?: string;
  isPinned?: boolean;
  /** 마지막으로 카드 탭 또는 외부 브라우저로 연 시각(ms) */
  lastOpenedAt?: number;
  createdAt: number;
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-dev', name: '개발', color: '#0a7ea4', isDefault: true },
  { id: 'cat-youtube', name: '유튜브', color: '#e74c3c', isDefault: true },
  { id: 'cat-news', name: '뉴스', color: '#f39c12', isDefault: true },
  { id: 'cat-etc', name: '기타', color: '#7f8c8d', isDefault: true },
];

export const DEFAULT_CATEGORY_ID = 'cat-etc';

/** AsyncStorage에 저장되는 북마크 스토어 스냅샷 */
export type PersistedState = {
  bookmarks: Bookmark[];
  categories: Category[];
};
