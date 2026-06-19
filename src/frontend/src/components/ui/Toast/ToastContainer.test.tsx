import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ToastContainer } from './ToastContainer';

vi.mock('@/hooks/useToast', () => ({
  useToast: vi.fn(),
}));

import { useToast } from '@/hooks/useToast';
const mockUseToast = vi.mocked(useToast);

describe('ToastContainer', () => {
  it('renders nothing when no toasts', () => {
    mockUseToast.mockReturnValue({
      toasts: [],
      showToast: vi.fn(),
      removeToast: vi.fn(),
      clearToasts: vi.fn(),
    });
    const { container } = render(<ToastContainer />);
    expect(container.firstElementChild).toBeNull();
  });

  it('renders toasts when present', () => {
    mockUseToast.mockReturnValue({
      toasts: [
        { id: '1', message: 'Success!', type: 'success' },
        { id: '2', message: 'Error!', type: 'error' },
      ],
      showToast: vi.fn(),
      removeToast: vi.fn(),
      clearToasts: vi.fn(),
    });
    render(<ToastContainer />);
    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Error!')).toBeInTheDocument();
  });

  it('has correct aria-label', () => {
    mockUseToast.mockReturnValue({
      toasts: [{ id: '1', message: 'Test', type: 'info' }],
      showToast: vi.fn(),
      removeToast: vi.fn(),
      clearToasts: vi.fn(),
    });
    render(<ToastContainer />);
    expect(screen.getByLabelText('Уведомления')).toBeInTheDocument();
  });
});
