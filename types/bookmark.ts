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
  thumbnailUrl?: string;
  createdAt: number;
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-dev', name: '개발', color: '#0a7ea4', isDefault: true },
  { id: 'cat-youtube', name: '유튜브', color: '#e74c3c', isDefault: true },
  { id: 'cat-news', name: '뉴스', color: '#f39c12', isDefault: true },
  { id: 'cat-etc', name: '기타', color: '#7f8c8d', isDefault: true },
];

export const DEFAULT_CATEGORY_ID = 'cat-etc';
