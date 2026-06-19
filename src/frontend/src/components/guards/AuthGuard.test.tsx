import { describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthGuard } from './AuthGuard';
import type { UseAuthReturn } from '@/hooks/useAuth';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/hooks/useAuth';
const mockUseAuth = vi.mocked(useAuth);

afterEach(() => cleanup());

function makeAuth(partial: Partial<UseAuthReturn>): UseAuthReturn {
  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isImpersonating: false,
    originalUser: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    startImpersonation: vi.fn(),
    stopImpersonation: vi.fn(),
    ...partial,
  };
}

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
    mockUseAuth.mockReturnValue(makeAuth({ isAuthenticated: false, isLoading: true }));
    renderWithRouter(<AuthGuard />);
    expect(screen.getByText(/проверка авторизации/i)).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    mockUseAuth.mockReturnValue(makeAuth({ isAuthenticated: false, isLoading: false }));
    renderWithRouter(<AuthGuard />);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders Outlet when authenticated', () => {
    mockUseAuth.mockReturnValue(makeAuth({ isAuthenticated: true, isLoading: false }));
    renderWithRouter(<AuthGuard />);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
