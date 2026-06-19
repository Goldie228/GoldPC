import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Breadcrumbs } from './Breadcrumbs';

function renderInRouter(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('Breadcrumbs', () => {
  it('renders nothing when items is empty', () => {
    const { container } = renderInRouter(<Breadcrumbs items={[]} />);
    expect(container.firstElementChild).toBeNull();
  });

  it('renders a single breadcrumb item', () => {
    renderInRouter(<Breadcrumbs items={[{ label: 'Home' }]} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('renders multiple breadcrumb items', () => {
    renderInRouter(
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Catalog', to: '/catalog' }, { label: 'Product' }]} />
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Catalog')).toBeInTheDocument();
    expect(screen.getByText('Product')).toBeInTheDocument();
  });

  it('renders non-last items as links when they have to prop', () => {
    renderInRouter(
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Current' }]} />
    );
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renders last item as a span (not a link)', () => {
    renderInRouter(
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Current' }]} />
    );
    const currentItem = screen.getByText('Current');
    expect(currentItem.tagName).toBe('SPAN');
    expect(currentItem).toHaveAttribute('aria-current', 'page');
  });

  it('renders items without to prop as non-links', () => {
    renderInRouter(
      <Breadcrumbs items={[{ label: 'No Link' }]} />
    );
    const item = screen.getByText('No Link');
    expect(item.tagName).toBe('SPAN');
  });

  it('renders chevron separators between items', () => {
    const { container } = renderInRouter(
      <Breadcrumbs items={[{ label: 'A' }, { label: 'B' }]} />
    );
    const chevrons = container.querySelectorAll('svg');
    expect(chevrons.length).toBeGreaterThanOrEqual(1);
  });

  it('has accessible nav landmark', () => {
    renderInRouter(<Breadcrumbs items={[{ label: 'Home' }]} />);
    expect(screen.getByRole('navigation', { name: /навигационная цепочка/i })).toBeInTheDocument();
  });
});
