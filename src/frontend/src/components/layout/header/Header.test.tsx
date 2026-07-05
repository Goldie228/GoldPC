import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Header } from './Header';

vi.mock('@/hooks/useCart', () => ({
  useCart: vi.fn(() => ({
    itemCount: 0,
    items: [],
    addItem: vi.fn(),
    removeItem: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    total: 0,
  })),
}));

vi.mock('@/hooks/useWishlist', () => ({
  useWishlist: vi.fn(() => ({
    items: [],
    addItem: vi.fn(),
    removeItem: vi.fn(),
    isInWishlist: vi.fn(() => false),
  })),
}));

vi.mock('@/hooks/useComparison', () => ({
  useComparison: vi.fn(() => ({
    items: [],
    addItem: vi.fn(),
    removeItem: vi.fn(),
    isInComparison: vi.fn(() => false),
  })),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
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
  })),
}));

vi.mock('@/hooks/useModal', () => ({
  useModal: vi.fn(() => ({
    isOpen: false,
    modalContent: null,
    openModal: vi.fn(),
    closeModal: vi.fn(),
    closeAll: vi.fn(),
    toggleModal: vi.fn(),
  })),
}));

vi.mock('@/hooks/useAuthModal', () => ({
  useAuthModal: vi.fn(() => ({
    activeModal: null,
    openLoginModal: vi.fn(),
    openRegisterModal: vi.fn(),
    closeAuthModal: vi.fn(),
    switchAuthModal: vi.fn(),
  })),
}));

vi.mock('@/components/layout/header/MiniCart', () => ({
  MiniCart: () => <div data-testid="mini-cart">MiniCart</div>,
}));

vi.mock('@/components/notification-center/NotificationCenter', () => ({
  NotificationCenter: () => <div data-testid="notification-center">Notifications</div>,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    nav: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => <nav {...props}>{children}</nav>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function renderInRouter(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders without crashing', () => {
    renderInRouter(<Header />);
    expect(document.querySelector('header')).toBeInTheDocument();
  });

  it('renders the logo/brand name', () => {
    renderInRouter(<Header />);
    // Text is split: "Gold" + <span>PC</span>, so query the контейнер
    const logo = screen.getByText(/Gold/);
    expect(logo).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderInRouter(<Header />);
    expect(screen.getByText('Каталог')).toBeInTheDocument();
    expect(screen.getByText('Конструктор')).toBeInTheDocument();
  });

  it('renders user login button when not authenticated', () => {
    renderInRouter(<Header />);
    expect(screen.getByLabelText(/войти/i)).toBeInTheDocument();
  });

  it('renders cart icon', () => {
    renderInRouter(<Header />);
    expect(screen.getByLabelText(/корзина/i)).toBeInTheDocument();
  });

  it('renders the GoldPC link pointing to home', () => {
    renderInRouter(<Header />);
    const logoLink = screen.getByText(/Gold/).closest('a');
    expect(logoLink).toHaveAttribute('href', '/');
  });
});
