import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Icon } from './Icon';

describe('Icon', () => {
  it('renders a known icon by name', () => {
    const { container } = render(<Icon name="home" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders with custom size as number', () => {
    const { container } = render(<Icon name="home" size={32} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('renders with predefined size "lg" = 24', () => {
    const { container } = render(<Icon name="home" size="lg" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
  });

  it('renders with default size "md" = 20', () => {
    const { container } = render(<Icon name="home" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '20');
    expect(svg).toHaveAttribute('height', '20');
  });

  it('renders with custom className', () => {
    const { container } = render(<Icon name="home" className="text-gold" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('class')).toContain('text-gold');
  });

  it('renders with predefined color', () => {
    const { container } = render(<Icon name="home" color="success" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders different icon names', () => {
    const { container: c1 } = render(<Icon name="search" />);
    const { container: c2 } = render(<Icon name="settings" />);
    expect(c1.querySelector('svg')).toBeInTheDocument();
    expect(c2.querySelector('svg')).toBeInTheDocument();
  });

  it('applies aria-label when provided', () => {
    const { container } = render(<Icon name="home" aria-label="Home icon" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-label', 'Home icon');
  });

  it('applies strokeWidth', () => {
    const { container } = render(<Icon name="home" strokeWidth={1} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('stroke-width', '1');
  });
});
