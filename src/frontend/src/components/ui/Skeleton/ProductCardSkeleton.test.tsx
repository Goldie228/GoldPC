import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ProductCardSkeleton } from './ProductCardSkeleton';

describe('ProductCardSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<ProductCardSkeleton />);
    expect(container.firstElementChild).toBeInTheDocument();
  });

  it('renders as article element', () => {
    const { container } = render(<ProductCardSkeleton />);
    expect(container.querySelector('article')).toBeInTheDocument();
  });

  it('has aria-hidden attribute', () => {
    const { container } = render(<ProductCardSkeleton />);
    const article = container.querySelector('article');
    expect(article).toHaveAttribute('aria-hidden', 'true');
  });

  it('contains skeleton loading elements', () => {
    const { container } = render(<ProductCardSkeleton />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
