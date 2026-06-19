import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RegisterModal } from './RegisterModal';

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
    activeModal: 'register',
    openLoginModal: vi.fn(),
    openRegisterModal: vi.fn(),
    closeAuthModal: vi.fn(),
    switchAuthModal: vi.fn(),
  })),
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

describe('RegisterModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders when open', () => {
    renderInRouter(<RegisterModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Создать аккаунт')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderInRouter(<RegisterModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText('Создать аккаунт')).not.toBeInTheDocument();
  });

  it('renders name field', () => {
    renderInRouter(<RegisterModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByLabelText(/имя/i)).toBeInTheDocument();
  });

  it('renders phone field', () => {
    renderInRouter(<RegisterModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByLabelText(/телефон/i)).toBeInTheDocument();
  });

  it('renders email field', () => {
    renderInRouter(<RegisterModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('renders password fields', () => {
    renderInRouter(<RegisterModal isOpen={true} onClose={vi.fn()} />);
    const passwordInputs = screen.getAllByPlaceholderText(/пароль/i);
    expect(passwordInputs.length).toBeGreaterThanOrEqual(1);
  });

  it('renders terms checkbox', () => {
    renderInRouter(<RegisterModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByLabelText(/условия использования/i)).toBeInTheDocument();
  });

  it('renders submit button', () => {
    renderInRouter(<RegisterModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: /зарегистрироваться/i })).toBeInTheDocument();
  });

  it('shows switch to login link', () => {
    renderInRouter(<RegisterModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/уже есть аккаунт/i)).toBeInTheDocument();
  });
});
