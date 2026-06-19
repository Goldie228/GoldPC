import { describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductList } from './ProductList';
import type { ProductSummary } from '@/api/types';

vi.mock('@/hooks/useCart', () => ({
  useCart: vi.fn(() => ({
    addToCart: vi.fn(),
    isInCart: vi.fn(() => false),
    getItemQuantity: vi.fn(() => 0),
  })),
}));
vi.mock('@/hooks/useToast', () => ({
  useToast: vi.fn(() => ({ showToast: vi.fn() })),
}));
vi.mock('@/hooks/useWishlist', () => ({
  useWishlist: vi.fn(() => ({
    isInWishlist: vi.fn(() => false),
    toggleWishlist: vi.fn(),
  })),
}));
vi.mock('@/hooks/useComparison', () => ({
  useComparison: vi.fn(() => ({
    isInComparison: vi.fn(() => false),
    toggleComparison: vi.fn(),
  })),
}));

afterEach(() => cleanup());

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <BrowserRouter>
      <QueryClientProvider client={qc}>{ui}</QueryClientProvider>
    </BrowserRouter>
  );
}

const mockProduct: ProductSummary = {
  id: '1', slug: 'test', name: 'Test Product', sku: 'SKU-1',
  category: 'cpu', price: 100, stock: 5, isActive: true,
};

describe('ProductList', () => {
  it('renders empty state for empty array', () => {
    renderWithProviders(<ProductList products={[]} />);
    expect(screen.getByText(/товары не найдены/i)).toBeInTheDocument();
  });

  it('renders product items', () => {
    renderWithProviders(<ProductList products={[mockProduct]} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });
});
