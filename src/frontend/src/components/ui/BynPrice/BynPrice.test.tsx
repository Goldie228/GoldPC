import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BynPrice } from './BynPrice';

describe('BynPrice', () => {
  it('renders the amount', () => {
    render(<BynPrice amount={100} />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders large numbers', () => {
    const { container } = render(<BynPrice amount={1234} />);
    const span = container.querySelector('span');
    expect(span?.textContent).toContain('234');
  });

  it('renders zero amount', () => {
    render(<BynPrice amount={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('applies size styles', () => {
    const { rerender } = render(<BynPrice amount={100} size="md" />);
    const span = screen.getByText('100').closest('span');
    expect(span).toHaveStyle({ fontSize: '1rem' });

    rerender(<BynPrice amount={100} size="lg" />);
    expect(span).toHaveStyle({ fontSize: '1.125rem' });
  });

  it('applies custom className', () => {
    render(<BynPrice amount={50} className="custom-price" />);
    const span = screen.getByText('50').closest('span');
    expect(span?.className).toContain('custom-price');
  });

  it('renders BYN icon SVG', () => {
    render(<BynPrice amount={100} />);
    const svg = document.querySelector('svg[aria-label="BYN"]');
    expect(svg).toBeInTheDocument();
  });

  it('uses tabular-nums font variant', () => {
    render(<BynPrice amount={100} />);
    const span = screen.getByText('100').closest('span');
    expect(span).toHaveStyle({ fontVariantNumeric: 'tabular-nums' });
  });
});
