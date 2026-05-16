import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking, Platform } from 'react-native';

function permissionDeniedAlert(canAskAgain: boolean): void {
  if (Platform.OS === 'android') {
    const buttons: {
      text: string;
      style?: 'cancel' | 'destructive' | 'default';
      onPress?: () => void;
    }[] = [{ text: '닫기', style: 'cancel', onPress: () => {} }];

    if (canAskAgain) {
      buttons.push({
        text: '다시 요청',
        onPress: () => {
          void ImagePicker.requestMediaLibraryPermissionsAsync();
        },
      });
    }

    buttons.push({
      text: '설정 열기',
      onPress: () => void Linking.openSettings(),
    });

    Alert.alert(
      '사진 접근 필요',
      canAskAgain
        ? '갤러리를 쓰려면 사진·미디어 접근을 허용해 주세요. 거부 후에는 「다시 요청」으로 재시도하거나 설정에서 켤 수 있습니다.'
        : '더 이상 권한 창이 나오지 않을 수 있습니다. 설정에서 이 앱의 사진·미디어 권한을 켜 주세요.',
      buttons,
    );
    return;
  }

  Alert.alert('사진 접근 필요', '사진 라이브러리 접근을 허용해 주세요.', [
    { text: '닫기', style: 'cancel', onPress: () => {} },
    { text: '설정 열기', onPress: () => void Linking.openSettings() },
  ]);
}

/** 갤러리 권한 확인 후 요청. 거부 시 재요청·설정 안내(Android 중심) */
export async function ensureGalleryPermission(): Promise<boolean> {
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (current.granted) {
    return true;
  }

  const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (requested.granted) {
    return true;
  }

  permissionDeniedAlert(requested.canAskAgain !== false);
  return false;
}
