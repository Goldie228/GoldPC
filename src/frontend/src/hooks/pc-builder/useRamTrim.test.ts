import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRamTrim } from './useRamTrim';

describe('hooks/pc-builder/useRamTrim', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not call onTrim when modules are under max', () => {
    const onTrim = vi.fn();
    const modules = [
      { speed: 3200, capacity: 8 },
      { speed: 3600, capacity: 16 },
    ];

    renderHook(() => useRamTrim({
      ramModules: modules,
      maxModules: 4,
      onTrim,
    }));

    // Only calls onTrim when length > maxModules (2 < 4, so not called)
    expect(onTrim).not.toHaveBeenCalled();
  });

  it('does not call onTrim when no modules', () => {
    const onTrim = vi.fn();
    renderHook(() => useRamTrim({
      ramModules: [],
      maxModules: 4,
      onTrim,
    }));

    // 0 > 4 is false, so not called
    expect(onTrim).not.toHaveBeenCalled();
  });

  it('calls onTrim with trimmed modules when over max', () => {
    const onTrim = vi.fn();
    const modules = [
      { speed: 3200, capacity: 8 },
      { speed: 3600, capacity: 16 },
      { speed: 2400, capacity: 4 },
      { speed: 3200, capacity: 8 },
      { speed: 3600, capacity: 16 },
    ];

    renderHook(() => useRamTrim({
      ramModules: modules,
      maxModules: 4,
      onTrim,
    }));

    expect(onTrim).toHaveBeenCalled();
    const trimmed = onTrim.mock.calls[0][0];
    expect(trimmed).toHaveLength(4);
  });

  it('trims to maxModules count', () => {
    const onTrim = vi.fn();
    renderHook(() => useRamTrim({
      ramModules: [
        { speed: 3200, capacity: 8 },
        { speed: 3600, capacity: 16 },
        { speed: 2400, capacity: 4 },
      ],
      maxModules: 2,
      onTrim,
    }));

    expect(onTrim).toHaveBeenCalled();
    const trimmed = onTrim.mock.calls[0][0];
    expect(trimmed).toHaveLength(2);
  });
});
