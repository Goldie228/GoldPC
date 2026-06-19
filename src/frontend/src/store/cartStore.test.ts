import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCartStore } from './cartStore';
import type { ProductSummary } from '../api/types';

const mockProduct: ProductSummary = {
  id: 'prod-1',
  name: 'RTX 4090',
  sku: 'SKU-001',
  slug: 'rtx-4090',
  category: 'gpu',
  price: 1500,
  stock: 5,
  isActive: true,
  mainImage: { id: 'img-1', url: '/img/4090.jpg', isMain: true },
};

const mockProduct2: ProductSummary = {
  id: 'prod-2',
  name: 'Ryzen 9 7950X',
  sku: 'SKU-002',
  slug: 'ryzen-9-7950x',
  category: 'cpu',
  price: 600,
  stock: 10,
  isActive: true,
};

// Mock localStorage for persist middleware
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((_index: number) => null),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('cartStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    useCartStore.setState({
      items: [],
      promoCode: null,
      discount: 0,
      discountAmount: 0,
    });
  });

  describe('Начальное состояние', () => {
    it('корзина пуста', () => {
      const state = useCartStore.getState();
      expect(state.items).toEqual([]);
      expect(state.promoCode).toBeNull();
      expect(state.discount).toBe(0);
      expect(state.discountAmount).toBe(0);
    });
  });

  describe('addItem', () => {
    it('добавляет новый товар с количеством 1 по умолчанию', () => {
      useCartStore.getState().addItem(mockProduct);
      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe('prod-1');
      expect(items[0].quantity).toBe(1);
      expect(items[0].name).toBe('RTX 4090');
      expect(items[0].price).toBe(1500);
      expect(items[0].imageUrl).toBe('/img/4090.jpg');
    });

    it('добавляет товар с указанным количеством', () => {
      useCartStore.getState().addItem(mockProduct, 3);
      expect(useCartStore.getState().items[0].quantity).toBe(3);
    });

    it('увеличивает количество при повторном добавлении того же товара', () => {
      useCartStore.getState().addItem(mockProduct, 1);
      useCartStore.getState().addItem(mockProduct, 2);
      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(3);
    });

    it('добавляет разные товары как отдельные элементы', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().addItem(mockProduct2);
      expect(useCartStore.getState().items).toHaveLength(2);
    });
  });

  describe('removeItem', () => {
    it('удаляет товар по productId', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().addItem(mockProduct2);
      useCartStore.getState().removeItem('prod-1');
      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe('prod-2');
    });

    it('не меняет корзину если товар не найден', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().removeItem('nonexistent');
      expect(useCartStore.getState().items).toHaveLength(1);
    });
  });

  describe('updateQuantity', () => {
    it('обновляет количество товара', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().updateQuantity('prod-1', 5);
      expect(useCartStore.getState().items[0].quantity).toBe(5);
    });

    it('удаляет товар при количестве 0', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().updateQuantity('prod-1', 0);
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('удаляет товар при отрицательном количестве', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().updateQuantity('prod-1', -1);
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('не меняет другие товары', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().addItem(mockProduct2);
      useCartStore.getState().updateQuantity('prod-1', 10);
      expect(useCartStore.getState().items.find(i => i.productId === 'prod-2')?.quantity).toBe(1);
    });
  });

  describe('setPromoResult', () => {
    it('устанавливает промокод при валидном результате с discount > 0', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().setPromoResult({
        valid: true,
        discount: 10,
        message: 'SAVE10 скидка 10%',
        discountAmount: 150,
      });
      const state = useCartStore.getState();
      expect(state.promoCode).toBe('SAVE10');
      expect(state.discount).toBe(10);
      expect(state.discountAmount).toBe(150);
    });

    it('сбрасывает промокод при discount = 0', () => {
      useCartStore.getState().setPromoResult({
        valid: true,
        discount: 0,
        message: 'Бесплатная доставка',
        discountAmount: 0,
      });
      const state = useCartStore.getState();
      expect(state.promoCode).toBeNull();
      expect(state.discount).toBe(0);
    });

    it('сбрасывает промокод при невалидном результате', () => {
      useCartStore.getState().setPromoResult({
        valid: false,
        discount: 0,
        message: 'Промокод недействителен',
        discountAmount: 0,
      });
      const state = useCartStore.getState();
      expect(state.promoCode).toBeNull();
      expect(state.discount).toBe(0);
    });
  });

  describe('clearPromo', () => {
    it('сбрасывает все данные промокода', () => {
      useCartStore.getState().setPromoResult({
        valid: true,
        discount: 20,
        message: 'CODE скидка',
        discountAmount: 300,
      });
      useCartStore.getState().clearPromo();
      const state = useCartStore.getState();
      expect(state.promoCode).toBeNull();
      expect(state.discount).toBe(0);
      expect(state.discountAmount).toBe(0);
    });
  });

  describe('clearCart', () => {
    it('очищает корзину и промокод', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().addItem(mockProduct2);
      useCartStore.getState().setPromoResult({
        valid: true,
        discount: 10,
        message: 'CODE скидка',
        discountAmount: 100,
      });
      useCartStore.getState().clearCart();
      const state = useCartStore.getState();
      expect(state.items).toEqual([]);
      expect(state.promoCode).toBeNull();
      expect(state.discount).toBe(0);
      expect(state.discountAmount).toBe(0);
    });
  });

  describe('getTotal', () => {
    it('возвращает 0 для пустой корзины', () => {
      expect(useCartStore.getState().getTotal()).toBe(0);
    });

    it('считает сумму цен умноженных на количество', () => {
      useCartStore.getState().addItem(mockProduct, 2);
      useCartStore.getState().addItem(mockProduct2, 1);
      // 1500*2 + 600*1 = 3600
      expect(useCartStore.getState().getTotal()).toBe(3600);
    });
  });

  describe('getItemCount', () => {
    it('возвращает 0 для пустой корзины', () => {
      expect(useCartStore.getState().getItemCount()).toBe(0);
    });

    it('считает общее количество товаров', () => {
      useCartStore.getState().addItem(mockProduct, 3);
      useCartStore.getState().addItem(mockProduct2, 2);
      expect(useCartStore.getState().getItemCount()).toBe(5);
    });
  });

  describe('getDiscountedTotal', () => {
    it('вычитает discountAmount из суммы', () => {
      useCartStore.getState().addItem(mockProduct, 2); // 3000
      useCartStore.getState().setPromoResult({
        valid: true,
        discount: 10,
        message: 'SAVE скидка',
        discountAmount: 300,
      });
      expect(useCartStore.getState().getDiscountedTotal()).toBe(2700);
    });

    it('округляет результат', () => {
      useCartStore.getState().addItem(mockProduct, 1); // 1500
      useCartStore.getState().setPromoResult({
        valid: true,
        discount: 15,
        message: 'CODE скидка',
        discountAmount: 123.456,
      });
      expect(useCartStore.getState().getDiscountedTotal()).toBe(1377); // Math.round(1500 - 123.456)
    });
  });

  describe('getDiscountAmount', () => {
    it('возвращает discountAmount', () => {
      useCartStore.getState().setPromoResult({
        valid: true,
        discount: 10,
        message: 'CODE скидка',
        discountAmount: 200,
      });
      expect(useCartStore.getState().getDiscountAmount()).toBe(200);
    });

    it('возвращает 0 без промокода', () => {
      expect(useCartStore.getState().getDiscountAmount()).toBe(0);
    });
  });
});

describe('cart total items selector logic', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], promoCode: null, discount: 0, discountAmount: 0 });
  });

  it('reduces item quantities correctly via getState', () => {
    useCartStore.getState().addItem(mockProduct, 3);
    useCartStore.getState().addItem(mockProduct2, 2);
    const total = useCartStore.getState().items.reduce((count, item) => count + item.quantity, 0);
    expect(total).toBe(5);
  });

  it('returns 0 for empty cart via getState', () => {
    const total = useCartStore.getState().items.reduce((count, item) => count + item.quantity, 0);
    expect(total).toBe(0);
  });
});
