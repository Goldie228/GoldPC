/**
 * Recommendation Engine for Build Wizard
 *
 * Uses pre-built mock assemblies for instant, reliable results.
 * Each mock is hand-crafted with real products from the database.
 */

import type { Product } from '@/api/types';
import type { Purpose, Budget, WizardState } from './types';
import { MOCK_BUILDS, type MockBuild } from './mockBuilds';

export interface RecommendedBuild {
  cpu: Product | null;
  gpu: Product | null;
  motherboard: Product | null;
  ram: Product | null;
  storage: Product | null;
  psu: Product | null;
  case: Product | null;
  cooling: Product | null;
  fan: Product | null;
  totalPrice: number;
  purpose: Purpose;
  budget: Budget;
}

const CATEGORY_MAP: Record<string, keyof RecommendedBuild> = {
  cpu: 'cpu',
  gpu: 'gpu',
  motherboard: 'motherboard',
  ram: 'ram',
  storage: 'storage',
  psu: 'psu',
  case: 'case',
  cooling: 'cooling',
  fan: 'fan',
};

function mockToRecommended(mock: MockBuild, purpose: Purpose, budget: Budget): RecommendedBuild {
  const result: RecommendedBuild = {
    cpu: null, gpu: null, motherboard: null, ram: null,
    storage: null, psu: null, case: null, cooling: null, fan: null,
    totalPrice: mock.totalPrice, purpose, budget,
  };

  for (const product of mock.components) {
    const key = CATEGORY_MAP[product.category ?? ''];
    if (key) {
      result[key] = product;
    }
  }

  return result;
}

function selectMockBuild(state: WizardState): MockBuild {
  const purpose = state.purpose!;
  const budget = state.budget!;

  // Budget tier mapping
  const tier: 'economy' | 'optimal' | 'max' =
    budget === 'economy' || budget === 'custom' && state.customBudget < 2000 ? 'economy'
    : budget === 'gaming' || budget === 'custom' && state.customBudget >= 4000 ? 'max'
    : budget === 'max' ? 'max'
    : 'optimal';

  // Find best matching mock by purpose + tier
  const candidates = MOCK_BUILDS.filter(b => b.purpose === purpose);
  if (candidates.length > 0) {
    // Prefer tier match, then closest by price
    const tierMatch = candidates.find(b => {
      if (tier === 'economy' && b.totalPrice < 800) return true;
      if (tier === 'optimal' && b.totalPrice >= 800 && b.totalPrice < 2500) return true;
      if (tier === 'max' && b.totalPrice >= 2500) return true;
      return false;
    });
    if (tierMatch) return tierMatch;
    // Fallback: pick closest by price
    const target = tier === 'economy' ? 500 : tier === 'optimal' ? 1500 : 3500;
    candidates.sort((a, b) => Math.abs(a.totalPrice - target) - Math.abs(b.totalPrice - target));
    return candidates[0];
  }

  // Fallback: pick first build
  return MOCK_BUILDS[0];
}

export async function buildRecommendation(
  state: WizardState,
  signal?: AbortSignal,
  onProgress?: (current: number, total: number, category: string) => void,
): Promise<RecommendedBuild> {
  if (!state.purpose || !state.budget) {
    throw new Error('Необходимо выбрать назначение и бюджет');
  }

  // Simulate brief loading for UX
  const steps = ['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooling'];
  for (let i = 0; i < steps.length; i++) {
    onProgress?.(i + 1, steps.length, steps[i]);
    await new Promise(r => setTimeout(r, 30));
  }

  const mock = selectMockBuild(state);
  return mockToRecommended(mock, state.purpose, state.budget);
}
