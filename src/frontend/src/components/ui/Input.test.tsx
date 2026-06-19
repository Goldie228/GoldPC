import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './Input';

describe('Input (Input.tsx)', () => {
  it('renders without crashing', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with label', () => {
    const { container } = render(<Input label="Name" />);
    expect(container.querySelector('label')).toHaveTextContent('Name');
  });

  it('displays error message', () => {
    render(<Input error="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('does not display error when no error prop', () => {
    const { container } = render(<Input />);
    expect(container.querySelector('span.text-error')).not.toBeInTheDocument();
  });

  it('calls onChange when typed into', () => {
    const onChange = vi.fn();
    render(<Input onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'abc' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('applies error styling when error is present', () => {
    render(<Input error="Bad input" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('border-error');
  });

  it('does not apply error styling without error', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input.className).not.toContain('border-error');
  });

  it('forwards ref', () => {
    const ref = { current: null };
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('passes through standard HTML input attributes', () => {
    render(<Input type="email" maxLength={50} data-testid="test-input" />);
    const input = screen.getByTestId('test-input');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('maxlength', '50');
  });

  it('renders as disabled', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});
