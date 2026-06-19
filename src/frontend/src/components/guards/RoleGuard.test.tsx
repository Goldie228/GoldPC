import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RoleGuard } from './RoleGuard';
import type { UseAuthReturn } from '@/hooks/useAuth';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));
vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(() => ({ currentRole: null })),
}));

import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
const mockUseAuth = vi.mocked(useAuth);
const mockUseAuthStore = vi.mocked(useAuthStore);

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

const mockAdminUser = {
  id: '1',
  role: 'Admin',
  firstName: '',
  lastName: '',
  email: '',
  isBlocked: false,
  createdAt: '',
  updatedAt: '',
} as UseAuthReturn['user'] & { role: string };

const mockRegularUser = {
  id: '2',
  role: 'User',
  firstName: '',
  lastName: '',
  email: '',
  isBlocked: false,
  createdAt: '',
  updatedAt: '',
} as UseAuthReturn['user'] & { role: string };

function renderWithRouter(ui: React.ReactElement) {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/admin" element={ui}>
          <Route index element={<div>Protected Content</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('RoleGuard', () => {
  it('shows loading state', () => {
    mockUseAuth.mockReturnValue(makeAuth({ isAuthenticated: false, isLoading: true, user: null }));
    renderWithRouter(<RoleGuard allowedRoles={['Admin']} />);
    expect(screen.getByText(/проверка прав доступа/i)).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    mockUseAuth.mockReturnValue(makeAuth({ isAuthenticated: false, isLoading: false, user: null }));
    renderWithRouter(<RoleGuard allowedRoles={['Admin']} />);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('shows 403 when role does not match', () => {
    mockUseAuth.mockReturnValue(makeAuth({
      isAuthenticated: true,
      isLoading: false,
      user: mockRegularUser,
    }));
    mockUseAuthStore.mockReturnValue({
      currentRole: 'User',
      user: null,
      isAuthenticated: true,
      isLoading: false,
      isImpersonating: false,
      originalUser: null,
      setUser: vi.fn(),
      setLoading: vi.fn(),
      logout: vi.fn(),
      startImpersonation: vi.fn(),
      stopImpersonation: vi.fn(),
      switchRole: vi.fn(),
    });
    renderWithRouter(<RoleGuard allowedRoles={['Admin']} />);
    expect(screen.getByText(/доступ запрещён/i)).toBeInTheDocument();
  });

  it('renders children when role matches', () => {
    mockUseAuth.mockReturnValue(makeAuth({
      isAuthenticated: true,
      isLoading: false,
      user: mockAdminUser,
    }));
    mockUseAuthStore.mockReturnValue({
      currentRole: 'Admin',
      user: null,
      isAuthenticated: true,
      isLoading: false,
      isImpersonating: false,
      originalUser: null,
      setUser: vi.fn(),
      setLoading: vi.fn(),
      logout: vi.fn(),
      startImpersonation: vi.fn(),
      stopImpersonation: vi.fn(),
      switchRole: vi.fn(),
    });
    renderWithRouter(<RoleGuard allowedRoles={['Admin']} />);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
