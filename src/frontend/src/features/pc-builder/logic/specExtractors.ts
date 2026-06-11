/**
 * Specification Extractors
 * Re-exports from shared compatibility extractors + feature-specific helpers
 */

import type { ProductSpecifications } from '@/api/types';
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
  if (specs == null) return 4;
  // API возвращает memory_slots, но типы допускают ramSlots как альтернативу
  const slots = (specs['memory_slots'] as number) || (specs.ramSlots as number);
  return slots || 4;
}

export function extractModulesCount(specs: ProductSpecifications | undefined, name?: string): number {
  if (specs == null) return 1;
  // Прямое поле из API
  const raw = specs.modules as string | undefined;
  if (raw) {
    const match = raw.match(/(\d+)/);
    if (match) return parseInt(match[1], 10);
  }
  // Fallback: парсим из названия товара (например "2x16GB" → 2)
  if (name) {
    const match = name.match(/(\d+)\s*[xх×]\s*\d+/i);
    if (match) return parseInt(match[1], 10);
  }
  return 1;
}