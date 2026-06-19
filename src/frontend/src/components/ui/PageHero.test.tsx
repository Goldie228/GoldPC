import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Settings } from 'lucide-react';
import { PageHero } from './PageHero';

describe('PageHero', () => {
  it('renders title', () => {
    render(<PageHero title="Settings" />);
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<PageHero title="Settings" description="Manage your preferences" />);
    expect(screen.getByText('Manage your preferences')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<PageHero title="Settings" />);
    expect(screen.queryByText('Manage your preferences')).not.toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<PageHero title="Settings" icon={Settings} />);
    const iconContainer = document.querySelector('.w-12.h-12');
    expect(iconContainer).toBeInTheDocument();
  });

  it('does not render icon container when no icon', () => {
    const { container } = render(<PageHero title="Settings" />);
    expect(container.querySelector('.w-12.h-12')).not.toBeInTheDocument();
  });

  it('renders as h1 heading', () => {
    render(<PageHero title="Page Title" />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
