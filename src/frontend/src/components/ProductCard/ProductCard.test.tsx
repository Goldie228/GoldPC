import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { ProductCard } from './ProductCard';
import type { ProductSummary } from '../../api/types';

describe('ProductCard', () => {
  const mockProduct: ProductSummary = {
    id: 'test-product-1',
    name: 'AMD Ryzen 9 7950X',
    sku: 'SKU-12345',
    category: 'cpu',
    price: 59999,
    stock: 10,
    isActive: true,
  };

  describe('рендеринг имени и цены', () => {
    it('отображает название товара', () => {
      render(<ProductCard product={mockProduct} />);
      expect(screen.getByText('AMD Ryzen 9 7950X')).toBeInTheDocument();
    });

    it('отображает цену в формате российской валюты', () => {
      render(<ProductCard product={mockProduct} />);
      expect(screen.getByText(/59\s*999/)).toBeInTheDocument();
      expect(screen.getByText(/BYN/)).toBeInTheDocument();
    });

    it('отображает производителя, если он указан', () => {
      const productWithManufacturer: ProductSummary = {
        ...mockProduct,
        manufacturer: {
          id: 'manufacturer-1',
          name: 'AMD',
        },
      };

      render(<ProductCard product={productWithManufacturer} />);
      expect(screen.getByText('AMD')).toBeInTheDocument();
    });
  });

  describe('отображение статуса наличия', () => {
    it('показывает "Нет в наличии" когда stock равен 0', () => {
      const outOfStockProduct: ProductSummary = {
        ...mockProduct,
        stock: 0,
      };

      render(<ProductCard product={outOfStockProduct} />);
      expect(screen.getByText('Нет в наличии')).toBeInTheDocument();
    });

    it('показывает "Мало" когда stock от 1 до 3', () => {
      const lowStockProduct: ProductSummary = {
        ...mockProduct,
        stock: 2,
      };

      render(<ProductCard product={lowStockProduct} />);
      expect(screen.getByText(/Мало \(2 шт\)/)).toBeInTheDocument();
    });

    it('показывает "В наличии" когда stock больше 3', () => {
      const inStockProduct: ProductSummary = {
        ...mockProduct,
        stock: 15,
      };

      render(<ProductCard product={inStockProduct} />);
      expect(screen.getByText(/В наличии \(15 шт\)/)).toBeInTheDocument();
    });
  });

  describe('взаимодействие с корзиной', () => {
    it('вызывает onAddToCart при клике на кнопку "В корзину"', async () => {
      const user = userEvent.setup();
      const mockAddToCart = vi.fn();

      render(<ProductCard product={mockProduct} onAddToCart={mockAddToCart} />);

      const addToCartButton = screen.getByRole('button', { name: /добавить в корзину/i });
      await user.click(addToCartButton);

      expect(mockAddToCart).toHaveBeenCalledTimes(1);
      expect(mockAddToCart).toHaveBeenCalledWith(mockProduct.id);
    });

    it('не вызывает onAddToCart при клике, если товар отсутствует (stock = 0)', async () => {
      const user = userEvent.setup();
      const mockAddToCart = vi.fn();

      const outOfStockProduct: ProductSummary = {
        ...mockProduct,
        stock: 0,
      };

      render(<ProductCard product={outOfStockProduct} onAddToCart={mockAddToCart} />);

      const addToCartButton = screen.getByRole('button', { name: /добавить в корзину/i });
      expect(addToCartButton).toBeDisabled();
      
      await user.click(addToCartButton);
      expect(mockAddToCart).not.toHaveBeenCalled();
    });

    it('не вызывает onAddToCart при клике, если товар неактивен (isActive = false)', async () => {
      const mockAddToCart = vi.fn();

      const inactiveProduct: ProductSummary = {
        ...mockProduct,
        isActive: false,
      };

      render(<ProductCard product={inactiveProduct} onAddToCart={mockAddToCart} />);

      const addToCartButton = screen.getByRole('button', { name: /добавить в корзину/i });
      expect(addToCartButton).toBeDisabled();
    });
  });

  describe('дополнительные функции', () => {
    it('отображает бейдж скидки, если есть oldPrice', () => {
      const discountedProduct: ProductSummary = {
        ...mockProduct,
        price: 49999,
        oldPrice: 59999,
      };

      render(<ProductCard product={discountedProduct} />);
      expect(screen.getByText(/-17%/)).toBeInTheDocument();
    });

    it('отображает старую цену перечёркнутой при наличии скидки', () => {
      const discountedProduct: ProductSummary = {
        ...mockProduct,
        price: 49999,
        oldPrice: 59999,
      };

      render(<ProductCard product={discountedProduct} />);
      expect(screen.getByText(/49\s*999/)).toBeInTheDocument();
      expect(screen.getByText(/59\s*999/)).toBeInTheDocument();
    });

    it('отображает бейдж "Хит" для товаров с рейтингом >= 4.8', () => {
      const hitProduct: ProductSummary = {
        ...mockProduct,
        rating: 4.9,
      };

      render(<ProductCard product={hitProduct} />);
      expect(screen.getByText('Хит')).toBeInTheDocument();
    });

    it('не отображает бейдж "Хит" для товаров с низким рейтингом', () => {
      const normalProduct: ProductSummary = {
        ...mockProduct,
        rating: 4.5,
      };

      render(<ProductCard product={normalProduct} />);
      expect(screen.queryByText('Хит')).not.toBeInTheDocument();
    });

    it('отображает ссылку на страницу товара', () => {
      render(<ProductCard product={mockProduct} />);

      const productLink = screen.getByRole('link', { name: mockProduct.name });
      expect(productLink).toHaveAttribute('href', `/product/${mockProduct.id}`);
    });
  });
});