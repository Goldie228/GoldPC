import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToggleSwitch } from './ToggleSwitch';

describe('ToggleSwitch', () => {
  it('renders with label', () => {
    render(<ToggleSwitch name="test" checked={false} onChange={vi.fn()} label="Enable notifications" />);
    expect(screen.getByText('Enable notifications')).toBeInTheDocument();
  });

  it('renders with description', () => {
    render(
      <ToggleSwitch
        name="test"
        checked={false}
        onChange={vi.fn()}
        label="Notifications"
        description="Get email alerts"
      />
    );
    expect(screen.getByText('Get email alerts')).toBeInTheDocument();
  });

  it('renders checkbox as checked when checked is true', () => {
    render(<ToggleSwitch name="test" checked={true} onChange={vi.fn()} label="Toggle" />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('renders checkbox as unchecked when checked is false', () => {
    render(<ToggleSwitch name="test" checked={false} onChange={vi.fn()} label="Toggle" />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('calls onChange when toggled', () => {
    const onChange = vi.fn();
    render(<ToggleSwitch name="test" checked={false} onChange={onChange} label="Toggle" />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('has correct name attribute', () => {
    render(<ToggleSwitch name="mySetting" checked={false} onChange={vi.fn()} label="Setting" />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('name', 'mySetting');
  });

  it('has accessible label', () => {
    render(<ToggleSwitch name="test" checked={false} onChange={vi.fn()} label="Dark mode" />);
    expect(screen.getByLabelText('Dark mode')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<ToggleSwitch name="test" checked={false} onChange={vi.fn()} label="Toggle" />);
    const descriptionEl = screen.getByText('Toggle').parentElement?.querySelector('.text-xs');
    expect(descriptionEl).toBeFalsy();
  });
});
