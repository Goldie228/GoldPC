import { describe, it, expect } from 'vitest';
import {
  runRAMCompatibilityCheck,
  runMixedRAMCheck,
  runPSUCompatibilityCheck,
  runCaseCompatibilityCheck,
  runGPUCompatibilityCheck,
  runCoolerCompatibilityCheck,
} from './orchestration';
import type { CompatibilityIssue, CompatibilityWarning } from './types';
import type { Product } from '@/api/types';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: '1', name: 'Test', slug: 'test', sku: 'SKU-1',
    category: 'cpu', price: 100, stock: 5, isActive: true,
    specifications: {},
    ...overrides,
  } as Product;
}

describe('runRAMCompatibilityCheck', () => {
  it('does nothing when ram is undefined', () => {
    const issues: CompatibilityIssue[] = [];
    const warnings: CompatibilityWarning[] = [];
    runRAMCompatibilityCheck(undefined, makeProduct(), issues, warnings);
    expect(issues).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });

  it('does nothing when motherboard is undefined', () => {
    const issues: CompatibilityIssue[] = [];
    const warnings: CompatibilityWarning[] = [];
    runRAMCompatibilityCheck(makeProduct(), undefined, issues, warnings);
    expect(issues).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });
});

describe('runPSUCompatibilityCheck', () => {
  it('does nothing when psu is undefined', () => {
    const issues: CompatibilityIssue[] = [];
    const warnings: CompatibilityWarning[] = [];
    runPSUCompatibilityCheck(undefined, 100, issues, warnings);
    expect(issues).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });
});

describe('runCaseCompatibilityCheck', () => {
  it('does nothing when case is undefined', () => {
    const issues: CompatibilityIssue[] = [];
    const warnings: CompatibilityWarning[] = [];
    runCaseCompatibilityCheck(undefined, undefined, undefined, issues, warnings);
    expect(issues).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });
});

describe('runGPUCompatibilityCheck', () => {
  it('does nothing when gpu is undefined', () => {
    const issues: CompatibilityIssue[] = [];
    const warnings: CompatibilityWarning[] = [];
    runGPUCompatibilityCheck(undefined, undefined, issues, warnings);
    expect(issues).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });
});

describe('runCoolerCompatibilityCheck', () => {
  it('does nothing when cooler is undefined', () => {
    const issues: CompatibilityIssue[] = [];
    const warnings: CompatibilityWarning[] = [];
    runCoolerCompatibilityCheck(undefined, undefined, issues, warnings);
    expect(issues).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });
});
