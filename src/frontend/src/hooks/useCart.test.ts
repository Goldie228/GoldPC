import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ProductSummary } from '../api/types';

// ─── Mocks ──────────────────────────────────────────────────────

const mockAddItem = vi.fn();
const mockRemoveItem = vi.fn();
const mockUpdateQuantity = vi.fn();
const mockClearCart = vi.fn();
const mockClearPromo = vi.fn();
const mockSetPromoResult = vi.fn();
const mockGetTotal = vi.fn(() => 0);
const mockGetItemCount = vi.fn(() => 0);
const mockGetDiscountedTotal = vi.fn(() => 0);

let mockItems: Array<{ productId: string; quantity: number; price: number; name: string; category: string; id: string }> = [];

vi.mock('../store/cartStore', () => ({
  useCartStore: vi.fn(() => ({
    get items() { return mockItems; },
    promoCode: null,
    discount: 0,
    addItem: mockAddItem,
    removeItem: mockRemoveItem,
    updateQuantity: mockUpdateQuantity,
    setPromoResult: mockSetPromoResult,
    clearPromo: mockClearPromo,
    clearCart: mockClearCart,
    getTotal: mockGetTotal,
    getItemCount: mockGetItemCount,
    getDiscountedTotal: mockGetDiscountedTotal,
    getDiscountAmount: vi.fn(() => 0),
  })),
}));

vi.mock('../api/promo', () => ({
  promoApi: {
    validatePromoCode: vi.fn(),
  },
}));

import { useCart } from './useCart';
import { promoApi } from '../api/promo';

// ─── Helpers ────────────────────────────────────────────────────

function makeProduct(overrides: Partial<ProductSummary> = {}): ProductSummary {
  return {
    id: 'prod-1',
    name: 'Test Product',
    sku: 'SKU-001',
    category: 'cpu',
    price: 199.99,
    stock: 10,
    isActive: true,
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────────

describe('hooks/useCart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockItems = [];
    mockGetTotal.mockReturnValue(0);
    mockGetItemCount.mockReturnValue(0);
    mockGetDiscountedTotal.mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── addToCart ────────────────────────────────────────────────

  describe('addToCart', () => {
    it('calls store.addItem with product and default quantity 1', () => {
      const { result } = renderHook(() => useCart());
      const product = makeProduct();

      act(() => {
        result.current.addToCart(product);
      });

      expect(mockAddItem).toHaveBeenCalledWith(product, 1);
    });

    it('calls store.addItem with custom quantity', () => {
      const { result } = renderHook(() => useCart());
      const product = makeProduct({ id: 'prod-2' });

      act(() => {
        result.current.addToCart(product, 5);
      });

      expect(mockAddItem).toHaveBeenCalledWith(product, 5);
    });
  });

  // ─── removeFromCart ───────────────────────────────────────────

  describe('removeFromCart', () => {
    it('calls store.removeItem with productId', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.removeFromCart('prod-1');
      });

      expect(mockRemoveItem).toHaveBeenCalledWith('prod-1');
    });

    it('works with different product ids', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.removeFromCart('prod-abc');
      });

      expect(mockRemoveItem).toHaveBeenCalledWith('prod-abc');
    });
  });

  // ─── changeQuantity ───────────────────────────────────────────

  describe('changeQuantity', () => {
    it('increases quantity by delta when item exists', () => {
      mockItems = [
        { id: '1', productId: 'prod-1', quantity: 3, price: 10, name: 'P1', category: 'cpu' },
      ];

      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.changeQuantity('prod-1', 2);
      });

      expect(mockUpdateQuantity).toHaveBeenCalledWith('prod-1', 5);
    });

    it('decreases quantity by negative delta', () => {
      mockItems = [
        { id: '1', productId: 'prod-1', quantity: 5, price: 10, name: 'P1', category: 'cpu' },
      ];

      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.changeQuantity('prod-1', -2);
      });

      expect(mockUpdateQuantity).toHaveBeenCalledWith('prod-1', 3);
    });

    it('does nothing when item is not in cart', () => {
      mockItems = [];

      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.changeQuantity('nonexistent', 1);
      });

      expect(mockUpdateQuantity).not.toHaveBeenCalled();
    });
  });

  // ─── setQuantity ──────────────────────────────────────────────

  describe('setQuantity', () => {
    it('calls store.updateQuantity with absolute value', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.setQuantity('prod-1', 10);
      });

      expect(mockUpdateQuantity).toHaveBeenCalledWith('prod-1', 10);
    });
  });

  // ─── emptyCart ────────────────────────────────────────────────

  describe('emptyCart', () => {
    it('calls store.clearCart', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.emptyCart();
      });

      expect(mockClearCart).toHaveBeenCalled();
    });
  });

  // ─── clearPromoCode ───────────────────────────────────────────

  describe('clearPromoCode', () => {
    it('calls store.clearPromo', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.clearPromoCode();
      });

      expect(mockClearPromo).toHaveBeenCalled();
    });
  });

  // ─── isInCart / getItemQuantity ───────────────────────────────

  describe('isInCart', () => {
    it('returns true when product is in cart', () => {
      mockItems = [
        { id: '1', productId: 'prod-1', quantity: 1, price: 10, name: 'P1', category: 'cpu' },
      ];

      const { result } = renderHook(() => useCart());

      expect(result.current.isInCart('prod-1')).toBe(true);
    });

    it('returns false when product is not in cart', () => {
      mockItems = [];

      const { result } = renderHook(() => useCart());

      expect(result.current.isInCart('prod-1')).toBe(false);
    });
  });

  describe('getItemQuantity', () => {
    it('returns quantity when product is in cart', () => {
      mockItems = [
        { id: '1', productId: 'prod-1', quantity: 7, price: 10, name: 'P1', category: 'cpu' },
      ];

      const { result } = renderHook(() => useCart());

      expect(result.current.getItemQuantity('prod-1')).toBe(7);
    });

    it('returns 0 when product is not in cart', () => {
      mockItems = [];

      const { result } = renderHook(() => useCart());

      expect(result.current.getItemQuantity('prod-1')).toBe(0);
    });
  });

  // ─── вычисляемые values ──────────────────────────────────────────

  describe('computed values', () => {
    it('isEmpty is true when cart has no items', () => {
      mockItems = [];
      const { result } = renderHook(() => useCart());
      expect(result.current.isEmpty).toBe(true);
    });

    it('isEmpty is false when cart has items', () => {
      mockItems = [
        { id: '1', productId: 'prod-1', quantity: 1, price: 10, name: 'P1', category: 'cpu' },
      ];
      const { result } = renderHook(() => useCart());
      expect(result.current.isEmpty).toBe(false);
    });

    it('totalPrice and itemCount delegate to store', () => {
      mockGetTotal.mockReturnValue(599.97);
      mockGetItemCount.mockReturnValue(3);
      mockGetDiscountedTotal.mockReturnValue(539.97);

      const { result } = renderHook(() => useCart());

      expect(result.current.totalPrice).toBe(599.97);
      expect(result.current.itemCount).toBe(3);
      expect(result.current.discountedTotal).toBe(539.97);
      expect(result.current.discountAmount).toBe(60);
    });
  });

  // ─── validateAndApplyPromo ────────────────────────────────────

  describe('validateAndApplyPromo', () => {
    it('validates promo code and applies result on success', async () => {
      mockGetTotal.mockReturnValue(1000);

      vi.mocked(promoApi.validatePromoCode).mockResolvedValueOnce({
        valid: true,
        discount: 10,
        message: '10% скидка',
        discountAmount: 100,
      });

      const { result } = renderHook(() => useCart());

      let res: { success: boolean; message: string };
      await act(async () => {
        res = await result.current.validateAndApplyPromo('SAVE10');
      });

      expect(promoApi.validatePromoCode).toHaveBeenCalledWith({
        code: 'SAVE10',
        orderAmount: 1000,
      });
      expect(mockSetPromoResult).toHaveBeenCalledWith({
        valid: true,
        discount: 10,
        message: '10% скидка',
        discountAmount: 100,
      });
      expect(res!.success).toBe(true);
    });

    it('returns error message when promo code is invalid', async () => {
      mockGetTotal.mockReturnValue(500);

      vi.mocked(promoApi.validatePromoCode).mockResolvedValueOnce({
        valid: false,
        discount: 0,
        message: 'Промокод не найден',
        discountAmount: 0,
      });

      const { result } = renderHook(() => useCart());

      let res: { success: boolean; message: string };
      await act(async () => {
        res = await result.current.validateAndApplyPromo('BADCODE');
      });

      expect(res!.success).toBe(false);
      expect(res!.message).toBe('Промокод не найден');
      // Hook always calls setPromoResult — the store handles invalid promo (clears discount)
      expect(mockSetPromoResult).toHaveBeenCalledWith({
        valid: false,
        discount: 0,
        message: 'Промокод не найден',
        discountAmount: 0,
      });
    });

    it('handles network error gracefully', async () => {
      mockGetTotal.mockReturnValue(200);

      vi.mocked(promoApi.validatePromoCode).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useCart());

      let res: { success: boolean; message: string };
      await act(async () => {
        res = await result.current.validateAndApplyPromo('FAIL');
      });

      expect(res!.success).toBe(false);
      expect(res!.message).toBe('Ошибка проверки промокода');
    });
  });
});
