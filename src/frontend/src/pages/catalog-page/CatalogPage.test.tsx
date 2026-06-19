import { describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CatalogPage } from './CatalogPage';

vi.mock('@/hooks/useCatalog', () => ({
  useCatalog: vi.fn(() => ({
    loading: false,
    error: null,
    getProducts: vi.fn().mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 12, totalPages: 0, totalItems: 0, hasNextPage: false, hasPrevPage: false },
    }),
    getProduct: vi.fn(),
    getProductsByIds: vi.fn(),
    getProductReviews: vi.fn(),
    addProductReview: vi.fn(),
    updateProductReview: vi.fn(),
    deleteProductReview: vi.fn(),
    toggleHelpful: vi.fn(),
    getFilterFacets: vi.fn(),
  })),
}));

vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: vi.fn((v) => v),
}));

vi.mock('@/utils/telemetry', () => ({
  telemetryTrack: vi.fn(),
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

describe('CatalogPage', () => {
  it('renders without crashing', () => {
    renderWithProviders(<CatalogPage />);
    expect(document.body).toBeInTheDocument();
  });

  it('displays the search input with correct placeholder', () => {
    renderWithProviders(<CatalogPage />);
    expect(screen.getByPlaceholderText(/Все товары/i)).toBeInTheDocument();
  });
});
