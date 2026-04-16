import { registerSW } from 'virtual:pwa-register';

export function initializePWA() {
  const updateSW = registerSW({
    onNeedRefresh() {
      // Show refresh notification when new version is available
      if (confirm('New version available! Refresh to update?')) {
        updateSW(true);
      }
    },
    onOfflineReady() {
      console.log('✅ GoldPC PWA is ready for offline use');
    },
    onRegistered(r) {
      console.log('✅ Service Worker registered:', r?.scope);

      // Setup background sync for mutations
      if (r?.active && 'BackgroundSyncManager' in window) {
        console.log('✅ Background Sync available');
      }
    },
    onRegisterError(error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  });
}
