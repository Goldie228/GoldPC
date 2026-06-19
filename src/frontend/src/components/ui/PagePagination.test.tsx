import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PagePagination } from './PagePagination';

describe('PagePagination', () => {
  it('renders nothing when totalPages is 1', () => {
    const { container } = render(
      <PagePagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />
    );
    expect(container.firstElementChild).toBeNull();
  });

  it('renders page buttons', () => {
    render(<PagePagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('highlights current page', () => {
    render(<PagePagination currentPage={3} totalPages={5} onPageChange={vi.fn()} />);
    const page3Button = screen.getByText('3');
    expect(page3Button.className).toContain('bg-gold');
  });

  it('calls onPageChange when page clicked', () => {
    const onPageChange = vi.fn();
    render(<PagePagination currentPage={1} totalPages={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByText('2'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('disables "Назад" on first page', () => {
    render(<PagePagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByText('Назад')).toBeDisabled();
  });

  it('disables "Далее" on last page', () => {
    render(<PagePagination currentPage={5} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByText('Далее')).toBeDisabled();
  });

  it('shows ellipsis for many pages', () => {
    render(<PagePagination currentPage={5} totalPages={20} onPageChange={vi.fn()} />);
    const dots = screen.getAllByText('...');
    expect(dots.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onPageChange with previous page when "Назад" clicked', () => {
    const onPageChange = vi.fn();
    render(<PagePagination currentPage={3} totalPages={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByText('Назад'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange with next page when "Далее" clicked', () => {
    const onPageChange = vi.fn();
    render(<PagePagination currentPage={3} totalPages={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByText('Далее'));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });
});
