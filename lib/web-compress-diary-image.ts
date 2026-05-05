import { Platform } from 'react-native';

const MAX_EDGE_PX = 1920;
const JPEG_QUALITY = 0.82;

/** data URL을 긴 변 기준으로 줄이고 JPEG로 재인코딩(웹 저장 용량·JSON 부담 완화) */
export async function compressDataUrlForDiary(dataUrl: string): Promise<string> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return dataUrl;
  }
  const ImgCtor = typeof Image !== 'undefined' ? Image : null;
  if (!ImgCtor) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new ImgCtor();
    img.onload = () => {
      try {
        const nw = img.naturalWidth || img.width;
        const nh = img.naturalHeight || img.height;
        if (!nw || !nh) {
          resolve(dataUrl);
          return;
        }

        let tw = nw;
        let th = nh;
        if (nw > MAX_EDGE_PX || nh > MAX_EDGE_PX) {
          if (nw >= nh) {
            tw = MAX_EDGE_PX;
            th = Math.round((nh * MAX_EDGE_PX) / nw);
          } else {
            th = MAX_EDGE_PX;
            tw = Math.round((nw * MAX_EDGE_PX) / nh);
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = tw;
        canvas.height = th;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, tw, th);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
