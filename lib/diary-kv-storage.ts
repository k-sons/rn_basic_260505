import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { webDiaryIdbGet, webDiaryIdbSet } from '@/lib/diary-web-idb';

/** 웹: IndexedDB 우선(대용량에 유리). 없으면 AsyncStorage(localStorage)에서 읽고 IDB로 이전 */
export async function loadDiaryPayload(storageKey: string): Promise<string | null> {
  if (Platform.OS !== 'web') {
    return AsyncStorage.getItem(storageKey);
  }

  if (typeof indexedDB === 'undefined') {
    return AsyncStorage.getItem(storageKey);
  }

  try {
    const fromIdb = await webDiaryIdbGet(storageKey);
    if (fromIdb !== null) {
      return fromIdb;
    }
    const legacy = await AsyncStorage.getItem(storageKey);
    if (legacy !== null) {
      await webDiaryIdbSet(storageKey, legacy);
      await AsyncStorage.removeItem(storageKey).catch(() => {});
    }
    return legacy;
  } catch {
    return AsyncStorage.getItem(storageKey);
  }
}

/** 웹: IndexedDB 저장 후 로컬 스토리지 중복 제거. IDB 불가 시 AsyncStorage 폴백 */
export async function saveDiaryPayload(storageKey: string, json: string): Promise<void> {
  if (Platform.OS !== 'web') {
    await AsyncStorage.setItem(storageKey, json);
    return;
  }

  if (typeof indexedDB === 'undefined') {
    await AsyncStorage.setItem(storageKey, json);
    return;
  }

  try {
    await webDiaryIdbSet(storageKey, json);
    await AsyncStorage.removeItem(storageKey).catch(() => {});
  } catch {
    await AsyncStorage.setItem(storageKey, json);
  }
}
