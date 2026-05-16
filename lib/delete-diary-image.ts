import { deleteAsync } from 'expo-file-system/legacy';
import { Platform } from 'react-native';

/** 앱이 복사해 둔 일기 이미지(file:///…/diary_*.jpg)만 삭제 */
export async function deleteDiaryImageFileIfOwned(uri: string | undefined): Promise<void> {
  if (Platform.OS === 'web' || !uri?.trim()) return;
  if (!uri.startsWith('file://')) return;
  if (!uri.includes('diary_')) return;
  try {
    await deleteAsync(uri, { idempotent: true });
  } catch {
    // 이미 없거나 접근 불가 — 무시
  }
}
