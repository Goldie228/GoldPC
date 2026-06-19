import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StockBadge } from './StockBadge';

describe('StockBadge', () => {
  it('shows "No in stock" when stock is 0', () => {
    render(<StockBadge stock={0} />);
    expect(screen.getByText('Нет в наличии')).toBeInTheDocument();
  });

  it('shows "Low" when stock is 1-3', () => {
    render(<StockBadge stock={2} />);
    expect(screen.getByText('Мало')).toBeInTheDocument();
  });

  it('shows "In stock" when stock is > 3', () => {
    render(<StockBadge stock={10} />);
    expect(screen.getByText('В наличии')).toBeInTheDocument();
  });

  it('shows "Low" when stock is exactly 3', () => {
    render(<StockBadge stock={3} />);
    expect(screen.getByText('Мало')).toBeInTheDocument();
  });

  it('shows "Low" when stock is exactly 1', () => {
    render(<StockBadge stock={1} />);
    expect(screen.getByText('Мало')).toBeInTheDocument();
  });

  it('shows "In stock" when stock is exactly 4', () => {
    render(<StockBadge stock={4} />);
    expect(screen.getByText('В наличии')).toBeInTheDocument();
  });

  it('applies red styling for out of stock', () => {
    render(<StockBadge stock={0} />);
    const badge = screen.getByText('Нет в наличии');
    expect(badge.className).toContain('text-price-rise');
  });

  it('applies gold styling for low stock', () => {
    render(<StockBadge stock={2} />);
    const badge = screen.getByText('Мало');
    expect(badge.className).toContain('text-gold');
  });

  it('applies green styling for in stock', () => {
    render(<StockBadge stock={10} />);
    const badge = screen.getByText('В наличии');
    expect(badge.className).toContain('text-price-drop');
  });
});
