import { describe, it, expect } from 'vitest';
import { calculateBottleneck, detectBottleneckWarnings } from './bottleneck';

describe('calculateBottleneck', () => {
  it('returns 0 when cpuScore is 0', () => {
    expect(calculateBottleneck(0, 100)).toBe(0);
  });

  it('returns 0 when gpuScore is 0', () => {
    expect(calculateBottleneck(100, 0)).toBe(0);
  });

  it('returns 0 when scores are equal (balanced)', () => {
    expect(calculateBottleneck(100, 100)).toBe(0);
  });

  it('returns positive value for CPU-bound (cpu much faster)', () => {
    const result = calculateBottleneck(200, 100);
    expect(result).toBeGreaterThan(0);
  });

  it('returns negative value for GPU-bound (gpu much faster)', () => {
    const result = calculateBottleneck(100, 200);
    expect(result).toBeLessThan(0);
  });

  it('clamps CPU-bound to 100', () => {
    const result = calculateBottleneck(10000, 1);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe('detectBottleneckWarnings', () => {
  it('returns empty for zero scores', () => {
    expect(detectBottleneckWarnings(0, 0, 'CPU', 'GPU')).toEqual([]);
  });

  it('returns warnings for severe CPU bottleneck', () => {
    const warnings = detectBottleneckWarnings(500, 10, 'Fast CPU', 'Slow GPU');
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0].message).toContain('CPU-bound');
  });

  it('returns warnings for severe GPU bottleneck', () => {
    const warnings = detectBottleneckWarnings(10, 500, 'Slow CPU', 'Fast GPU');
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0].message).toContain('GPU-bound');
  });

  it('returns empty for balanced system', () => {
    const warnings = detectBottleneckWarnings(100, 100, 'CPU', 'GPU');
    expect(warnings).toEqual([]);
  });
});
