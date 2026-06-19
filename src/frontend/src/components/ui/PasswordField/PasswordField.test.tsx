import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PasswordField } from './PasswordField';

describe('PasswordField', () => {
  it('renders with label', () => {
    render(<PasswordField label="Password" value="" onChange={vi.fn()} />);
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('renders as password type by default', () => {
    render(<PasswordField label="Password" value="secret" onChange={vi.fn()} />);
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('toggles to text type when eye button clicked', () => {
    render(<PasswordField label="Password" value="secret" onChange={vi.fn()} />);
    const toggleButton = screen.getByRole('button', { name: /показать введённый пароль/i });
    fireEvent.click(toggleButton);
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
  });

  it('toggles back to password type', () => {
    render(<PasswordField label="Password" value="secret" onChange={vi.fn()} />);
    const toggleButton = screen.getByRole('button', { name: /показать введённый пароль/i });
    fireEvent.click(toggleButton);
    fireEvent.click(screen.getByRole('button', { name: /скрыть введённый пароль/i }));
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('calls onChange with value', () => {
    const onChange = vi.fn();
    render(<PasswordField label="Password" value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'myPass1!' } });
    expect(onChange).toHaveBeenCalledWith('myPass1!');
  });

  it('applies placeholder', () => {
    render(<PasswordField label="Password" value="" onChange={vi.fn()} placeholder="Enter password" />);
    expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();
  });

  it('applies default placeholder', () => {
    render(<PasswordField label="Password" value="" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Введите пароль')).toBeInTheDocument();
  });

  it('renders as required when required prop is true', () => {
    render(<PasswordField label="Password" value="" onChange={vi.fn()} required />);
    expect(screen.getByLabelText('Password')).toBeRequired();
  });

  it('applies custom id', () => {
    render(<PasswordField id="custom-id" label="Password" value="" onChange={vi.fn()} />);
    expect(screen.getByLabelText('Password')).toHaveAttribute('id', 'custom-id');
  });

  it('has correct autoComplete attribute', () => {
    render(<PasswordField label="Password" value="" onChange={vi.fn()} autoComplete="new-password" />);
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'new-password');
  });
});
