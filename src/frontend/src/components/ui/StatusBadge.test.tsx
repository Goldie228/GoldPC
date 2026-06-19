import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders the label', () => {
    render(<StatusBadge variant="info" label="Active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies info variant styling', () => {
    render(<StatusBadge variant="info" label="Info" />);
    const badge = screen.getByText('Info').closest('span');
    expect(badge?.className).toContain('bg-info-blue/10');
  });

  it('applies warning variant styling', () => {
    render(<StatusBadge variant="warning" label="Warning" />);
    const badge = screen.getByText('Warning').closest('span');
    expect(badge?.className).toContain('bg-warning/15');
  });

  it('applies neutral variant styling', () => {
    render(<StatusBadge variant="neutral" label="Cancelled" />);
    const badge = screen.getByText('Cancelled').closest('span');
    expect(badge?.className).toContain('bg-muted/10');
  });

  it('applies success variant styling', () => {
    render(<StatusBadge variant="success" label="Paid" />);
    const badge = screen.getByText('Paid').closest('span');
    expect(badge?.className).toContain('bg-price-drop/10');
  });

  it('applies pending variant styling', () => {
    render(<StatusBadge variant="pending" label="Draft" />);
    const badge = screen.getByText('Draft').closest('span');
    expect(badge?.className).toContain('bg-surface-elevated');
  });

  it('renders a status dot', () => {
    render(<StatusBadge variant="info" label="Status" />);
    const badge = screen.getByText('Status').closest('span');
    const dot = badge?.querySelector('.rounded-full');
    expect(dot).toBeInTheDocument();
  });
});
