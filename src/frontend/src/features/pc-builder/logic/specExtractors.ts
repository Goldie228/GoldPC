/**
 * Specification Extractors
 * Pure functions to extract specifications from product objects
 * Extracted from usePCBuilder.ts for better organization
 */

import type { ProductSpecifications } from '../../api/types';
import type { RAMType } from './constants';

export function extractSocket(specs: ProductSpecifications | undefined): string | null {
  if (!specs) return null;
  return (specs.socket as string) || (specs.cpuSocket as string) || null;
}

export function extractRAMType(specs: ProductSpecifications | undefined): RAMType | null {
  if (!specs) return null;
  const memoryType = specs.memoryType as string | undefined;
  if (memoryType && RAM_TYPES.includes(memoryType as RAMType)) {
    return memoryType as RAMType;
  }
  return null;
}

export function extractSupportedSockets(specs: ProductSpecifications | undefined): string[] {
  if (!specs) return [];
  const sockets = specs.supportedSockets;
  if (Array.isArray(sockets)) {
    return sockets.filter((s): s is string => typeof s === 'string');
  }
  const singleSocket = specs.socket as string | undefined;
  return singleSocket ? [singleSocket] : [];
}

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

export function extractTDP(specs: ProductSpecifications | undefined): number {
  if (!specs) return 0;
  return (specs.tdp as number) || (specs.powerDraw as number) || 0;
}