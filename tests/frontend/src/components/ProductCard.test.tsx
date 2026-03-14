import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from './ProductCard';

/**
 * Модульные тесты для компонента ProductCard
 */

// Пример товара для тестов
const mockProduct = {
  id: '1',
  name: 'AMD Ryzen 9 7950X',
  price: 59999,
  stock: 10,
  category: 'cpu',
  manufacturer: 'AMD',
  specifications: {
    socket: 'AM5',
    cores: 16,
    threads: 32
  },
  rating: 4.8,
  warrantyMonths: 36,
  isActive: true
};

describe('ProductCard', () => {
  describe('Rendering', () => {
    it('renders product name and price correctly', () => {
      render(<ProductCard product={mockProduct} onAddToCart={() => {}} />);
      
      expect(screen.getByText('AMD Ryzen 9 7950X')).toBeInTheDocument();
      expect(screen.getByText(/59 999/)).toBeInTheDocument();
    });

    it('renders product manufacturer badge', () => {
      render(<ProductCard product={mockProduct} onAddToCart={() => {}} />);
      
      expect(screen.getByText('AMD')).toBeInTheDocument();
    });

    it('renders product rating', () => {
      render(<ProductCard product={mockProduct} onAddToCart={() => {}} />);
      
      expect(screen.getByText(/4\.8/)).toBeInTheDocument();
    });

    it('renders warranty information', () => {
      render(<ProductCard product={mockProduct} onAddToCart={() => {}} />);
      
      expect(screen.getByText(/36 мес/)).toBeInTheDocument();
    });
  });

  describe('Stock Status', () => {
    it('shows "В наличии" when stock > 0', () => {
      render(<ProductCard product={{ ...mockProduct, stock: 10 }} onAddToCart={() => {}} />);
      
      expect(screen.getByText(/В наличии/)).toBeInTheDocument();
      expect(screen.getByText(/10 шт/)).toBeInTheDocument();
    });

    it('shows "Нет в наличии" when stock is 0', () => {
      render(<ProductCard product={{ ...mockProduct, stock: 0 }} onAddToCart={() => {}} />);
      
      expect(screen.getByText(/Нет в наличии/i)).toBeInTheDocument();
    });

    it('shows "Мало" when stock is low (1-3)', () => {
      render(<ProductCard product={{ ...mockProduct, stock: 2 }} onAddToCart={() => {}} />);
      
      expect(screen.getByText(/Мало/i)).toBeInTheDocument();
    });
  });

  describe('Add to Cart Button', () => {
    it('calls onAddToCart when button clicked', () => {
      const mockAddToCart = vi.fn();
      render(<ProductCard product={mockProduct} onAddToCart={mockAddToCart} />);
      
      const button = screen.getByRole('button', { name: /в корзину/i });
      fireEvent.click(button);
      
      expect(mockAddToCart).toHaveBeenCalledTimes(1);
      expect(mockAddToCart).toHaveBeenCalledWith(mockProduct.id);
    });

    it('disables button when stock is 0', () => {
      render(<ProductCard product={{ ...mockProduct, stock: 0 }} onAddToCart={() => {}} />);
      
      const button = screen.getByRole('button', { name: /в корзину/i });
      expect(button).toBeDisabled();
    });

    it('disables button when product is inactive', () => {
      render(<ProductCard product={{ ...mockProduct, isActive: false }} onAddToCart={() => {}} />);
      
      const button = screen.getByRole('button', { name: /в корзину/i });
      expect(button).toBeDisabled();
    });

    it('shows loading state when adding to cart', () => {
      const mockAddToCart = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      render(<ProductCard product={mockProduct} onAddToCart={mockAddToCart} />);
      
      const button = screen.getByRole('button', { name: /в корзину/i });
      fireEvent.click(button);
      
      // После клика кнопка должна показывать состояние загрузки
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Price Formatting', () => {
    it('formats price with thousand separators', () => {
      render(<ProductCard product={{ ...mockProduct, price: 123456 }} onAddToCart={() => {}} />);
      
      expect(screen.getByText(/123 456/)).toBeInTheDocument();
    });

    it('shows currency symbol', () => {
      render(<ProductCard product={mockProduct} onAddToCart={() => {}} />);
      
      expect(screen.getByText(/₽/)).toBeInTheDocument();
    });

    it('handles zero price', () => {
      render(<ProductCard product={{ ...mockProduct, price: 0 }} onAddToCart={() => {}} />);
      
      expect(screen.getByText(/0 ₽/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper aria-labels', () => {
      render(<ProductCard product={mockProduct} onAddToCart={() => {}} />);
      
      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-label', `Товар: ${mockProduct.name}`);
    });

    it('has accessible product link', () => {
      render(<ProductCard product={mockProduct} onAddToCart={() => {}} />);
      
      const link = screen.getByRole('link', { name: /подробнее/i });
      expect(link).toHaveAttribute('href', `/products/${mockProduct.id}`);
    });

    it('supports keyboard navigation', () => {
      const mockAddToCart = vi.fn();
      render(<ProductCard product={mockProduct} onAddToCart={mockAddToCart} />);
      
      const button = screen.getByRole('button', { name: /в корзину/i });
      
      // Tab to button
      button.focus();
      expect(button).toHaveFocus();
      
      // Press Enter
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(mockAddToCart).toHaveBeenCalled();
    });
  });

  describe('Image Handling', () => {
    it('shows placeholder when image fails to load', () => {
      render(<ProductCard product={mockProduct} onAddToCart={() => {}} />);
      
      const image = screen.getByRole('img');
      fireEvent.error(image);
      
      expect(image).toHaveAttribute('src', '/placeholder.png');
    });

    it('has alt text for image', () => {
      render(<ProductCard product={mockProduct} onAddToCart={() => {}} />);
      
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', mockProduct.name);
    });
  });

  describe('Special Badges', () => {
    it('shows "Хит" badge for high rating products', () => {
      render(<ProductCard product={{ ...mockProduct, rating: 4.9 }} onAddToCart={() => {}} />);
      
      expect(screen.getByText(/Хит/i)).toBeInTheDocument();
    });

    it('shows "Новинка" badge for new products', () => {
      const newProduct = {
        ...mockProduct,
        createdAt: new Date().toISOString()
      };
      render(<ProductCard product={newProduct} onAddToCart={() => {}} />);
      
      expect(screen.getByText(/Новинка/i)).toBeInTheDocument();
    });

    it('shows discount badge when discount exists', () => {
      const discountedProduct = {
        ...mockProduct,
        discount: 15,
        originalPrice: 70000
      };
      render(<ProductCard product={discountedProduct} onAddToCart={() => {}} />);
      
      expect(screen.getByText(/-15%/i)).toBeInTheDocument();
    });
  });
});