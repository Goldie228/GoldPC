import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Home } from 'lucide-react';
import { IconBox } from './IconBox';

describe('IconBox', () => {
  it('renders without crashing', () => {
    const { container } = render(<IconBox icon={Home} />);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('renders the icon', () => {
    const { container } = render(<IconBox icon={Home} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('applies default md container size', () => {
    const { container } = render(<IconBox icon={Home} />);
    const box = container.firstElementChild as HTMLElement;
    expect(box.className).toContain('w-12');
    expect(box.className).toContain('h-12');
  });

  it('applies sm container size', () => {
    const { container } = render(<IconBox icon={Home} containerSize="sm" />);
    const box = container.firstElementChild as HTMLElement;
    expect(box.className).toContain('w-10');
    expect(box.className).toContain('h-10');
  });

  it('applies lg container size', () => {
    const { container } = render(<IconBox icon={Home} containerSize="lg" />);
    const box = container.firstElementChild as HTMLElement;
    expect(box.className).toContain('w-14');
    expect(box.className).toContain('h-14');
  });

  it('applies default variant styling', () => {
    const { container } = render(<IconBox icon={Home} />);
    const box = container.firstElementChild as HTMLElement;
    expect(box.className).toContain('bg-surface-elevated');
  });

  it('applies gold variant styling', () => {
    const { container } = render(<IconBox icon={Home} variant="gold" />);
    const box = container.firstElementChild as HTMLElement;
    expect(box.className).toContain('bg-gold/10');
    expect(box.className).toContain('text-gold');
  });

  it('uses custom icon size when provided', () => {
    const { container } = render(<IconBox icon={Home} size={40} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '40');
    expect(svg).toHaveAttribute('height', '40');
  });
});
