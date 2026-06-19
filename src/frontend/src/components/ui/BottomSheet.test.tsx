import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { BottomSheet } from './BottomSheet';

describe('BottomSheet', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders children when open', () => {
    render(<BottomSheet isOpen={true} onClose={vi.fn()}>Sheet content</BottomSheet>);
    expect(screen.getByText('Sheet content')).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    render(<BottomSheet isOpen={false} onClose={vi.fn()}>Sheet content</BottomSheet>);
    expect(screen.queryByText('Sheet content')).not.toBeInTheDocument();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<BottomSheet isOpen={true} onClose={onClose}>Content</BottomSheet>);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<BottomSheet isOpen={true} onClose={onClose}>Content</BottomSheet>);
    const overlay = container.querySelector('.bottom-sheet-overlay');
    fireEvent.click(overlay!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when content inside is clicked', () => {
    const onClose = vi.fn();
    render(<BottomSheet isOpen={true} onClose={onClose}>Content</BottomSheet>);
    fireEvent.click(screen.getByText('Content'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('sets body overflow to hidden when open', () => {
    render(<BottomSheet isOpen={true} onClose={vi.fn()}>Content</BottomSheet>);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body overflow when closed', () => {
    const { rerender } = render(<BottomSheet isOpen={true} onClose={vi.fn()}>Content</BottomSheet>);
    expect(document.body.style.overflow).toBe('hidden');
    rerender(<BottomSheet isOpen={false} onClose={vi.fn()}>Content</BottomSheet>);
    expect(document.body.style.overflow).toBe('');
  });

  it('renders the handle element', () => {
    const { container } = render(<BottomSheet isOpen={true} onClose={vi.fn()}>Content</BottomSheet>);
    expect(container.querySelector('.bottom-sheet__handle')).toBeInTheDocument();
  });
});
