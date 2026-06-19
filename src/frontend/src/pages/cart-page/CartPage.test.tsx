import { describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartPage } from './CartPage';

vi.mock('@/hooks/useCart', () => ({
  useCart: vi.fn(() => ({
    items: [],
    totalItems: 0,
    totalPrice: 0,
    discountedTotal: 0,
    promoDiscount: 0,
    promoCode: null,
    discountedTotalWithDelivery: 0,
    appliedPromo: null,
    availablePromos: [],
    removeItem: vi.fn(),
    changeQuantity: vi.fn(),
    clearCart: vi.fn(),
    applyPromoCode: vi.fn(),
    removePromoCode: vi.fn(),
  })),
}));

vi.mock('@/store/toastStore', () => ({
  useToastStore: vi.fn(() => ({
    showToast: vi.fn(),
  })),
}));

vi.mock('@/components/cart/RelatedProducts', () => ({
  RelatedProducts: () => <div data-testid="related-products">Related Products</div>,
}));

vi.mock('@/utils/image', () => ({
  hasValidProductImage: vi.fn(() => false),
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

describe('CartPage', () => {
  it('renders the cart page', () => {
    renderWithProviders(<CartPage />);
    expect(document.body).toBeInTheDocument();
  });

  it('shows related products section', () => {
    renderWithProviders(<CartPage />);
    expect(screen.getByTestId('related-products')).toBeInTheDocument();
  });
});
