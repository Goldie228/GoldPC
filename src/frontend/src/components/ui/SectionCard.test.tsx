import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionCard } from './SectionCard';

describe('SectionCard', () => {
  it('renders title', () => {
    render(
      <SectionCard icon={<span>icon</span>} title="Section Title">
        Content
      </SectionCard>
    );
    expect(screen.getByText('Section Title')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <SectionCard icon={<span>icon</span>} title="Title">
        <p>Child content</p>
      </SectionCard>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('renders icon', () => {
    render(
      <SectionCard icon={<span data-testid="icon">star</span>} title="Title">
        Content
      </SectionCard>
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders as div', () => {
    const { container } = render(
      <SectionCard icon={<span>icon</span>} title="Title">
        Content
      </SectionCard>
    );
    expect(container.firstElementChild?.tagName).toBe('DIV');
  });

  it('applies warning styling to title when warning is true', () => {
    render(
      <SectionCard icon={<span>icon</span>} title="Danger" warning>
        Content
      </SectionCard>
    );
    const title = screen.getByText('Danger');
    expect(title.className).toContain('text-price-rise');
  });

  it('does not apply warning styling without warning prop', () => {
    render(
      <SectionCard icon={<span>icon</span>} title="Normal">
        Content
      </SectionCard>
    );
    const title = screen.getByText('Normal');
    expect(title.className).not.toContain('text-price-rise');
  });
});
