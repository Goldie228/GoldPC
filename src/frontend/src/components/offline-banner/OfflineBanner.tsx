import { Wifi, WifiOff } from 'lucide-react';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { motion } from 'framer-motion';

export default function OfflineBanner() {
  const { isOffline } = useOfflineStatus();

  if (!isOffline) return null;

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      exit={{ y: -100 }}
      className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-900 px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium shadow-md"
    >
      <WifiOff size={16} />
      <span>You are offline. Changes will be synced automatically when connection is restored.</span>
    </motion.div>
  );
}
