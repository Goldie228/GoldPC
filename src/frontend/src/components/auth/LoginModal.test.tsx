import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginModal } from './LoginModal';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    login: vi.fn(),
    isLoading: false,
    user: null,
    isAuthenticated: false,
    logout: vi.fn(),
    register: vi.fn(),
    isImpersonating: false,
    originalUser: null,
    startImpersonation: vi.fn(),
    stopImpersonation: vi.fn(),
  })),
}));

vi.mock('@/hooks/useAuthModal', () => ({
  useAuthModal: vi.fn(() => ({
    activeModal: 'login',
    openLoginModal: vi.fn(),
    openRegisterModal: vi.fn(),
    closeAuthModal: vi.fn(),
    switchAuthModal: vi.fn(),
  })),
}));

vi.mock('@/api/authService', () => ({
  getAuthErrorMessage: vi.fn(() => 'Authentication error'),
}));

vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ isOpen, children, title }: { isOpen: boolean; children: React.ReactNode; title: string }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="modal">
        <h2>{title}</h2>
        {children}
      </div>
    );
  },
}));

function renderInRouter(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('LoginModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open', () => {
    renderInRouter(<LoginModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Вход в аккаунт')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderInRouter(<LoginModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText('Вход в аккаунт')).not.toBeInTheDocument();
  });

  it('renders email input', () => {
    renderInRouter(<LoginModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  });

  it('renders password input', () => {
    renderInRouter(<LoginModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText(/пароль/i)).toBeInTheDocument();
  });

  it('renders submit button', () => {
    renderInRouter(<LoginModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
  });

  it('renders remember me checkbox', () => {
    renderInRouter(<LoginModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByLabelText(/запомнить меня/i)).toBeInTheDocument();
  });

  it('renders forgot password link', () => {
    renderInRouter(<LoginModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/забыли пароль/i)).toBeInTheDocument();
  });

  it('shows switch to register link', () => {
    renderInRouter(<LoginModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/нет аккаунта/i)).toBeInTheDocument();
  });
});
