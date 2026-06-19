import { describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HomePage } from './HomePage';

vi.mock('@/hooks/useProducts', () => ({
  useProducts: vi.fn(() => ({
    data: { products: [], total: 0, page: 1, pageSize: 12, totalPages: 0 },
    isLoading: false,
    error: null,
  })),
}));

vi.mock('@/hooks/useCategories', () => ({
  useCategories: vi.fn(() => ({
    data: [],
    isLoading: false,
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

describe('HomePage', () => {
  it('renders without crashing', () => {
    renderWithProviders(<HomePage />);
    expect(document.body).toBeInTheDocument();
  });

  it('displays the GoldPC heading', () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByText(/GoldPC/i)).toBeInTheDocument();
  });
});
