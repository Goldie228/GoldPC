import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SimplePageLoader } from './SimplePageLoader';

describe('SimplePageLoader', () => {
  it('renders without crashing', () => {
    const { container } = render(<SimplePageLoader />);
    expect(container.firstElementChild).toBeInTheDocument();
  });

  it('renders 10 skeleton bars', () => {
    const { container } = render(<SimplePageLoader />);
    const bars = container.querySelectorAll('.animate-pulse');
    expect(bars.length).toBe(10);
  });

  it('all skeleton bars have aria-hidden', () => {
    const { container } = render(<SimplePageLoader />);
    const bars = container.querySelectorAll('.animate-pulse');
    bars.forEach((bar) => {
      expect(bar).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
