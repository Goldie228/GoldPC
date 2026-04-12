import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach, jest } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PhoneInput } from './PhoneInput';

describe('PhoneInput', () => {
  const baseProps = {
    value: '',
    onChange: vi.fn(),
  };

  const renderPhoneInput = (props = {}) => {
    return render(<PhoneInput {...baseProps} {...props} />);
  };

  it('should render with placeholder', () => {
    renderPhoneInput();
    const input = screen.getByPlaceholderText('+375 (29) 123-45-67');
    expect(input).toBeInTheDocument();
  });

  it('should format phone number correctly when typing', async () => {
    renderPhoneInput();
    const input = screen.getByPlaceholderText('+375 (29) 123-45-67');

    // Type first digit
    fireEvent.change(input, { target: { value: '2' } });
    await waitFor(() => {
      expect(input.value).toBe('+375 (2');
    });

    // Type second digit
    fireEvent.change(input, { target: { value: '29' } });
    await waitFor(() => {
      expect(input.value).toBe('+375 (29) ');
    });

    // Type more digits
    fireEvent.change(input, { target: { value: '291' } });
    await waitFor(() => {
      expect(input.value).toBe('+375 (29) 1');
    });

    fireEvent.change(input, { target: { value: '2911' } });
    await waitFor(() => {
      expect(input.value).toBe('+375 (29) 11');
    });

    fireEvent.change(input, { target: { value: '29112' } });
    await waitFor(() => {
      expect(input.value).toBe('+375 (29) 112');
    });

    fireEvent.change(input, { target: { value: '291123' } });
    await waitFor(() => {
      expect(input.value).toBe('+375 (29) 112-23');
    });

    fireEvent.change(input, { target: { value: '2911234' } });
    await waitFor(() => {
      expect(input.value).toBe('+375 (29) 112-34');
    });

    fireEvent.change(input, { target: { value: '29112345' } });
    await waitFor(() => {
      expect(input.value).toBe('+375 (29) 112-34-5');
    });

    fireEvent.change(input, { target: { value: '291123456' } });
    await waitFor(() => {
      expect(input.value).toBe('+375 (29) 112-34-56');
    });
  });

  it('should call onChange with normalized digits', async () => {
    const onChangeMock = vi.fn();
    renderPhoneInput({ onChange: onChangeMock });
    const input = screen.getByPlaceholderText('+375 (29) 123-45-67');

    fireEvent.change(input, { target: { value: '29' } });
    await waitFor(() => {
      expect(onChangeMock).toHaveBeenCalledWith('29');
    });

    fireEvent.change(input, { target: { value: '291' } });
    await waitFor(() => {
      expect(onChangeMock).toHaveBeenCalledWith('291');
    });
  });

  it('should handle deletion correctly', async () => {
    renderPhoneInput({ value: '291123456', onChange: vi.fn() });
    const input = screen.getByPlaceholderText('+375 (29) 123-45-67');

    // Delete one character
    fireEvent.change(input, { target: { value: '29112345' } });
    await waitFor(() => {
      expect(input.value).toBe('+375 (29) 112-34-5');
    });

    // Delete multiple characters
    fireEvent.change(input, { target: { value: '291123' } });
    await waitFor(() => {
      expect(input.value).toBe('+375 (29) 112-23');
    });

    // Delete from middle
    fireEvent.change(input, { target: { value: '29112' } });
    await waitFor(() => {
      expect(input.value).toBe('+375 (29) 112');
    });
  });

  it('should handle pasting full phone number', async () => {
    renderPhoneInput({ onChange: vi.fn() });
    const input = screen.getByPlaceholderText('+375 (29) 123-45-67');

    fireEvent.change(input, { target: { value: '291123456' } });
    await waitFor(() => {
      expect(input.value).toBe('+375 (29) 112-34-56');
    });
  });

  it('should handle editing existing number', async () => {
    renderPhoneInput({ value: '291123456', onChange: vi.fn() });
    const input = screen.getByPlaceholderText('+375 (29) 123-45-67');

    // Change a digit in the middle
    fireEvent.change(input, { target: { value: '292123456' } });
    await waitFor(() => {
      expect(input.value).toBe('+375 (29) 212-34-56');
    });
  });

  it('should not allow cursor before +375', async () => {
    renderPhoneInput({ value: '291123456', onChange: vi.fn() });
    const input = screen.getByPlaceholderText('+375 (29) 123-45-67');

    // Focus the input
    fireEvent.focus(input);

    // Wait for the cursor to be set
    await waitFor(() => {
      expect(input.selectionStart).toBe(5);
    });
  });

  it('should handle empty value', () => {
    renderPhoneInput({ value: '', onChange: vi.fn() });
    const input = screen.getByPlaceholderText('+375 (29) 123-45-67');
    expect(input.value).toBe('');
  });

  it('should handle value with less than 2 digits', async () => {
    renderPhoneInput({ value: '1', onChange: vi.fn() });
    const input = screen.getByPlaceholderText('+375 (29) 123-45-67');
    await waitFor(() => {
      expect(input.value).toBe('+375 (1');
    });
  });

  it('should handle value with exactly 2 digits', async () => {
    renderPhoneInput({ value: '12', onChange: vi.fn() });
    const input = screen.getByPlaceholderText('+375 (29) 123-45-67');
    await waitFor(() => {
      expect(input.value).toBe('+375 (12) ');
    });
  });

  it('should handle value with 3 digits', async () => {
    renderPhoneInput({ value: '123', onChange: vi.fn() });
    const input = screen.getByPlaceholderText('+375 (29) 123-45-67');
    await waitFor(() => {
      expect(input.value).toBe('+375 (12) 3');
    });
  });

  it('should handle value with 6 digits', async () => {
    renderPhoneInput({ value: '123456', onChange: vi.fn() });
    const input = screen.getByPlaceholderText('+375 (29) 123-45-67');
    await waitFor(() => {
      expect(input.value).toBe('+375 (12) 345-6');
    });
  });

  it('should handle value with 8 digits', async () => {
    renderPhoneInput({ value: '12345678', onChange: vi.fn() });
    const input = screen.getByPlaceholderText('+375 (29) 123-45-67');
    await waitFor(() => {
      expect(input.value).toBe('+375 (12) 345-67-8');
    });
  });

  it('should handle value with 9 digits', async () => {
    renderPhoneInput({ value: '123456789', onChange: vi.fn() });
    const input = screen.getByPlaceholderText('+375 (29) 123-45-67');
    await waitFor(() => {
      expect(input.value).toBe('+375 (12) 345-67-89');
    });
  });

  it('should handle value with 12 digits', async () => {
    renderPhoneInput({ value: '291123456', onChange: vi.fn() });
    const input = screen.getByPlaceholderText('+375 (29) 123-45-67');
    await waitFor(() => {
      expect(input.value).toBe('+375 (29) 112-34-56');
    });
  });
});