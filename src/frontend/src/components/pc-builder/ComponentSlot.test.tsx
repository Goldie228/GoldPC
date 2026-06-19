import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ComponentSlot } from './ComponentSlot';
import React from 'react';

afterEach(() => cleanup());

describe('ComponentSlot', () => {
  const defaultProps = {
    type: 'Процессор',
    name: '',
    price: null,
    state: 'empty' as const,
    icon: <span data-testid="icon">CPU</span>,
    onSelect: vi.fn(),
  };

  it('renders placeholder text when empty', () => {
    render(<ComponentSlot {...defaultProps} />);
    expect(screen.getByText(/Процессор/)).toBeInTheDocument();
  });

  it('shows component name when selected', () => {
    render(
      <ComponentSlot
        {...defaultProps}
        name="Ryzen 9 7950X"
        price={500}
        state="selected"
      />
    );
    expect(screen.getByText('Ryzen 9 7950X')).toBeInTheDocument();
  });

  it('shows warning when incompatible', () => {
    render(
      <ComponentSlot
        {...defaultProps}
        name="Some GPU"
        price={300}
        state="incompatible"
        warning="Несовместимо"
      />
    );
    expect(screen.getByText('Несовместимо')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn();
    render(<ComponentSlot {...defaultProps} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /выбрать/i }));
    expect(onSelect).toHaveBeenCalled();
  });

  it('shows clear button when onClear is provided and state is selected', () => {
    const onClear = vi.fn();
    render(
      <ComponentSlot
        {...defaultProps}
        name="Test"
        price={100}
        state="selected"
        onClear={onClear}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /снять/i }));
    expect(onClear).toHaveBeenCalled();
  });
});
