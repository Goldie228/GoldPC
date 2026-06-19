import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadInitialState } from './usePersistence';

const mockLoadFromLocalStorage = vi.fn();

vi.mock('@/features/pc-builder/logic/persistence', () => ({
  loadFromLocalStorage: (...args: any[]) => mockLoadFromLocalStorage(...args),
  saveToLocalStorage: vi.fn(),
}));

describe('hooks/pc-builder/usePersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exports loadInitialState function', () => {
    expect(typeof loadInitialState).toBe('function');
  });

  it('loadInitialState calls persistence.loadFromLocalStorage', () => {
    mockLoadFromLocalStorage.mockReturnValue(null);

    const result = loadInitialState();
    expect(mockLoadFromLocalStorage).toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('loadInitialState returns saved state', () => {
    const savedState = { selected: { cpu: { id: 'cpu-1' } } };
    mockLoadFromLocalStorage.mockReturnValue(savedState);

    const result = loadInitialState();
    expect(result).toEqual(savedState);
  });

  it('loadInitialState returns undefined when no saved state', () => {
    mockLoadFromLocalStorage.mockReturnValue(undefined);

    const result = loadInitialState();
    expect(result).toBeUndefined();
  });
});
