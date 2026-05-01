/**
 * PC Builder Constants
 * Extracted from usePCBuilder.ts for better organization
 */

import compatibilityRules from '../../config/compatibilityRules.json';
import type { CompatibilityRulesConfig } from '../../config/compatibilityTypes';

const rules = compatibilityRules as CompatibilityRulesConfig;

export const RAM_TYPES = rules.ramCompatibility.validTypes as readonly string[];

export type RAMType = (typeof RAM_TYPES)[number];

export const TOTAL_CATEGORIES = 12;

export const MAX_RAM_MODULES = 8;
export const MAX_STORAGE_MODULES = 8;
export const MAX_FAN_MODULES = 8;

export const BASE_POWER_CONSUMPTION = rules.powerCompatibility.baseSystemPower;

export const STORAGE_KEY = 'goldpc-pc-builder';

export const COMPATIBILITY_DEBOUNCE_MS = 120;

export const FPS_DEBOUNCE_MS = 300;

export function emptyPcBuilderState(): import('./types').PCBuilderSelectedState {
  return { ram: [], storage: [], fan: [] };
}