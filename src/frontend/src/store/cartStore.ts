import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductSummary } from '../api/types';
import { promoApi } from '../api/promo';

export interface CartItem {
  id: string;
  productId: string;
  productSlug?: string;
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
  discountAmount: number;
}

interface CartActions {
  addItem: (product: ProductSummary, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  validateAndApplyPromoCode: (code: string) => Promise<{ success: boolean; message: string }>;
  clearPromo: () => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  getDiscountedTotal: () => number;
  getDiscountAmount: () => number;
}

type CartStore = CartState & CartActions;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      promoCode: null,
      discount: 0,
      discountAmount: 0,

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
            productSlug: product.slug,
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

      validateAndApplyPromoCode: async (code) => {
        const state = get();
        const total = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        try {
          const result = await promoApi.validatePromoCode({
            code,
            orderAmount: total,
          });

          if (result.valid) {
            set({
              promoCode: code.toUpperCase(),
              discount: result.discount,
              discountAmount: result.discountAmount,
            });
            return { success: true, message: result.message };
          } else {
            return { success: false, message: result.message };
          }
        } catch (error) {
          return { success: false, message: 'Ошибка проверки промокода' };
        }
      },

      clearPromo: () => {
        set({ promoCode: null, discount: 0, discountAmount: 0 });
      },

      clearCart: () => {
        set({ items: [], promoCode: null, discount: 0, discountAmount: 0 });
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
        return Math.round(total - state.discountAmount);
      },

      getDiscountAmount: () => {
        const state = get();
        return state.discountAmount;
      },
    }),
    {
      name: 'goldpc-cart',
      partialize: (state) => ({
        items: state.items,
        promoCode: state.promoCode,
        discount: state.discount,
        discountAmount: state.discountAmount,
      }),
    }
  )
);

// Selector для получения общего количества товаров в корзине
export const useCartTotalItems = () =>
  useCartStore((state) => state.items.reduce((count, item) => count + item.quantity, 0));
