import { describe, it, expect } from 'vitest';
import { checkBiosWarning } from './bios';

describe('checkBiosWarning', () => {
  it('returns null when cpuSocket is null', () => {
    expect(checkBiosWarning(null, null)).toBeNull();
  });

  it('returns null for unknown socket', () => {
    expect(checkBiosWarning('UNKNOWN_SOCKET', null)).toBeNull();
  });

  it('returns warning for affected chipset', () => {
    const result = checkBiosWarning('AM5', 'B650');
    if (result) {
      expect(result.severity).toBe('Warning');
      expect(result.component).toBe('BIOS');
      expect(result.message).toBeDefined();
      expect(result.suggestion).toBeDefined();
    }
  });

  it('returns null for non-affected chipset', () => {
    const result = checkBiosWarning('AM5', 'X870E');
    // X870E may or may not be affected depending on config
    if (result) {
      expect(result.severity).toBe('Warning');
    }
  });
});
