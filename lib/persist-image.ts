import { copyAsync, documentDirectory } from 'expo-file-system/legacy';
import { Platform } from 'react-native';

/** 웹 blob/data URL을 새로고침 후에도 살아있게 data URL로 통일 */
export async function ensurePersistableUri(uri: string): Promise<string> {
  if (Platform.OS !== 'web') return uri;
  if (uri.startsWith('data:')) return uri;
  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return uri;
  }
}

/** 네이티브: documentDirectory로 복사해 URI 안정화. 웹: data URL 그대로 반환. */
export async function persistPickedImage(sourceUri: string, dateKey: string): Promise<string> {
  if (Platform.OS === 'web') {
    return sourceUri;
  }
  const safe = dateKey.replace(/[^0-9-]/g, '');
  const dest = `${documentDirectory ?? ''}diary_${safe}.jpg`;
  if (!documentDirectory) {
    return sourceUri;
  }
  try {
    await copyAsync({ from: sourceUri, to: dest });
    return dest;
  } catch {
    return sourceUri;
  }
}
