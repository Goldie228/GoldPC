import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, type RenderOptions, cleanup } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ProductCard } from './ProductCard';
import type { ProductSummary } from '../../api/types';

// Создаёт a произвольный render function that wraps with required providers
function renderWithProviders(ui: React.ReactElement, options?: RenderOptions) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </BrowserRouter>,
    options
  );
}

// Mock hooks
vi.mock('../../hooks/useCart', () => ({
  useCart: vi.fn(() => ({
    addToCart: vi.fn(),
    changeQuantity: vi.fn(),
    isInCart: vi.fn(() => false),
    getItemQuantity: vi.fn(() => 0),
  })),
}));

vi.mock('../../hooks/useToast', () => ({
  useToast: vi.fn(() => ({
    showToast: vi.fn(),
  })),
}));

vi.mock('../../hooks/useWishlist', () => ({
  useWishlist: vi.fn(() => ({
    isInWishlist: vi.fn(() => false),
    toggleWishlist: vi.fn(),
  })),
}));

vi.mock('../../hooks/useComparison', () => ({
  useComparison: vi.fn(() => ({
    isInComparison: vi.fn(() => false),
    toggleComparison: vi.fn(() => ({ success: true })),
  })),
}));

afterEach(() => {
  cleanup();
});

describe('ProductCard', () => {
  const mockProduct: ProductSummary = {
    id: 'test-product-1',
    slug: 'amd-ryzen-9-7950x',
    name: 'AMD Ryzen 9 7950X',
    sku: 'SKU-12345',
    category: 'cpu',
    price: 59999,
    stock: 10,
    isActive: true,
  };

  describe('рендеринг имени и цены', () => {
    it('отображает название товара', () => {
      renderWithProviders(<ProductCard product={mockProduct} />);
      expect(screen.getByText('AMD Ryzen 9 7950X')).toBeInTheDocument();
    });

    it('отображает цену в формате белорусской валюты', () => {
      renderWithProviders(<ProductCard product={mockProduct} />);
      // BynPrice рендерит число + SVG-иконку с aria-label="BYN"
      expect(screen.getByText(/59\s*999/)).toBeInTheDocument();
      expect(screen.getByLabelText('BYN')).toBeInTheDocument();
    });

    it('отображает производителя, если он указан', () => {
      const productWithManufacturer: ProductSummary = {
        ...mockProduct,
        manufacturer: {
          id: 'manufacturer-1',
          name: 'AMD',
        },
      };

      renderWithProviders(<ProductCard product={productWithManufacturer} />);
      expect(screen.getByText('AMD')).toBeInTheDocument();
    });
  });

  describe('отображение статуса наличия', () => {
    it('показывает "Нет в наличии" когда stock равен 0', () => {
      const outOfStockProduct: ProductSummary = {
        ...mockProduct,
        stock: 0,
      };

      renderWithProviders(<ProductCard product={outOfStockProduct} />);
      expect(screen.getByText('Нет в наличии')).toBeInTheDocument();
    });

    it('показывает "Мало" когда stock от 1 до 3', () => {
      const lowStockProduct: ProductSummary = {
        ...mockProduct,
        stock: 2,
      };

      renderWithProviders(<ProductCard product={lowStockProduct} />);
      // StockBadge показывает только "Мало" без количества
      expect(screen.getByText('Мало')).toBeInTheDocument();
    });

    it('показывает "В наличии" когда stock больше 3', () => {
      const inStockProduct: ProductSummary = {
        ...mockProduct,
        stock: 15,
      };

      renderWithProviders(<ProductCard product={inStockProduct} />);
      // StockBadge показывает только "В наличии" без количества
      expect(screen.getByText('В наличии')).toBeInTheDocument();
    });
  });

  describe('взаимодействие с корзиной', () => {
    it('вызывает onAddToCart при клике на кнопку "В корзину"', async () => {
      const user = userEvent.setup();
      const mockAddToCart = vi.fn();

      renderWithProviders(<ProductCard product={mockProduct} onAddToCart={mockAddToCart} />);

      // Кнопка называется "В корзину"
      const addToCartButton = screen.getByRole('button', { name: /В корзину/i });
      await user.click(addToCartButton);

      expect(mockAddToCart).toHaveBeenCalledTimes(1);
      expect(mockAddToCart).toHaveBeenCalledWith(mockProduct.id);
    });

    it('показывает кнопку "Уведомить" вместо "В корзину" при отсутствии товара (stock = 0)', async () => {
      const user = userEvent.setup();
      const mockAddToCart = vi.fn();

      const outOfStockProduct: ProductSummary = {
        ...mockProduct,
        stock: 0,
      };

      renderWithProviders(<ProductCard product={outOfStockProduct} onAddToCart={mockAddToCart} />);

      // При stock=0 показывается кнопка "Уведомить", а не "В корзину"
      expect(screen.getByRole('button', { name: /Уведомить/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /В корзину/i })).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /Уведомить/i }));
      expect(mockAddToCart).not.toHaveBeenCalled();
    });

    it('кнопка "В корзину" доступна при активном товаре с наличием', async () => {
      const mockAddToCart = vi.fn();

      renderWithProviders(<ProductCard product={mockProduct} onAddToCart={mockAddToCart} />);

      const addToCartButton = screen.getByRole('button', { name: /В корзину/i });
      expect(addToCartButton).not.toBeDisabled();
    });
  });

  describe('дополнительные функции', () => {
    it('отображает бейдж скидки, если есть oldPrice', () => {
      const discountedProduct: ProductSummary = {
        ...mockProduct,
        price: 49999,
        oldPrice: 59999,
      };

      renderWithProviders(<ProductCard product={discountedProduct} />);
      expect(screen.getByText(/-17%/)).toBeInTheDocument();
    });

    it('отображает старую цену перечёркнутой при наличии скидки', () => {
      const discountedProduct: ProductSummary = {
        ...mockProduct,
        price: 49999,
        oldPrice: 59999,
      };

      renderWithProviders(<ProductCard product={discountedProduct} />);
      // BynPrice форматирует число через toLocaleString('ru-BY') → "49 999" и "59 999"
      expect(screen.getByText(/49\s*999/)).toBeInTheDocument();
      // Старая цена — SVG с aria-label="BYN" и классом line-through
      const oldPriceByn = screen.getAllByLabelText('BYN');
      expect(oldPriceByn.length).toBeGreaterThanOrEqual(1);
    });

    it('отображает бейдж "HIT" для товаров с флагом isFeatured', () => {
      const hitProduct: ProductSummary = {
        ...mockProduct,
        isFeatured: true,
      } as ProductSummary;

      renderWithProviders(<ProductCard product={hitProduct} />);
      // Компонент проверяет (product as any).isFeatured и показывает "HIT"
      expect(screen.getByText('HIT')).toBeInTheDocument();
    });

    it('не отображает бейдж "HIT" для товаров без флага isFeatured', () => {
      renderWithProviders(<ProductCard product={mockProduct} />);
      expect(screen.queryByText('HIT')).not.toBeInTheDocument();
    });

    it('отображает ссылку на страницу товара', () => {
      renderWithProviders(<ProductCard product={mockProduct} />);

      // Ссылка на товар ведёт на /product/{slug}
      const productLink = screen.getByRole('link', { name: mockProduct.name });
      expect(productLink).toHaveAttribute('href', `/product/${mockProduct.slug}`);
    });
  });
});