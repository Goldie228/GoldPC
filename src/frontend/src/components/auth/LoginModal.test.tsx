import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginModal } from './LoginModal';

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  isLoading: false,
}));

const mockSwitchAuthModal = vi.fn();
const mockOnClose = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    login: mocks.login,
    get isLoading() { return mocks.isLoading; },
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
    switchAuthModal: mockSwitchAuthModal,
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

  afterEach(() => {
    vi.restoreAllMocks();
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
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
  });

  it('renders password field', () => {
    renderInRouter(<LoginModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByLabelText('Пароль')).toBeInTheDocument();
  });

  it('renders remember me checkbox', () => {
    renderInRouter(<LoginModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByLabelText(/Запомнить меня/)).toBeInTheDocument();
  });

  it('renders forgot password link', () => {
    renderInRouter(<LoginModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Забыли пароль?')).toBeInTheDocument();
  });

  it('renders register link', () => {
    renderInRouter(<LoginModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Зарегистрироваться')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    renderInRouter(<LoginModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Войти/ })).toBeInTheDocument();
  });

  it('validates empty email on submit', async () => {
    renderInRouter(<LoginModal isOpen={true} onClose={mockOnClose} />);
    const form = screen.getByRole('button', { name: /Войти/ }).closest('form')!;
    // Remove all input constraints and use requestSubmit to bypass native validation
    form.querySelectorAll('input[required]').forEach(el => el.removeAttribute('required'));
    form.setAttribute('novalidate', '');
    form.requestSubmit();
    await waitFor(() => {
      expect(screen.getByText('Email не может быть пустым')).toBeInTheDocument();
    });
    expect(mocks.login).not.toHaveBeenCalled();
  });

  it('validates invalid email format on submit', async () => {
    const user = userEvent.setup();
    renderInRouter(<LoginModal isOpen={true} onClose={mockOnClose} />);
    await user.type(screen.getByPlaceholderText('your@email.com'), 'invalid-email');
    const form = screen.getByRole('button', { name: /Войти/ }).closest('form')!;
    form.setAttribute('novalidate', '');
    form.requestSubmit();
    await waitFor(() => {
      expect(screen.getByText('Введите корректный email адрес')).toBeInTheDocument();
    });
  });

  it('validates empty password on submit', async () => {
    const user = userEvent.setup();
    renderInRouter(<LoginModal isOpen={true} onClose={mockOnClose} />);
    // Fill valid email but leave password empty to isolate password validation
    await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
    const form = screen.getByRole('button', { name: /Войти/ }).closest('form')!;
    form.querySelectorAll('input[required]').forEach(el => el.removeAttribute('required'));
    form.setAttribute('novalidate', '');
    form.requestSubmit();
    await waitFor(() => {
      // Login should NOT be called because password is empty
      expect(mocks.login).not.toHaveBeenCalled();
    });
  });

  it('calls login with correct credentials', async () => {
    mocks.login.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderInRouter(<LoginModal isOpen={true} onClose={mockOnClose} />);
    const emailInput = screen.getByPlaceholderText('your@email.com');
    const passwordInput = screen.getByLabelText('Пароль');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    fireEvent.click(screen.getByRole('button', { name: /Войти/ }));
    await waitFor(() => {
      expect(mocks.login).toHaveBeenCalledWith(
        { email: 'test@example.com', password: 'password123' },
        false
      );
    });
  });

  it('calls onClose after successful login', async () => {
    mocks.login.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderInRouter(<LoginModal isOpen={true} onClose={mockOnClose} />);
    await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
    await user.type(screen.getByLabelText('Пароль'), 'password123');
    fireEvent.click(screen.getByRole('button', { name: /Войти/ }));
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('passes remember=true when checkbox is checked', async () => {
    mocks.login.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderInRouter(<LoginModal isOpen={true} onClose={mockOnClose} />);
    await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
    await user.type(screen.getByLabelText('Пароль'), 'password123');
    await user.click(screen.getByLabelText(/Запомнить меня/));
    fireEvent.click(screen.getByRole('button', { name: /Войти/ }));
    await waitFor(() => {
      expect(mocks.login).toHaveBeenCalledWith(
        { email: 'test@example.com', password: 'password123' },
        true
      );
    });
  });

  it('shows error on failed login', async () => {
    mocks.login.mockRejectedValueOnce(new Error('Invalid credentials'));
    const user = userEvent.setup();
    renderInRouter(<LoginModal isOpen={true} onClose={mockOnClose} />);
    await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
    await user.type(screen.getByLabelText('Пароль'), 'wrongpassword');
    fireEvent.click(screen.getByRole('button', { name: /Войти/ }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Authentication error');
    });
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('clears error on successful retry', async () => {
    mocks.login.mockRejectedValueOnce(new Error('Error'));
    mocks.login.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderInRouter(<LoginModal isOpen={true} onClose={mockOnClose} />);
    await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
    await user.type(screen.getByLabelText('Пароль'), 'password123');
    fireEvent.click(screen.getByRole('button', { name: /Войти/ }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Войти/ }));
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('disables submit button during loading', async () => {
    let resolveLogin!: () => void;
    mocks.login.mockImplementation(() => {
      mocks.isLoading = true;
      return new Promise<void>((r) => { resolveLogin = r; }).finally(() => { mocks.isLoading = false; });
    });
    const user = userEvent.setup();
    const { rerender } = renderInRouter(<LoginModal isOpen={true} onClose={mockOnClose} />);
    await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
    await user.type(screen.getByLabelText('Пароль'), 'password123');
    await user.click(screen.getByRole('button', { name: /Войти/ }));
    // Force re-render to pick up isLoading change
    rerender(<MemoryRouter><LoginModal isOpen={true} onClose={mockOnClose} /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Вход/ })).toBeDisabled();
    });
    resolveLogin();
    rerender(<MemoryRouter><LoginModal isOpen={true} onClose={mockOnClose} /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Войти/ })).not.toBeDisabled();
    });
  });

  it('calls switchAuthModal with register', async () => {
    const user = userEvent.setup();
    renderInRouter(<LoginModal isOpen={true} onClose={mockOnClose} />);
    await user.click(screen.getByText('Зарегистрироваться'));
    expect(mockSwitchAuthModal).toHaveBeenCalledWith('register');
  });

  it('clears email error when user fixes email', async () => {
    const user = userEvent.setup();
    renderInRouter(<LoginModal isOpen={true} onClose={mockOnClose} />);
    const emailInput = screen.getByPlaceholderText('your@email.com');
    await user.type(emailInput, 'invalid');
    fireEvent.blur(emailInput);
    await waitFor(() => {
      expect(screen.getByText('Введите корректный email адрес')).toBeInTheDocument();
    });
    await user.clear(emailInput);
    await user.type(emailInput, 'valid@example.com');
    await waitFor(() => {
      expect(screen.queryByText('Введите корректный email адрес')).not.toBeInTheDocument();
    });
  });
});
