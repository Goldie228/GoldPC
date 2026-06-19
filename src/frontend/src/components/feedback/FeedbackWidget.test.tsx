import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { FeedbackWidget } from './FeedbackWidget';

vi.mock('@/api', () => ({
  default: { post: vi.fn().mockResolvedValue({}) },
}));

afterEach(() => cleanup());

describe('FeedbackWidget', () => {
  it('renders trigger button', () => {
    render(<FeedbackWidget />);
    expect(screen.getByRole('button', { name: /оставить обратную связь/i })).toBeInTheDocument();
  });

  it('opens modal when trigger button is clicked', async () => {
    render(<FeedbackWidget />);
    fireEvent.click(screen.getByRole('button', { name: /оставить обратную связь/i }));
    expect(screen.getByText(/обратная связь/i)).toBeInTheDocument();
  });
});
