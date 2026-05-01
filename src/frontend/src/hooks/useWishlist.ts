/**
 * useWishlist Hook - Управление списком желаний
 */
import { useWishlistStore } from '../store/wishlistStore';

export interface UseWishlistReturn {
  items: string[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => void;
  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  clearWishlist: () => void;
  getCount: () => number;
  syncWithServer: () => Promise<void>;
}

export function useWishlist(): UseWishlistReturn {
  const items = useWishlistStore((state) => state.items);
  const isInWishlist = useWishlistStore((state) => state.isInWishlist);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const addItem = useWishlistStore((state) => state.addItem);
  const removeItem = useWishlistStore((state) => state.removeItem);
  const clearWishlist = useWishlistStore((state) => state.clearWishlist);
  const getCount = useWishlistStore((state) => state.getCount);
  const syncWithServer = useWishlistStore((state) => state.syncWithServer);

  return {
    items,
    isInWishlist,
    toggleWishlist,
    addItem,
    removeItem,
    clearWishlist,
    getCount,
    syncWithServer,
  };
}

export default useWishlist;