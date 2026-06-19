import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AdminRedirect } from './AdminRedirect';
import type { UseAuthReturn } from '@/hooks/useAuth';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/hooks/useAuth';
const mockUseAuth = vi.mocked(useAuth);

afterEach(() => cleanup());

function renderWithRouter(role: string | null) {
  mockUseAuth.mockReturnValue({
    user: role ? { id: '1', role, firstName: '', lastName: '', email: '', isBlocked: false, createdAt: '', updatedAt: '' } as UseAuthReturn['user'] & { role: string } : null,
    isAuthenticated: role !== null,
    isLoading: false,
    isImpersonating: false,
    originalUser: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    startImpersonation: vi.fn(),
    stopImpersonation: vi.fn(),
  } as UseAuthReturn);
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<AdminRedirect />} />
        <Route path="/admin/users" element={<div>Admin Users</div>} />
        <Route path="/manager/dashboard" element={<div>Manager Dashboard</div>} />
        <Route path="/accountant/reports" element={<div>Accountant Reports</div>} />
        <Route path="/dashboard" element={<div>User Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AdminRedirect', () => {
  it('redirects Admin to /admin/users', () => {
    renderWithRouter('Admin');
    expect(screen.getByText('Admin Users')).toBeInTheDocument();
  });

  it('redirects Manager to /manager/dashboard', () => {
    renderWithRouter('Manager');
    expect(screen.getByText('Manager Dashboard')).toBeInTheDocument();
  });

  it('redirects Master to /manager/dashboard', () => {
    renderWithRouter('Master');
    expect(screen.getByText('Manager Dashboard')).toBeInTheDocument();
  });

  it('redirects Accountant to /accountant/reports', () => {
    renderWithRouter('Accountant');
    expect(screen.getByText('Accountant Reports')).toBeInTheDocument();
  });

  it('redirects regular User to /dashboard', () => {
    renderWithRouter('User');
    expect(screen.getByText('User Dashboard')).toBeInTheDocument();
  });

  it('redirects null user to home', () => {
    renderWithRouter(null);
    expect(screen.queryByText(/Admin Users|Manager|Accountant|Dashboard/)).not.toBeInTheDocument();
  });
});
