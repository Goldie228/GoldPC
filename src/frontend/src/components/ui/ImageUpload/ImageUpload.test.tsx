import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ImageUpload } from './ImageUpload';

vi.mock('@/hooks/useToast', () => ({
  useToast: vi.fn(() => ({
    showToast: vi.fn(),
    toasts: [],
    removeToast: vi.fn(),
    clearToasts: vi.fn(),
  })),
}));

vi.mock('@/api/admin', () => ({
  imagesAdminApi: {
    upload: vi.fn(),
    delete: vi.fn(),
    setPrimary: vi.fn(),
    reorder: vi.fn(),
  },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('ImageUpload', () => {
  const defaultProps = {
    productId: 'product-1',
    images: [],
    onImagesChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload zone', () => {
    render(<ImageUpload {...defaultProps} />);
    expect(screen.getByText(/нажмите для загрузки/i)).toBeInTheDocument();
  });

  it('shows empty state when no images', () => {
    render(<ImageUpload {...defaultProps} />);
    expect(screen.getByText(/изображения не добавлены/i)).toBeInTheDocument();
  });

  it('renders existing images', () => {
    const images = [
      { id: '1', url: '/img1.jpg', isPrimary: true, sortOrder: 0 },
      { id: '2', url: '/img2.jpg', isPrimary: false, sortOrder: 1 },
    ];
    const { container } = render(<ImageUpload {...defaultProps} images={images} />);
    const imgElements = container.querySelectorAll('img');
    expect(imgElements.length).toBe(2);
  });

  it('shows max files info', () => {
    render(<ImageUpload {...defaultProps} />);
    expect(screen.getByText(/до 10 шт/)).toBeInTheDocument();
  });

  it('shows custom maxFiles', () => {
    render(<ImageUpload {...defaultProps} maxFiles={5} />);
    expect(screen.getByText(/до 5 шт/)).toBeInTheDocument();
  });
});
