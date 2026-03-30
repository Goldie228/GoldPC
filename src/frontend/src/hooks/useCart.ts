import { useCartStore } from '../store/cartStore';
import type { ProductSummary } from '../api/types';

/**
 * Хук для работы с корзиной
 * Предоставляет удобный интерфейс для взаимодействия с cartStore
 */
export function useCart() {
  const store = useCartStore();

  // Вычисляемые значения
  const totalPrice = store.getTotal();
  const itemCount = store.getItemCount();
  const discountedTotal = store.getDiscountedTotal();
  const discountAmount = totalPrice - discountedTotal;

  // Обёртки для действий
  const addToCart = (product: ProductSummary, quantity = 1) => {
    store.addItem(product, quantity);
  };

  const removeFromCart = (productId: string) => {
    store.removeItem(productId);
  };

  const changeQuantity = (productId: string, delta: number) => {
    const item = store.items.find((i) => i.productId === productId);
    if (item) {
      store.updateQuantity(productId, item.quantity + delta);
    }
  };

  const setQuantity = (productId: string, quantity: number) => {
    store.updateQuantity(productId, quantity);
  };

  // Backward-compatible alias (used in some components)
  const updateQuantity = (productId: string, quantity: number) => {
    store.updateQuantity(productId, quantity);
  };

  const validateAndApplyPromo = async (code: string): Promise<{ success: boolean; message: string }> => {
    return store.validateAndApplyPromoCode(code);
  };

  const clearPromoCode = () => {
    store.clearPromo();
  };

  const emptyCart = () => {
    store.clearCart();
  };

  const isInCart = (productId: string): boolean => {
    return store.items.some((item) => item.productId === productId);
  };

  const getItemQuantity = (productId: string): number => {
    const item = store.items.find((i) => i.productId === productId);
    return item?.quantity ?? 0;
  };

  return {
    // Состояние
    items: store.items,
    promoCode: store.promoCode,
    discount: store.discount,
    isEmpty: store.items.length === 0,

    // Вычисляемые значения
    totalPrice,
    itemCount,
    discountedTotal,
    discountAmount,

    // Действия
    addToCart,
    removeFromCart,
    changeQuantity,
    setQuantity,
    updateQuantity,
    validateAndApplyPromo,
    clearPromoCode,
    emptyCart,

    // Утилиты
    isInCart,
    getItemQuantity,
  };
}