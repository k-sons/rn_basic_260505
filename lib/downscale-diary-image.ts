import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';

/** 긴 변 상한(픽셀). 초과 분만 JPEG로 줄임 — 디코딩·메모리 부담 완화 */
const MAX_EDGE_PX = 1920;

/**
 * 픽커가 준 가로·세로가 있으면 긴 변 기준으로 리사이즈,
 * 없으면 가로 기준(관행적 폴백).
 */
export async function downscaleDiaryImageUri(
  uri: string,
  widthHint?: number,
  heightHint?: number,
): Promise<string> {
  if (Platform.OS === 'web') {
    return uri;
  }
  try {
    const useHeight =
      widthHint != null && heightHint != null && heightHint > widthHint;
    const resize = useHeight ? { height: MAX_EDGE_PX } : { width: MAX_EDGE_PX };
    const { uri: out } = await manipulateAsync(uri, [{ resize }], {
      compress: 0.82,
      format: SaveFormat.JPEG,
    });
    return out;
  } catch {
    return uri;
  }
}
