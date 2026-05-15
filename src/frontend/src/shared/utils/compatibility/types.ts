/**
 * Compatibility types - extracted from monolithic compatibilityUtils.ts
 */

import type { Product, ProductSpecifications } from '../../../api/types';
import type {
  CompatibilityRulesConfig,
  SocketGroup,
  BottleneckCategory,
} from '../../../config/compatibilityTypes';
export type { CompatibilityRulesConfig, SocketGroup, BottleneckCategory } from '../../../config/compatibilityTypes';

export type ComponentCategory = 'cpu' | 'gpu' | 'motherboard' | 'ram' | 'storage' | 'psu' | 'case' | 'cooling';
export type CompatibilitySeverity = 'Error' | 'Warning' | 'Info';

export interface CompatibilityIssue {
  severity: CompatibilitySeverity;
  component1: string;
  component2: string;
  message: string;
  suggestion?: string;
}

export interface CompatibilityWarning {
  severity: 'Warning' | 'Info';
  component: string;
  message: string;
  suggestion?: string;
}

export interface CompatibilityCheckResult {
  isCompatible: boolean;
  issues: CompatibilityIssue[];
  warnings: CompatibilityWarning[];
  powerConsumption: number;
  recommendedPSU: number;
  bottleneckPercentage: number;
}

export type ComponentMap = Partial<Record<ComponentCategory, Product | null>>;

export type MemoryType = 'DDR4' | 'DDR5';
export type FormFactor = 'ATX' | 'MicroATX' | 'MiniITX' | 'EATX';
export type MemoryFormFactor = 'DIMM' | 'SO-DIMM';

export const config: CompatibilityRulesConfig = null as unknown as CompatibilityRulesConfig;
export const SOCKET_GROUPS: SocketGroup[] = [];
export const BOTTLENECK_CATEGORIES: Record<string, BottleneckCategory> = {};

export { type Product, type ProductSpecifications };