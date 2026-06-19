import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { Pagination } from './Pagination';

afterEach(() => cleanup());

describe('Pagination', () => {
  const defaultProps = {
    page: 1,
    totalPages: 10,
    totalItems: 100,
    pageSize: 10,
    onPageChange: vi.fn(),
  };

  it('renders without crashing', () => {
    render(<Pagination {...defaultProps} />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders current page in input', () => {
    render(<Pagination {...defaultProps} page={5} />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('calls onPageChange when a page button is clicked', () => {
    const onPageChange = vi.fn();
    render(<Pagination {...defaultProps} page={3} onPageChange={onPageChange} />);
    const page4Btn = screen.getByRole('button', { name: 'Страница 4' });
    fireEvent.click(page4Btn);
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('disables previous buttons on first page', () => {
    render(<Pagination {...defaultProps} page={1} />);
    const prevBtn = screen.getByRole('button', { name: 'Предыдущая страница' });
    expect(prevBtn).toBeDisabled();
    const firstBtn = screen.getByRole('button', { name: 'На первую страницу' });
    expect(firstBtn).toBeDisabled();
  });

  it('disables next buttons on last page', () => {
    render(<Pagination {...defaultProps} page={10} />);
    const nextBtn = screen.getByRole('button', { name: 'Следующая страница' });
    expect(nextBtn).toBeDisabled();
    const lastBtn = screen.getByRole('button', { name: 'На последнюю страницу' });
    expect(lastBtn).toBeDisabled();
  });

  it('renders for single page', () => {
    render(<Pagination {...defaultProps} totalPages={1} />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});
