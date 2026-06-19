import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { EmptyState } from './EmptyState';

afterEach(() => cleanup());

describe('EmptyState', () => {
  it('renders default title and description', () => {
    render(<EmptyState />);
    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
    expect(screen.getByText(/Попробуйте изменить параметры поиска/)).toBeInTheDocument();
  });

  it('renders custom title and description', () => {
    render(
      <EmptyState
        title="Нет товаров"
        description="Попробуйте другие фильтры"
      />
    );
    expect(screen.getByText('Нет товаров')).toBeInTheDocument();
    expect(screen.getByText('Попробуйте другие фильтры')).toBeInTheDocument();
  });

  it('shows reset button when onReset is provided', () => {
    const onReset = vi.fn();
    render(<EmptyState onReset={onReset} />);
    const resetBtn = screen.getByRole('button', { name: /сбросить/i });
    fireEvent.click(resetBtn);
    expect(onReset).toHaveBeenCalled();
  });

  it('hides reset button when showResetButton is false', () => {
    render(<EmptyState showResetButton={false} onReset={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /сбросить/i })).not.toBeInTheDocument();
  });

  it('renders custom action buttons', () => {
    const actions = [
      { label: 'На главную', onClick: vi.fn() },
      { label: 'В каталог', onClick: vi.fn() },
    ];
    render(<EmptyState actions={actions} />);
    expect(screen.getByText('На главную')).toBeInTheDocument();
    expect(screen.getByText('В каталог')).toBeInTheDocument();
  });

  it('calls action onClick when clicked', () => {
    const onClick = vi.fn();
    render(<EmptyState actions={[{ label: 'Действие', onClick }]} />);
    fireEvent.click(screen.getByText('Действие'));
    expect(onClick).toHaveBeenCalled();
  });
});
