import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Modal } from './Modal';

describe('Modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    children: <p>Modal content</p>,
  };

  it('renders when isOpen is true', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText(/закрыть/i));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('hides close button when showCloseButton is false', () => {
    render(<Modal {...defaultProps} showCloseButton={false} />);
    expect(screen.queryByLabelText(/закрыть/i)).not.toBeInTheDocument();
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose on Escape when closeOnEscape is false', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} closeOnEscape={false} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('sets body overflow to hidden when open', () => {
    render(<Modal {...defaultProps} />);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body overflow on close', () => {
    const { rerender } = render(<Modal {...defaultProps} />);
    expect(document.body.style.overflow).toBe('hidden');
    rerender(<Modal {...defaultProps} isOpen={false} />);
    expect(document.body.style.overflow).toBe('');
  });

  it('renders with large size', () => {
    render(<Modal {...defaultProps} size="large" />);
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });

  it('applies custom className to modal', () => {
    const { container } = render(<Modal {...defaultProps} className="custom-modal" />);
    const modal = container.querySelector('.modal');
    expect(modal?.getAttribute('class')).toContain('custom-modal');
  });
});
