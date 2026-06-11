/**
 * PC Builder Types
 * Extracted from usePCBuilder.ts for better organization
 */

import type { Product } from '@/api/types';

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
  performanceScores?: import('./performance').PerformanceResult;
  apiRecommendedPsu?: number;
  apiPowerConsumption?: number;
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

/**
 * Serialization schemas for LocalStorage persistence (v1 and v2)
 */

export interface SerializedSingle {
  productId: string;
  product: Product;
  type: PCComponentType;
}

export interface SerializedBuildV2 {
  v: 2;
  savedAt: string;
  components: {
    cpu?: SerializedSingle;
    gpu?: SerializedSingle;
    motherboard?: SerializedSingle;
    psu?: SerializedSingle;
    case?: SerializedSingle;
    cooling?: SerializedSingle;
    ram?: SerializedSingle[];
    storage?: SerializedSingle[];
    fan?: SerializedSingle[];
    monitor?: SerializedSingle;
    keyboard?: SerializedSingle;
    mouse?: SerializedSingle;
    headphones?: SerializedSingle;
  };
}

export interface SerializedBuildV1 {
  savedAt: string;
  components: Record<string, SerializedSingle>;
}

export interface SelectComponentOptions {
  multiIndex?: number;
}