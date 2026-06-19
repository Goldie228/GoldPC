import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toast } from './Toast';

describe('Toast', () => {
  it('renders the message', () => {
    render(<Toast id="1" message="Operation successful" type="success" onClose={vi.fn()} />);
    expect(screen.getByText('Operation successful')).toBeInTheDocument();
  });

  it('renders as alert role', () => {
    render(<Toast id="1" message="Alert" type="info" onClose={vi.fn()} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('calls onClose with id when close button clicked', () => {
    const onClose = vi.fn();
    render(<Toast id="toast-123" message="Close me" type="error" onClose={onClose} />);
    fireEvent.click(screen.getByLabelText(/закрыть уведомление/i));
    expect(onClose).toHaveBeenCalledWith('toast-123');
  });

  it('applies success styling', () => {
    render(<Toast id="1" message="Success" type="success" onClose={vi.fn()} />);
    const toast = screen.getByRole('alert');
    expect(toast.className).toContain('border-price-drop');
  });

  it('applies error styling', () => {
    render(<Toast id="1" message="Error" type="error" onClose={vi.fn()} />);
    const toast = screen.getByRole('alert');
    expect(toast.className).toContain('border-price-rise');
  });

  it('applies info styling', () => {
    render(<Toast id="1" message="Info" type="info" onClose={vi.fn()} />);
    const toast = screen.getByRole('alert');
    expect(toast.className).toContain('border-info');
  });

  it('applies warning styling', () => {
    render(<Toast id="1" message="Warning" type="warning" onClose={vi.fn()} />);
    const toast = screen.getByRole('alert');
    expect(toast.className).toContain('border-gold');
  });
});
