import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductSummary } from '../api/types';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  product?: ProductSummary;
}

interface CartState {
  items: CartItem[];
  promoCode: string | null;
  discount: number;
}

interface CartActions {
  addItem: (product: ProductSummary, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  applyPromoCode: (code: string) => boolean;
  clearPromo: () => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  getDiscountedTotal: () => number;
}

type CartStore = CartState & CartActions;

// Доступные промокоды
const PROMO_CODES: Record<string, number> = {
  GOLDPC: 5,
  GOLDPC10: 10,
  SAVE15: 15,
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      promoCode: null,
      discount: 0,

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find((i) => i.productId === product.id);
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.productId === product.id
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          const newItem: CartItem = {
            id: crypto.randomUUID(),
            productId: product.id,
            name: product.name,
            category: product.category,
            price: product.price,
            quantity,
            imageUrl: product.mainImage?.url,
            product,
          };
          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((item) => item.productId !== productId),
            };
          }
          return {
            items: state.items.map((item) =>
              item.productId === productId ? { ...item, quantity } : item
            ),
          };
        });
      },

      applyPromoCode: (code) => {
        const discount = PROMO_CODES[code.toUpperCase()];
        if (discount) {
          set({ promoCode: code.toUpperCase(), discount });
          return true;
        }
        return false;
      },

      clearPromo: () => {
        set({ promoCode: null, discount: 0 });
      },

      clearCart: () => {
        set({ items: [], promoCode: null, discount: 0 });
      },

      getTotal: () => {
        const state = get();
        return state.items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      getItemCount: () => {
        const state = get();
        return state.items.reduce((count, item) => count + item.quantity, 0);
      },

      getDiscountedTotal: () => {
        const state = get();
        const total = state.items.reduce((total, item) => total + item.price * item.quantity, 0);
        return Math.round(total * (1 - state.discount / 100));
      },
    }),
    {
      name: 'goldpc-cart',
      partialize: (state) => ({
        items: state.items,
        promoCode: state.promoCode,
        discount: state.discount,
      }),
    }
  )
);
