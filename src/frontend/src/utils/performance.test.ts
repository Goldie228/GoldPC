import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock web-vitals before importing performance.ts
vi.mock('web-vitals', () => ({
  onLCP: vi.fn(),
  onINP: vi.fn(),
  onCLS: vi.fn(),
  onFCP: vi.fn(),
  onTTFB: vi.fn(),
}));

describe('performance.ts', () => {
  let performanceMonitor: typeof import('./performance').performanceMonitor;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('./performance');
    performanceMonitor = mod.performanceMonitor;
    performanceMonitor.reset();
  });

  describe('performanceMonitor', () => {
    it('is an object', () => {
      expect(performanceMonitor).toBeDefined();
      expect(typeof performanceMonitor).toBe('object');
    });

    it('has a getMetrics method', () => {
      expect(typeof performanceMonitor.getMetrics).toBe('function');
    });

    it('has a checkBudgets method', () => {
      expect(typeof performanceMonitor.checkBudgets).toBe('function');
    });

    it('has a getBudgets method', () => {
      expect(typeof performanceMonitor.getBudgets).toBe('function');
    });

    it('has a setAnalyticsEndpoint method', () => {
      expect(typeof performanceMonitor.setAnalyticsEndpoint).toBe('function');
    });

    it('has a reset method', () => {
      expect(typeof performanceMonitor.reset).toBe('function');
    });

    it('getMetrics returns an object with metric keys', () => {
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics).toBe('object');
    });

    it('getMetrics returns a copy (not the internal reference)', () => {
      const m1 = performanceMonitor.getMetrics();
      const m2 = performanceMonitor.getMetrics();
      expect(m1).not.toBe(m2);
      expect(m1).toEqual(m2);
    });

    it('reset clears metrics', () => {
      performanceMonitor.reset();
      const metrics = performanceMonitor.getMetrics();
      expect(Object.keys(metrics)).toHaveLength(0);
    });

    it('checkBudgets returns an object with passed and violations', () => {
      const result = performanceMonitor.checkBudgets();
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('violations');
      expect(typeof result.passed).toBe('boolean');
      expect(Array.isArray(result.violations)).toBe(true);
    });

    it('checkBudgets passes when no metrics collected', () => {
      performanceMonitor.reset();
      const result = performanceMonitor.checkBudgets();
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('getBudgets returns performance budgets', () => {
      const budgets = performanceMonitor.getBudgets();
      expect(budgets).toHaveProperty('LCP');
      expect(budgets).toHaveProperty('INP');
      expect(budgets).toHaveProperty('CLS');
      expect(budgets).toHaveProperty('FCP');
      expect(budgets).toHaveProperty('TTFB');
      expect(budgets.LCP).toBe(2500);
      expect(budgets.CLS).toBe(0.1);
    });

    it('setAnalyticsEndpoint is callable without error', () => {
      expect(() => performanceMonitor.setAnalyticsEndpoint('/test')).not.toThrow();
    });
  });
});
