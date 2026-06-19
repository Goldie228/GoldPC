import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { TypingIndicator } from './TypingIndicator';

describe('TypingIndicator', () => {
  it('renders nothing when who is undefined', () => {
    const { container } = render(<TypingIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when who is empty string', () => {
    const { container } = render(<TypingIndicator who="" />);
    expect(container.firstChild).toBeNull();
  });

  it('displays who is typing', () => {
    render(<TypingIndicator who="Техник" />);
    expect(screen.getByText('Техник печатает')).toBeInTheDocument();
  });

  it('renders three animated dots', () => {
    const { container } = render(<TypingIndicator who="User" />);
    const dots = container.querySelectorAll('.typing-indicator__dot');
    expect(dots.length).toBe(3);
  });
});
