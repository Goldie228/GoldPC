import { useState, useCallback, useMemo } from 'react';
import { useCartStore, type PromoValidationResult } from '../store/cartStore';
import { promoApi } from '../api/promo';
import type { ProductSummary } from '../api/types';

/**
 * Хук для работы с корзиной
 * Предоставляет удобный интерфейс для взаимодействия с cartStore
 */
export function useCart() {
  const store = useCartStore();

  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Вычисляемые значения (мемоизированы по items)
  const items = store.items;
  const totalPrice = useMemo(() => store.getTotal(), [items]);
  const itemCount = useMemo(() => store.getItemCount(), [items]);
  const discountedTotal = useMemo(() => store.getDiscountedTotal(), [items]);
  const discountAmount = useMemo(() => totalPrice - discountedTotal, [totalPrice, discountedTotal]);

  // Обёртки для действий
  const addToCart = useCallback((product: ProductSummary, quantity = 1) => {
    store.addItem(product, quantity);
  }, [store]);

  const removeFromCart = useCallback((productId: string) => {
    store.removeItem(productId);
  }, [store]);

  const changeQuantity = useCallback((productId: string, delta: number) => {
    const item = store.items.find((i) => i.productId === productId);
    if (item != null) {
      store.updateQuantity(productId, item.quantity + delta);
    }
  }, [store]);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    store.updateQuantity(productId, quantity);
  }, [store]);

  // Backward-compatible alias (used in some components)
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    store.updateQuantity(productId, quantity);
  }, [store]);

  const validateAndApplyPromo = useCallback(async (code: string): Promise<{ success: boolean; message: string }> => {
    setIsValidatingPromo(true);
    setPromoError(null);

    try {
      const total = store.getTotal();

      const result = await promoApi.validatePromoCode({
        code,
        orderAmount: total,
      });

      const promoResult: PromoValidationResult = {
        valid: result.valid,
        discount: result.discount,
        message: result.message,
        discountAmount: result.discountAmount,
      };

      store.setPromoResult(promoResult);

      return { success: result.valid, message: result.message };
    } catch (error) {
      const errorMessage = 'Ошибка проверки промокода';
      setPromoError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsValidatingPromo(false);
    }
  }, [store]);

  const clearPromoCode = useCallback(() => {
    store.clearPromo();
  }, [store]);

  const emptyCart = useCallback(() => {
    store.clearCart();
  }, [store]);

  const isInCart = useCallback((productId: string): boolean => {
    return store.items.some((item) => item.productId === productId);
  }, [store.items]);

  const getItemQuantity = useCallback((productId: string): number => {
    const item = store.items.find((i) => i.productId === productId);
    return item?.quantity ?? 0;
  }, [store.items]);

  return useMemo(() => ({
    // Состояние
    items,
    promoCode: store.promoCode,
    discount: store.discount,
    isEmpty: items.length === 0,

    // Вычисляемые значения
    totalPrice,
    itemCount,
    discountedTotal,
    discountAmount,

    // Состояние валидации промокода
    isValidatingPromo,
    promoError,

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
  }), [
    items, store.promoCode, store.discount,
    totalPrice, itemCount, discountedTotal, discountAmount,
    isValidatingPromo, promoError,
    addToCart, removeFromCart, changeQuantity, setQuantity, updateQuantity,
    validateAndApplyPromo, clearPromoCode, emptyCart,
    isInCart, getItemQuantity,
  ]);
}