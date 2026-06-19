import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './Input';

describe('Input (Input/Input.tsx)', () => {
  it('renders without crashing', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<Input placeholder="Enter email" />);
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<Input error="Invalid email" />);
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('displays helper text when no error', () => {
    render(<Input helperText="Enter a valid email" />);
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
  });

  it('hides helper text when error is present', () => {
    render(<Input helperText="Help text" error="Error text" />);
    expect(screen.queryByText('Help text')).not.toBeInTheDocument();
    expect(screen.getByText('Error text')).toBeInTheDocument();
  });

  it('calls onChange when typed into', () => {
    const onChange = vi.fn();
    render(<Input onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('renders as disabled', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('applies error aria attributes', () => {
    render(<Input error="Required field" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', expect.stringContaining('-error'));
  });

  it('renders with custom id', () => {
    render(<Input id="my-input" label="Name" />);
    expect(screen.getByLabelText('Name')).toHaveAttribute('id', 'my-input');
  });

  it('renders leftIcon', () => {
    render(<Input leftIcon={<span data-testid="left-icon">@</span>} />);
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('renders rightIcon', () => {
    render(<Input rightIcon={<span data-testid="right-icon">x</span>} />);
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('applies fullWidth by default', () => {
    const { container } = render(<Input />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain('w-full');
  });

  it('applies size classes', () => {
    const { rerender } = render(<Input size="sm" />);
    let input = screen.getByRole('textbox');
    expect(input.className).toContain('px-4');

    rerender(<Input size="lg" />);
    input = screen.getByRole('textbox');
    expect(input.className).toContain('py-4');
  });
});
