import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RangeSlider } from './RangeSlider';

describe('RangeSlider', () => {
  const defaultProps = {
    min: 0,
    max: 1000,
    value: { min: 100, max: 500 },
    onChange: vi.fn(),
  };

  it('renders without crashing', () => {
    const { container } = render(<RangeSlider {...defaultProps} />);
    expect(container.firstElementChild).toBeInTheDocument();
  });

  it('displays formatted min and max values', () => {
    render(<RangeSlider {...defaultProps} />);
    const minText = screen.getAllByText('100');
    const maxText = screen.getAllByText('500');
    expect(minText.length).toBeGreaterThanOrEqual(1);
    expect(maxText.length).toBeGreaterThanOrEqual(1);
  });

  it('displays label when provided', () => {
    render(<RangeSlider {...defaultProps} label="Price range" />);
    expect(screen.getByText('Price range')).toBeInTheDocument();
  });

  it('uses custom formatValue', () => {
    render(
      <RangeSlider
        {...defaultProps}
        formatValue={(v) => `$${v}`}
      />
    );
    const minValues = screen.getAllByText('$100');
    const maxValues = screen.getAllByText('$500');
    expect(minValues.length).toBeGreaterThanOrEqual(1);
    expect(maxValues.length).toBeGreaterThanOrEqual(1);
  });

  it('does not render label when not provided', () => {
    const { container } = render(<RangeSlider {...defaultProps} />);
    const labels = container.querySelectorAll('label');
    expect(labels.length).toBe(0);
  });
});
