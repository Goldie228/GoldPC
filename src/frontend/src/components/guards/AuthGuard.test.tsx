import { describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthGuard } from './AuthGuard';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/hooks/useAuth';
const mockUseAuth = vi.mocked(useAuth);

afterEach(() => cleanup());

function renderWithRouter(ui: React.ReactElement, initialEntry = '/protected') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/protected" element={ui}>
          <Route index element={<div>Protected Content</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AuthGuard', () => {
  it('shows loading state', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true } as any);
    renderWithRouter(<AuthGuard />);
    expect(screen.getByText(/проверка авторизации/i)).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false } as any);
    renderWithRouter(<AuthGuard />);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders Outlet when authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false } as any);
    renderWithRouter(<AuthGuard />);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
