import { useState, useEffect } from 'react';

export function usePWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setInstallPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) return false;

    // @ts-expect-error prompt method exists on the event
    await installPrompt.prompt();
    // @ts-expect-error userChoice exists on the event
    const choiceResult = await installPrompt.userChoice;

    if (choiceResult.outcome === 'accepted') {
      setIsInstallable(false);
      setInstallPrompt(null);
      setIsInstalled(true);
      return true;
    }

    return false;
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall
  };
}
