import { describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BuildSummaryPanel } from './BuildSummaryPanel';

vi.mock('@/features/pc-builder/logic/performance', () => ({
  calculatePerformance: vi.fn(() => 50),
  getPerformanceLabel: vi.fn(() => 'Средняя'),
  getPerformanceColor: vi.fn(() => '#ffffff'),
}));

afterEach(() => cleanup());

describe('BuildSummaryPanel', () => {
  const emptySelected = {
    cpu: undefined, motherboard: undefined, ram: [], gpu: undefined,
    psu: undefined, storage: [], cooling: undefined, case: undefined,
    fan: [], monitor: undefined, keyboard: undefined, mouse: undefined,
    headphones: undefined,
  };
  const defaultProps = {
    selectedComponents: emptySelected,
    totalPrice: 0,
    powerConsumption: 0,
    isCompatible: true,
    selectedCount: 0,
    totalCount: 12,
    onAddToCart: vi.fn(),
    onSave: vi.fn(),
    onCheckout: vi.fn(),
  };

  it('renders without crashing', () => {
    render(<BuildSummaryPanel {...defaultProps} />);
    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });

  it('displays selected count in aria-label', () => {
    render(<BuildSummaryPanel {...defaultProps} selectedCount={3} totalCount={12} />);
    expect(screen.getByRole('complementary')).toHaveAttribute(
      'aria-label',
      expect.stringContaining('3 из 12')
    );
  });
});
