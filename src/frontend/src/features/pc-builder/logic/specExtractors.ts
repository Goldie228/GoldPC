/**
 * Specification Extractors
 * Re-exports from shared compatibility extractors + feature-specific helpers
 */

import type { ProductSpecifications } from '../../api/types';
import type { MemoryType } from '@/shared/utils/compatibility/types';
import {
  extractSocket,
  extractTDP,
  extractSupportedSockets,
  extractMemoryType,
} from '@/shared/utils/compatibility/extractors';

// Re-export shared extractors with feature-compatible names
export { extractSocket, extractTDP, extractSupportedSockets };
export { extractMemoryType as extractRAMType };
export type { MemoryType as RAMType };

// Unique feature-specific helpers
export function extractMbRamSlots(specs: ProductSpecifications | undefined): number {
  if (!specs) return 4;
  return (specs.ramSlots as number) || 4;
}

export function extractModulesCount(specs: ProductSpecifications | undefined): number {
  if (!specs) return 1;
  const raw = specs.modules as string | undefined;
  if (!raw) return 1;
  const match = raw.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}