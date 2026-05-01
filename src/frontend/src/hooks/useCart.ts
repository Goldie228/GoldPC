import { useState, useCallback } from 'react';
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

  const validateAndApplyPromo = useCallback(async (code: string): Promise<{ success: boolean; message: string }> => {
    setIsValidatingPromo(true);
    setPromoError(null);

    try {
      const total = store.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
  };
}