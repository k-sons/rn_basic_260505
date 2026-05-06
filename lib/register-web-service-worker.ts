import { Platform } from 'react-native';

export function registerWebServiceWorker() {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    const basePath = new URL(document.baseURI).pathname;
    const swUrl = `${basePath.replace(/\/$/, '')}/service-worker.js`;
    void navigator.serviceWorker.register(swUrl, { scope: basePath }).catch(() => {});
  });
}
