import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PhoneInput } from './PhoneInput';

function getInput(): HTMLInputElement {
  return screen.getByPlaceholderText('+375 (29) 123-45-67') as HTMLInputElement;
}

describe('PhoneInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders with placeholder', () => {
    render(<PhoneInput value="" onChange={() => {}} />);
    const input = getInput();
    expect(input).toBeInTheDocument();
    expect(input.placeholder).toBe('+375 (29) 123-45-67');
  });

  it('formats phone number on change', async () => {
    const onChange = vi.fn();
    render(<PhoneInput value="" onChange={onChange} />);
    const input = getInput();
    
    fireEvent.change(input, { target: { value: '+375291234567' } });
    
    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
    });
  });

  it('handles backspace correctly', async () => {
    const onChange = vi.fn();
    render(<PhoneInput value="+375 (29) 123-45-67" onChange={onChange} />);
    const input = getInput();
    
    fireEvent.change(input, { target: { value: '+375 (29) 123-45-6' } });
    
    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
    });
  });

  it('handles complete number input', async () => {
    const onChange = vi.fn();
    render(<PhoneInput value="" onChange={onChange} />);
    const input = getInput();
    
    fireEvent.change(input, { target: { value: '+375291234567' } });
    
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('+375291234567');
    });
  });

  it('clears value when empty string provided', () => {
    render(<PhoneInput value="" onChange={() => {}} />);
    const input = getInput();
    expect(input.value).toBe('');
  });
});
