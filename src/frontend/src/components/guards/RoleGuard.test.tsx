import { describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RoleGuard } from './RoleGuard';

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
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true, user: null } as any);
    renderWithRouter(<RoleGuard allowedRoles={['Admin']} />);
    expect(screen.getByText(/проверка прав доступа/i)).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false, user: null } as any);
    renderWithRouter(<RoleGuard allowedRoles={['Admin']} />);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('shows 403 when role does not match', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false, user: { role: 'User' } } as any);
    mockUseAuthStore.mockReturnValue({ currentRole: 'User' } as any);
    renderWithRouter(<RoleGuard allowedRoles={['Admin']} />);
    expect(screen.getByText('403')).toBeInTheDocument();
  });

  it('renders child route content when role matches', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false, user: { role: 'Admin' } } as any);
    mockUseAuthStore.mockReturnValue({ currentRole: 'Admin' } as any);
    renderWithRouter(<RoleGuard allowedRoles={['Admin']} />);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
