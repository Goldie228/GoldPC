/**
 * Slot Limit Calculations
 * Pure functions for computing RAM slot limits
 * Extracted from usePCBuilder.ts for better organization
 */

import type { Product } from '../../api/types';
import type { PCBuilderSelectedState } from './types';
import { MAX_RAM_MODULES } from './constants';
import { extractMbRamSlots, extractModulesCount } from './specExtractors';

export function getMaxRamModules(motherboard: Product | undefined): number {
  if (motherboard) {
    return extractMbRamSlots(motherboard.product.specifications);
  }
  return MAX_RAM_MODULES;
}

export function getMaxRamQty(
  selectedComponents: PCBuilderSelectedState,
  maxRamModules: number
): number {
  if (selectedComponents.ram.length > 0) {
    const modulesPerUnit = extractModulesCount(selectedComponents.ram[0]?.product.specifications);
    return Math.min(MAX_RAM_MODULES, Math.floor(maxRamModules / Math.max(1, modulesPerUnit)));
  }
  return MAX_RAM_MODULES;
}