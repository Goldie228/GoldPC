import { Download } from 'lucide-react';
import { usePWAInstallPrompt } from '@/hooks/usePWAInstallPrompt';

export default function PWAInstallButton() {
  const { isInstallable, promptInstall } = usePWAInstallPrompt();

  if (!isInstallable) return null;

  return (
    <button
      onClick={promptInstall}
      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
    >
      <Download size={16} />
      <span>Install App</span>
    </button>
  );
}
