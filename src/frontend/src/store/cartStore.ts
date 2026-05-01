import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductSummary } from '../api/types';

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

export interface PromoValidationResult {
  valid: boolean;
  discount: number;
  message: string;
  discountAmount: number;
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
  setPromoResult: (result: PromoValidationResult) => void;
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

      setPromoResult: (result) => {
        if (result.valid) {
          set({
            promoCode: result.discount > 0 ? result.message.split(' ')[0] : null,
            discount: result.discount,
            discountAmount: result.discountAmount,
          });
        } else {
          set({
            promoCode: null,
            discount: 0,
            discountAmount: 0,
          });
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
      migrate: (persistedState: unknown, _version: number) => {
        return persistedState as CartState;
      },
    }
  )
);

// Selector для получения общего количества товаров в корзине
export const useCartTotalItems = () =>
  useCartStore((state) => state.items.reduce((count, item) => count + item.quantity, 0));
