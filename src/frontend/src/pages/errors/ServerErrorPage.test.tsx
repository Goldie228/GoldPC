import { describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BrowserRouter } from 'react-router-dom';
import { ServerErrorPage } from './ServerErrorPage';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

afterEach(() => cleanup());

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('ServerErrorPage', () => {
  it('renders error message', () => {
    renderWithRouter(<ServerErrorPage />);
    expect(screen.getByText(/произошла ошибка/i)).toBeInTheDocument();
  });

  it('displays retry button', () => {
    renderWithRouter(<ServerErrorPage />);
    expect(screen.getByRole('button', { name: /повторить/i })).toBeInTheDocument();
  });

  it('displays go home button', () => {
    renderWithRouter(<ServerErrorPage />);
    expect(screen.getByRole('button', { name: /на главную/i })).toBeInTheDocument();
  });
});
