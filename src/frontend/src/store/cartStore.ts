import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductSummary } from '../api/types';

export type CartItemType = 'product' | 'pcbundle' | 'service';

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
  /** Тип элемента корзины */
  itemType?: CartItemType;
  /** ID конфигурации ПК (для pcbundle) */
  pcConfigurationId?: string;
  /** Стоимость сборки (для pcbundle) */
  assemblyFee?: number;
  /** Компоненты бандла (для pcbundle) */
  bundleComponents?: BundleComponent[];
}

export interface BundleComponent {
  productId: string;
  productSlug?: string;
  productName: string;
  category: string;
  price: number;
  quantity: number;
  imageUrl?: string;
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
  addBundleItem: (bundle: {
    name: string;
    pcConfigurationId: string;
    assemblyFee: number;
    totalPrice: number;
    components: BundleComponent[];
  }) => void;
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

      addBundleItem: (bundle) => {
        set((state) => {
          const bundleId = crypto.randomUUID();
          // Use first component's image as the bundle thumbnail
          const firstImage = bundle.components.length > 0 ? bundle.components[0].imageUrl : undefined;
          const newBundleItem: CartItem = {
            id: bundleId,
            productId: bundleId,
            name: bundle.name,
            category: 'pcbundle',
            price: bundle.totalPrice,
            quantity: 1,
            imageUrl: firstImage,
            itemType: 'pcbundle',
            pcConfigurationId: bundle.pcConfigurationId,
            assemblyFee: bundle.assemblyFee,
            bundleComponents: bundle.components,
          };
          return { items: [...state.items, newBundleItem] };
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
            // NOTE: Extracting the promo code name via result.message.split(' ')[0] is fragile.
            // It relies on the human-readable message format (e.g. "SUMMER2025 — скидка 10%").
            // If the backend changes the message template, the extracted code will be wrong.
            // A proper fix: the backend should return the promo code text in a dedicated field.
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
        const total = state.getTotal();
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
        const state = persistedState as Partial<CartState>;
        return {
          items: Array.isArray(state.items) ? state.items : [],
          promoCode: typeof state.promoCode === 'string' ? state.promoCode : null,
          discount: typeof state.discount === 'number' ? state.discount : 0,
          discountAmount: typeof state.discountAmount === 'number' ? state.discountAmount : 0,
        };
      },
    }
  )
);

// Selector для получения общего количества товаров в корзине
export const useCartTotalItems = () =>
  useCartStore((state) => state.items.reduce((count, item) => count + item.quantity, 0));
