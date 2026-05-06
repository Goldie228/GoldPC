import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toolbar } from './Toolbar';

describe('Toolbar', () => {
  const defaultProps = {
    sortBy: 'popular' as const,
    onSortChange: vi.fn(),
    viewMode: 'grid' as const,
    onViewModeChange: vi.fn(),
    activeFilterCount: 0,
    onFilterClick: vi.fn(),
  };

  it('renders correctly', () => {
    render(<Toolbar {...defaultProps} />);
    expect(screen.getByRole('combobox')).toBeTruthy();
  });

  it('displays sort options', () => {
    render(<Toolbar {...defaultProps} />);
    expect(screen.getByText('По популярности')).toBeTruthy();
    expect(screen.getByText('Цена: по возрастанию')).toBeTruthy();
  });

  it('shows active filter count', () => {
    render(<Toolbar {...defaultProps} activeFilterCount={3} />);
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('calls onSortChange when sort option changes', () => {
    const onSortChange = vi.fn();
    render(<Toolbar {...defaultProps} onSortChange={onSortChange} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'price-asc' } });
    expect(onSortChange).toHaveBeenCalled();
  });
});
