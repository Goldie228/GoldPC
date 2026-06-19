import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders with title', () => {
    render(<Card title="My Card">Content</Card>);
    expect(screen.getByText('My Card')).toBeInTheDocument();
  });

  it('renders with badge', () => {
    render(<Card badge="NEW">Content</Card>);
    expect(screen.getByText('NEW')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Card onClick={onClick}>Clickable</Card>);
    fireEvent.click(screen.getByText('Clickable'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders as article by default', () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.querySelector('article')).toBeInTheDocument();
  });

  it('renders as div when as="div"', () => {
    const { container } = render(<Card as="div">Content</Card>);
    expect(container.querySelector('div')).toBeInTheDocument();
    expect(container.querySelector('article')).not.toBeInTheDocument();
  });

  it('renders as section when as="section"', () => {
    const { container } = render(<Card as="section">Content</Card>);
    expect(container.querySelector('section')).toBeInTheDocument();
  });

  it('applies hoverable class when hoverable is true', () => {
    render(<Card hoverable>Hoverable</Card>);
    const card = screen.getByText('Hoverable').closest('article');
    expect(card?.className).toContain('hover:border-gold');
  });

  it('does not apply hoverable class when hoverable is false', () => {
    render(<Card hoverable={false}>Not Hoverable</Card>);
    const card = screen.getByText('Not Hoverable').closest('article');
    expect(card?.className).not.toContain('hover:border-gold');
  });

  it('applies custom className', () => {
    render(<Card className="custom">Custom</Card>);
    const card = screen.getByText('Custom').closest('article');
    expect(card?.className).toContain('custom');
  });

  it('applies category variant styling', () => {
    render(<Card variant="category">Category Card</Card>);
    const card = screen.getByText('Category Card').closest('article');
    expect(card?.className).toContain('p-6');
  });

  it('renders with icon', () => {
    render(
      <Card icon={<span data-testid="card-icon">icon</span>} title="With Icon">
        Content
      </Card>
    );
    expect(screen.getByTestId('card-icon')).toBeInTheDocument();
  });
});
