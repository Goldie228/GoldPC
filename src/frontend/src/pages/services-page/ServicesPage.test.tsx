import { describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BrowserRouter } from 'react-router-dom';
import { ServicesPage } from './ServicesPage';

vi.mock('@/hooks/useServices', () => ({
  useServices: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

afterEach(() => cleanup());

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('ServicesPage', () => {
  it('renders without crashing', () => {
    renderWithRouter(<ServicesPage />);
    expect(document.body).toBeInTheDocument();
  });

  it('displays the page heading with services', () => {
    renderWithRouter(<ServicesPage />);
    expect(screen.getByText(/наши/i)).toBeInTheDocument();
  });
});
