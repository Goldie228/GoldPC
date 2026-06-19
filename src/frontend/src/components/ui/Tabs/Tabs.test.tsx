import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs } from './Tabs';

const tabs = [
  { id: 'specs', label: 'Specs', content: <p>Specs content</p> },
  { id: 'desc', label: 'Description', content: <p>Description content</p> },
  { id: 'reviews', label: 'Reviews', content: <p>Reviews content</p> },
];

describe('Tabs', () => {
  it('renders tab labels', () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getByRole('tab', { name: 'Specs' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Description' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Reviews' })).toBeInTheDocument();
  });

  it('renders first tab content by default', () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getByText('Specs content')).toBeInTheDocument();
  });

  it('switches content when tab is clicked', () => {
    render(<Tabs tabs={tabs} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Description' }));
    expect(screen.getByText('Description content')).toBeInTheDocument();
    expect(screen.queryByText('Specs content')).not.toBeInTheDocument();
  });

  it('marks active tab with aria-selected', () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getByRole('tab', { name: 'Specs' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Description' })).toHaveAttribute('aria-selected', 'false');
  });

  it('updates aria-selected on tab switch', () => {
    render(<Tabs tabs={tabs} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Reviews' }));
    expect(screen.getByRole('tab', { name: 'Reviews' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Specs' })).toHaveAttribute('aria-selected', 'false');
  });

  it('supports defaultTab', () => {
    render(<Tabs tabs={tabs} defaultTab="desc" />);
    expect(screen.getByText('Description content')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Description' })).toHaveAttribute('aria-selected', 'true');
  });

  it('applies custom className', () => {
    const { container } = render(<Tabs tabs={tabs} className="custom-tabs" />);
    expect(container.firstElementChild?.className).toContain('custom-tabs');
  });

  it('has tablist and tabpanel roles', () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
  });
});
