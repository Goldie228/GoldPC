import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ActiveFiltersBar } from './ActiveFiltersBar';

afterEach(() => cleanup());

describe('ActiveFiltersBar', () => {
  it('returns null when chips array is empty', () => {
    const { container } = render(
      <ActiveFiltersBar chips={[]} activeCount={0} onClearAll={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders chip labels', () => {
    const chips = [
      { id: '1', label: 'Intel', onRemove: vi.fn() },
      { id: '2', label: 'AMD', onRemove: vi.fn() },
    ];
    render(<ActiveFiltersBar chips={chips} activeCount={2} onClearAll={vi.fn()} />);
    expect(screen.getByText('Intel')).toBeInTheDocument();
    expect(screen.getByText('AMD')).toBeInTheDocument();
  });

  it('calls onRemove when remove button is clicked', () => {
    const onRemove = vi.fn();
    const chips = [{ id: '1', label: 'Intel', onRemove }];
    render(<ActiveFiltersBar chips={chips} activeCount={1} onClearAll={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Удалить фильтр/i }));
    expect(onRemove).toHaveBeenCalled();
  });

  it('renders chips with remove buttons when chips exist', () => {
    const chips = [
      { id: '1', label: 'Intel', onRemove: vi.fn() },
      { id: '2', label: 'AMD', onRemove: vi.fn() },
    ];
    render(<ActiveFiltersBar chips={chips} activeCount={2} onClearAll={vi.fn()} />);
    const removeButtons = screen.getAllByRole('button', { name: /Удалить фильтр/i });
    expect(removeButtons).toHaveLength(2);
  });
});
