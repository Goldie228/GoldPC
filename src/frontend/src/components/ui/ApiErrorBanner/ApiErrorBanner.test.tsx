import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ApiErrorBanner } from './ApiErrorBanner';

describe('ApiErrorBanner', () => {
  it('renders the error message', () => {
    render(<ApiErrorBanner message="Failed to load data" />);
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
  });

  it('renders as alert role', () => {
    render(<ApiErrorBanner message="Error" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders retry button when onRetry provided', () => {
    const onRetry = vi.fn();
    render(<ApiErrorBanner message="Error" onRetry={onRetry} />);
    expect(screen.getByText('Попробовать снова')).toBeInTheDocument();
  });

  it('calls onRetry when retry button clicked', () => {
    const onRetry = vi.fn();
    render(<ApiErrorBanner message="Error" onRetry={onRetry} />);
    fireEvent.click(screen.getByText('Попробовать снова'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render retry button when onRetry not provided', () => {
    render(<ApiErrorBanner message="Error" />);
    expect(screen.queryByText('Попробовать снова')).not.toBeInTheDocument();
  });

  it('uses custom retry label', () => {
    const onRetry = vi.fn();
    render(<ApiErrorBanner message="Error" onRetry={onRetry} retryLabel="Retry" />);
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('renders children alongside message', () => {
    render(
      <ApiErrorBanner message="Error">
        <span data-testid="extra">Extra content</span>
      </ApiErrorBanner>
    );
    expect(screen.getByTestId('extra')).toBeInTheDocument();
  });
});
