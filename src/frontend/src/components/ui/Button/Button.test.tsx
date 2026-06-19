import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('renders with primary variant by default', () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-gold');
  });

  it('renders with specified variant', () => {
    render(<Button variant="danger">Danger</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-price-rise');
  });

  it('renders with secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-surface-elevated');
  });

  it('renders with outline variant', () => {
    render(<Button variant="outline">Outline</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-transparent');
  });

  it('renders with ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-transparent');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} disabled>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies disabled styles', () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn.className).toContain('disabled:opacity-50');
  });

  it('renders with fullWidth', () => {
    render(<Button fullWidth>Full Width</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('w-full');
  });

  it('renders leftIcon', () => {
    render(<Button leftIcon={<span data-testid="icon">+</span>}>Add</Button>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders rightIcon', () => {
    render(<Button rightIcon={<span data-testid="icon">&rarr;</span>}>Next</Button>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders legacy icon prop as rightIcon', () => {
    render(<Button icon={<span data-testid="icon">*</span>}>With Icon</Button>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('prefers rightIcon over icon', () => {
    render(
      <Button
        rightIcon={<span data-testid="right">R</span>}
        icon={<span data-testid="legacy">L</span>}
      >
        Both
      </Button>
    );
    expect(screen.getByTestId('right')).toBeInTheDocument();
    expect(screen.queryByTestId('legacy')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('custom-class');
  });

  it('forwards additional button attributes', () => {
    render(<Button type="submit" aria-label="Submit form">Submit</Button>);
    const btn = screen.getByRole('button', { name: /submit form/i });
    expect(btn).toHaveAttribute('type', 'submit');
  });
});
