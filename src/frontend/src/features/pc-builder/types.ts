/**
 * PC Builder Feature Типы
 * Extracted from usePCBuilder.ts for better organization
 */

import type { Product, ProductSpecifications } from '@/api/types';

export type PCComponentType =
  | 'cpu'
  | 'gpu'
  | 'motherboard'
  | 'ram'
  | 'storage'
  | 'psu'
  | 'case'
  | 'cooling'
  | 'fan'
  | 'monitor'
  | 'keyboard'
  | 'mouse'
  | 'headphones';

export type ComponentSlotState = 'empty' | 'selected' | 'incompatible';

export interface SelectedComponent {
  product: Product;
  type: PCComponentType;
}

export interface CompatibilityResult {
  isCompatible: boolean;
  errors: string[];
  warnings: string[];
  bottleneck?: string;
  bottleneckSeverity?: 'balanced' | 'cpu-bound' | 'gpu-bound' | null;
}

export interface ComponentCompatibility {
  state: ComponentSlotState;
  warning?: string;
}

export interface PCBuilderSelectedState {
  cpu?: SelectedComponent;
  gpu?: SelectedComponent;
  motherboard?: SelectedComponent;
  psu?: SelectedComponent;
  case?: SelectedComponent;
  cooling?: SelectedComponent;
  ram: SelectedComponent[];
  storage: SelectedComponent[];
  fan: SelectedComponent[];
  monitor?: SelectedComponent;
  keyboard?: SelectedComponent;
  mouse?: SelectedComponent;
  headphones?: SelectedComponent;
}

export const MAX_RAM_MODULES = 8;
export const MAX_STORAGE_MODULES = 8;
export const MAX_FAN_MODULES = 8;