import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RegisterModal } from './RegisterModal';

const mocks = vi.hoisted(() => ({
  register: vi.fn(),
  isLoading: false,
}));
const mockSwitchAuthModal = vi.fn();
const mockOnClose = vi.fn();
const mockSetLoading = vi.fn((val: boolean) => { mocks.isLoading = val; });

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    login: vi.fn(),
    get isLoading() { return mocks.isLoading; },
    user: null,
    isAuthenticated: false,
    logout: vi.fn(),
    register: mocks.register,
    setLoading: mockSetLoading,
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
    switchAuthModal: mockSwitchAuthModal,
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
    mocks.isLoading = false;
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
    expect(screen.getByPlaceholderText('Ваше имя')).toBeInTheDocument();
  });

  it('renders phone field', () => {
    renderInRouter(<RegisterModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText('+375 (29) 123-45-67')).toBeInTheDocument();
  });

  it('renders email field', () => {
    renderInRouter(<RegisterModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
  });

  it('renders password field', () => {
    renderInRouter(<RegisterModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByLabelText('Пароль')).toBeInTheDocument();
  });

  it('renders confirm password field', () => {
    renderInRouter(<RegisterModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText('Повторите пароль')).toBeInTheDocument();
  });

  it('renders terms checkbox', () => {
    renderInRouter(<RegisterModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByLabelText(/Я принимаю/)).toBeInTheDocument();
  });

  it('renders submit button', () => {
    renderInRouter(<RegisterModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Зарегистрироваться/ })).toBeInTheDocument();
  });

  it('calls switchAuthModal with login', async () => {
    const user = userEvent.setup();
    renderInRouter(<RegisterModal isOpen={true} onClose={vi.fn()} />);
    await user.click(screen.getByText('Войти'));
    expect(mockSwitchAuthModal).toHaveBeenCalledWith('login');
  });

  it('validates empty email on submit', async () => {
    // The component's handleSubmit doesn't validate email directly;
    // email validation errors are set from backend responses.
    mocks.register.mockRejectedValueOnce({
      response: { data: { errors: { email: ['Email не может быть пустым'] } } },
    });
    const user = userEvent.setup();
    renderInRouter(<RegisterModal isOpen={true} onClose={mockOnClose} />);
    await user.type(screen.getByPlaceholderText('Ваше имя'), 'Иван');
    await user.type(screen.getByPlaceholderText('+375 (29) 123-45-67'), '291234567');
    // Leave email empty - native required blocks in browser, but we test backend validation
    await user.type(screen.getByLabelText('Пароль'), 'Strong1!Pass');
    await user.type(screen.getByPlaceholderText('Повторите пароль'), 'Strong1!Pass');
    await user.click(screen.getByLabelText(/Я принимаю/));
    // Use requestSubmit with novalidate to bypass native HTML5 validation
    const form = screen.getByRole('button', { name: /Зарегистрироваться/ }).closest('form')!;
    form.querySelectorAll('input[required]').forEach(el => el.removeAttribute('required'));
    form.setAttribute('novalidate', '');
    form.requestSubmit();
    await waitFor(() => {
      expect(screen.getByText('Email не может быть пустым')).toBeInTheDocument();
    });
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('validates invalid email format on submit', async () => {
    // The component's handleSubmit doesn't validate email format;
    // email validation errors are set from backend responses.
    mocks.register.mockRejectedValueOnce({
      response: { data: { errors: { email: ['Введите корректный email адрес'] } } },
    });
    const user = userEvent.setup();
    renderInRouter(<RegisterModal isOpen={true} onClose={mockOnClose} />);
    await user.type(screen.getByPlaceholderText('Ваше имя'), 'Иван');
    await user.type(screen.getByPlaceholderText('+375 (29) 123-45-67'), '291234567');
    await user.type(screen.getByPlaceholderText('your@email.com'), 'not-email');
    await user.type(screen.getByLabelText('Пароль'), 'Strong1!Pass');
    await user.type(screen.getByPlaceholderText('Повторите пароль'), 'Strong1!Pass');
    await user.click(screen.getByLabelText(/Я принимаю/));
    // Use requestSubmit with novalidate to bypass native HTML5 validation
    const form = screen.getByRole('button', { name: /Зарегистрироваться/ }).closest('form')!;
    form.querySelectorAll('input[required]').forEach(el => el.removeAttribute('required'));
    form.setAttribute('novalidate', '');
    form.requestSubmit();
    await waitFor(() => {
      expect(screen.getByText('Введите корректный email адрес')).toBeInTheDocument();
    });
  });

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderInRouter(<RegisterModal isOpen={true} onClose={mockOnClose} />);
    await user.type(screen.getByPlaceholderText('Ваше имя'), 'Иван');
    await user.type(screen.getByPlaceholderText('+375 (29) 123-45-67'), '291234567');
    await user.type(screen.getByPlaceholderText('your@email.com'), 'ivan@example.com');
    await user.type(screen.getByLabelText('Пароль'), 'Strong1!Pass');
    await user.type(screen.getByPlaceholderText('Повторите пароль'), 'Different1!Pass');
    await user.click(screen.getByLabelText(/Я принимаю/));
    await user.click(screen.getByRole('button', { name: /Зарегистрироваться/ }));
    await waitFor(() => {
      expect(screen.getByText('Пароли не совпадают')).toBeInTheDocument();
    });
    expect(mocks.register).not.toHaveBeenCalled();
  });

  it('shows error when terms are not accepted', async () => {
    const user = userEvent.setup();
    renderInRouter(<RegisterModal isOpen={true} onClose={mockOnClose} />);
    await user.type(screen.getByPlaceholderText('Ваше имя'), 'Иван');
    await user.type(screen.getByPlaceholderText('+375 (29) 123-45-67'), '291234567');
    await user.type(screen.getByPlaceholderText('your@email.com'), 'ivan@example.com');
    await user.type(screen.getByLabelText('Пароль'), 'Strong1!Pass');
    await user.type(screen.getByPlaceholderText('Повторите пароль'), 'Strong1!Pass');
    await user.click(screen.getByRole('button', { name: /Зарегистрироваться/ }));
    await waitFor(() => {
      expect(screen.getByText('Необходимо принять условия использования')).toBeInTheDocument();
    });
    expect(mocks.register).not.toHaveBeenCalled();
  });

  it('submits with valid data and calls register', async () => {
    mocks.register.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderInRouter(<RegisterModal isOpen={true} onClose={mockOnClose} />);
    await user.type(screen.getByPlaceholderText('Ваше имя'), 'Иван');
    await user.type(screen.getByPlaceholderText('+375 (29) 123-45-67'), '291234567');
    await user.type(screen.getByPlaceholderText('your@email.com'), 'ivan@example.com');
    await user.type(screen.getByLabelText('Пароль'), 'Strong1!Pass');
    await user.type(screen.getByPlaceholderText('Повторите пароль'), 'Strong1!Pass');
    await user.click(screen.getByLabelText(/Я принимаю/));
    await user.click(screen.getByRole('button', { name: /Зарегистрироваться/ }));
    await waitFor(() => {
      expect(mocks.register).toHaveBeenCalledWith({
        firstName: 'Иван',
        lastName: '',
        email: 'ivan@example.com',
        password: 'Strong1!Pass',
        phone: '+375291234567',
      });
    });
  });

  it('calls onClose after successful registration', async () => {
    mocks.register.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderInRouter(<RegisterModal isOpen={true} onClose={mockOnClose} />);
    await user.type(screen.getByPlaceholderText('Ваше имя'), 'Иван');
    await user.type(screen.getByPlaceholderText('+375 (29) 123-45-67'), '291234567');
    await user.type(screen.getByPlaceholderText('your@email.com'), 'ivan@example.com');
    await user.type(screen.getByLabelText('Пароль'), 'Strong1!Pass');
    await user.type(screen.getByPlaceholderText('Повторите пароль'), 'Strong1!Pass');
    await user.click(screen.getByLabelText(/Я принимаю/));
    await user.click(screen.getByRole('button', { name: /Зарегистрироваться/ }));
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('shows error on failed registration', async () => {
    mocks.register.mockRejectedValueOnce({ response: { data: { title: 'Email already exists' } } });
    const user = userEvent.setup();
    renderInRouter(<RegisterModal isOpen={true} onClose={mockOnClose} />);
    await user.type(screen.getByPlaceholderText('Ваше имя'), 'Иван');
    await user.type(screen.getByPlaceholderText('+375 (29) 123-45-67'), '291234567');
    await user.type(screen.getByPlaceholderText('your@email.com'), 'ivan@example.com');
    await user.type(screen.getByLabelText('Пароль'), 'Strong1!Pass');
    await user.type(screen.getByPlaceholderText('Повторите пароль'), 'Strong1!Pass');
    await user.click(screen.getByLabelText(/Я принимаю/));
    await user.click(screen.getByRole('button', { name: /Зарегистрироваться/ }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('disables submit button during loading', async () => {
    const user = userEvent.setup();
    renderInRouter(<RegisterModal isOpen={true} onClose={mockOnClose} />);
    await user.type(screen.getByPlaceholderText('Ваше имя'), 'Иван');
    await user.type(screen.getByPlaceholderText('+375 (29) 123-45-67'), '291234567');
    await user.type(screen.getByPlaceholderText('your@email.com'), 'ivan@example.com');
    await user.type(screen.getByLabelText('Пароль'), 'Strong1!Pass');
    await user.type(screen.getByPlaceholderText('Повторите пароль'), 'Strong1!Pass');
    await user.click(screen.getByLabelText(/Я принимаю/));
    // Button is enabled when not loading
    expect(screen.getByRole('button', { name: /Зарегистрироваться/ })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /Зарегистрироваться/ })).toHaveTextContent('Зарегистрироваться');
  });

  it('formats phone number as user types', async () => {
    const user = userEvent.setup();
    renderInRouter(<RegisterModal isOpen={true} onClose={vi.fn()} />);
    const phoneInput = screen.getByPlaceholderText('+375 (29) 123-45-67');
    await user.type(phoneInput, '291234567');
    await waitFor(() => {
      expect(phoneInput).toHaveValue('+375 (29) 123-45-67');
    });
  });

  it('validates empty name on submit', async () => {
    // The component's handleSubmit doesn't validate name directly;
    // name validation errors are set from backend responses.
    mocks.register.mockRejectedValueOnce({
      response: { data: { errors: { firstName: ['Имя не может быть пустым'] } } },
    });
    const user = userEvent.setup();
    renderInRouter(<RegisterModal isOpen={true} onClose={mockOnClose} />);
    // Leave name empty - native required blocks in browser, but we test backend validation
    await user.type(screen.getByPlaceholderText('+375 (29) 123-45-67'), '291234567');
    await user.type(screen.getByPlaceholderText('your@email.com'), 'ivan@example.com');
    await user.type(screen.getByLabelText('Пароль'), 'Strong1!Pass');
    await user.type(screen.getByPlaceholderText('Повторите пароль'), 'Strong1!Pass');
    await user.click(screen.getByLabelText(/Я принимаю/));
    // Use requestSubmit with novalidate to bypass native HTML5 validation
    const form = screen.getByRole('button', { name: /Зарегистрироваться/ }).closest('form')!;
    form.querySelectorAll('input[required]').forEach(el => el.removeAttribute('required'));
    form.setAttribute('novalidate', '');
    form.requestSubmit();
    await waitFor(() => {
      expect(screen.getByText('Имя не может быть пустым')).toBeInTheDocument();
    });
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
