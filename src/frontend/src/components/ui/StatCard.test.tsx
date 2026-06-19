import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Users } from 'lucide-react';
import { StatCard } from './StatCard';

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Users" value={1234} />);
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('1234')).toBeInTheDocument();
  });

  it('renders string value', () => {
    render(<StatCard label="Revenue" value="$1,200" />);
    expect(screen.getByText('$1,200')).toBeInTheDocument();
  });

  it('renders trend up indicator', () => {
    render(<StatCard label="Users" value={100} trend={{ direction: 'up', value: '+12%' }} />);
    expect(screen.getByText('+12%')).toBeInTheDocument();
  });

  it('renders trend down indicator', () => {
    render(<StatCard label="Users" value={100} trend={{ direction: 'down', value: '-5%' }} />);
    expect(screen.getByText('-5%')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<StatCard label="Users" value={100} icon={Users} />);
    const iconContainer = document.querySelector('.w-10.h-10');
    expect(iconContainer).toBeInTheDocument();
  });

  it('does not render icon container when no icon', () => {
    const { container } = render(<StatCard label="Users" value={100} />);
    expect(container.querySelector('.w-10.h-10')).not.toBeInTheDocument();
  });

  it('applies default variant styling', () => {
    render(<StatCard label="Users" value={100} />);
    const valueEl = screen.getByText('100');
    expect(valueEl.className).toContain('text-foreground');
  });

  it('applies callout variant styling', () => {
    render(<StatCard label="Users" value={100} variant="callout" />);
    const valueEl = screen.getByText('100');
    expect(valueEl.className).toContain('text-gold');
  });

  it('hides trend when not provided', () => {
    const { container } = render(<StatCard label="Users" value={100} />);
    expect(container.querySelector('.text-xs.text-muted-foreground.mt-1')).not.toBeInTheDocument();
  });
});
