import { describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartPage } from './CartPage';
import { useCart } from '@/hooks/useCart';

vi.mock('@/hooks/useCart', () => ({
  useCart: vi.fn(() => ({
    items: [],
    isEmpty: true,
    totalPrice: 0,
    itemCount: 0,
    discountedTotal: 0,
    discountAmount: 0,
    discount: 0,
    promoCode: null,
    removeFromCart: vi.fn(),
    changeQuantity: vi.fn(),
  })),
}));

const mockShowToast = vi.fn();
vi.mock('@/store/toastStore', () => ({
  useToastStore: vi.fn((selector?: (s: { showToast: typeof mockShowToast }) => unknown) => {
    const state = { showToast: mockShowToast };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('@/components/cart/RelatedProducts', () => ({
  RelatedProducts: () => <div data-testid="related-products">Related Products</div>,
}));

vi.mock('@/utils/image', () => ({
  hasValidProductImage: vi.fn(() => false),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <BrowserRouter>
      <QueryClientProvider client={qc}>{ui}</QueryClientProvider>
    </BrowserRouter>
  );
}

describe('CartPage', () => {
  it('renders empty cart state when isEmpty is true', () => {
    renderWithProviders(<CartPage />);
    expect(screen.getByText('Корзина пуста')).toBeInTheDocument();
    expect(screen.getByText('Перейти в каталог')).toBeInTheDocument();
  });

  it('renders cart with items when isEmpty is false', () => {
    const mockRemoveFromCart = vi.fn();
    const mockChangeQuantity = vi.fn();
    vi.mocked(useCart).mockReturnValueOnce({
      items: [
        {
          productId: '1',
          name: 'Test Product',
          imageUrl: '',
          category: 'cpu',
          price: 500,
          quantity: 2,
          productSlug: 'test-product',
        },
      ],
      isEmpty: false,
      totalPrice: 1000,
      itemCount: 2,
      discountedTotal: 1000,
      discountAmount: 0,
      discount: 0,
      promoCode: null,
      removeFromCart: mockRemoveFromCart,
      changeQuantity: mockChangeQuantity,
    } as ReturnType<typeof useCart>);

    renderWithProviders(<CartPage />);
    expect(screen.getByRole('main', { name: /корзина goldpc/i })).toBeInTheDocument();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getAllByText(/1 000 BYN/).length).toBeGreaterThanOrEqual(1);
  });

  it('calls removeFromCart when delete button is clicked', async () => {
    const user = userEvent.setup();
    const mockRemoveFromCart = vi.fn();
    const mockChangeQuantity = vi.fn();
    vi.mocked(useCart).mockReturnValueOnce({
      items: [
        {
          productId: 'p1',
          name: 'GPU Card',
          imageUrl: '',
          category: 'gpu',
          price: 2000,
          quantity: 1,
          productSlug: 'gpu-card',
        },
      ],
      isEmpty: false,
      totalPrice: 2000,
      itemCount: 1,
      discountedTotal: 2000,
      discountAmount: 0,
      discount: 0,
      promoCode: null,
      removeFromCart: mockRemoveFromCart,
      changeQuantity: mockChangeQuantity,
    } as ReturnType<typeof useCart>);

    renderWithProviders(<CartPage />);
    const deleteButton = screen.getByRole('button', { name: /удалить gpu card/i });
    await user.click(deleteButton);
    expect(mockRemoveFromCart).toHaveBeenCalledWith('p1');
  });

  it('calls changeQuantity when plus button is clicked', async () => {
    const user = userEvent.setup();
    const mockRemoveFromCart = vi.fn();
    const mockChangeQuantity = vi.fn();
    vi.mocked(useCart).mockReturnValueOnce({
      items: [
        {
          productId: 'p2',
          name: 'RAM Module',
          imageUrl: '',
          category: 'ram',
          price: 300,
          quantity: 1,
          productSlug: 'ram-module',
        },
      ],
      isEmpty: false,
      totalPrice: 300,
      itemCount: 1,
      discountedTotal: 300,
      discountAmount: 0,
      discount: 0,
      promoCode: null,
      removeFromCart: mockRemoveFromCart,
      changeQuantity: mockChangeQuantity,
    } as ReturnType<typeof useCart>);

    renderWithProviders(<CartPage />);
    const plusButton = screen.getByRole('button', { name: /увеличить количество ram module/i });
    await user.click(plusButton);
    expect(mockChangeQuantity).toHaveBeenCalledWith('p2', 1);
  });
});
