import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstElementChild).toBeInTheDocument();
  });

  it('applies default animate-pulse class', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstElementChild?.className).toContain('animate-pulse');
  });

  it('applies width as number (pixels)', () => {
    const { container } = render(<Skeleton width={100} />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveStyle({ width: '100px' });
  });

  it('applies width as string', () => {
    const { container } = render(<Skeleton width="50%" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveStyle({ width: '50%' });
  });

  it('applies height as number', () => {
    const { container } = render(<Skeleton height={40} />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveStyle({ height: '40px' });
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="my-class" />);
    expect(container.firstElementChild?.className).toContain('my-class');
  });

  it('applies borderRadius sm', () => {
    const { container } = render(<Skeleton borderRadius="sm" />);
    expect(container.firstElementChild?.className).toContain('rounded');
  });

  it('applies borderRadius full', () => {
    const { container } = render(<Skeleton borderRadius="full" />);
    expect(container.firstElementChild?.className).toContain('rounded-full');
  });

  it('applies borderRadius none', () => {
    const { container } = render(<Skeleton borderRadius="none" />);
    expect(container.firstElementChild?.className).toContain('rounded-none');
  });
});
