import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePhoneFormat } from './usePhoneFormat';

describe('hooks/usePhoneFormat', () => {
  it('returns displayValue and inputRef from initial state', () => {
    const { result } = renderHook(() => usePhoneFormat({}));
    expect(result.current.displayValue).toBeDefined();
    expect(result.current.inputRef).toBeDefined();
  });

  it('displayValue formats phone number', () => {
    const { result } = renderHook(() => usePhoneFormat({ value: '+375291234567' }));
    expect(result.current.displayValue).toBe('+375 (29) 123-45-67');
  });

  it('handleChange calls onChange callback', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => usePhoneFormat({ onChange }));

    act(() => {
      result.current.handleChange({
        target: { value: '291234567' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(onChange).toHaveBeenCalledWith('375291234567');
  });

  it('handleFocus works without errors', () => {
    const { result } = renderHook(() => usePhoneFormat({}));
    act(() => {
      result.current.handleFocus();
    });
    expect(result.current.displayValue).toBeDefined();
  });

  it('handleBlur works without errors', () => {
    const { result } = renderHook(() => usePhoneFormat({}));
    act(() => {
      result.current.handleBlur();
    });
  });

  it('handleKeyDown works without errors', () => {
    const { result } = renderHook(() => usePhoneFormat({ value: '+375291234567' }));
    act(() => {
      result.current.handleKeyDown({
        key: 'Backspace',
        target: { selectionStart: 5 } as HTMLInputElement,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLInputElement>);
    });
  });

  it('handlePaste works with pasted phone number', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => usePhoneFormat({ onChange }));

    act(() => {
      result.current.handlePaste({
        clipboardData: {
          getData: () => '+375291234567',
        },
        preventDefault: vi.fn(),
      } as unknown as React.ClipboardEvent<HTMLInputElement>);
    });

    expect(onChange).toHaveBeenCalled();
  });

  it('returns +375 prefix for empty value', () => {
    const { result } = renderHook(() => usePhoneFormat({ value: '' }));
    expect(result.current.displayValue).toBe('+375');
  });
});
