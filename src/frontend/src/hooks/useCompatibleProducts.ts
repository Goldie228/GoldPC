/**
 * useCompatibleProducts - Хук для получения совместимых компонентов
 * 
 * Фильтрует товары категории по совместимости с уже выбранными компонентами.
 */

import { useMemo } from 'react';
import { useProducts } from './useProducts';
import type { ProductSummary, ProductCategory, ProductSpecifications } from '../api/types';
import type { PCComponentType, SelectedComponent } from './usePCBuilder';

export interface CompatibleProductsFilters {
  manufacturerIds?: string[];
  priceMin?: number;
  priceMax?: number;
  socket?: string;
  memoryType?: string;
}

export interface CompatibleProductsResult {
  products: ProductSummary[];
  allProducts: ProductSummary[];
  isLoading: boolean;
  error: Error | null;
  brands: { id: string; name: string; count: number }[];
  sockets: string[];
  priceRange: { min: number; max: number };
  refetch: () => void;
}

const componentTypeToCategory: Record<PCComponentType, ProductCategory> = {
  cpu: 'cpu',
  gpu: 'gpu',
  motherboard: 'motherboard',
  ram: 'ram',
  storage: 'storage',
  psu: 'psu',
  case: 'case',
  cooling: 'cooling',
};

function extractSocket(specs: ProductSpecifications | undefined): string | null {
  if (!specs) return null;
  return (specs.socket as string) || (specs.cpuSocket as string) || null;
}

function extractRAMType(specs: ProductSpecifications | undefined): string | null {
  if (!specs) return null;
  return (specs.memoryType as string) || (specs.type as string) || null;
}

function extractSupportedSockets(specs: ProductSpecifications | undefined): string[] {
  if (!specs) return [];
  const sockets = specs.supportedSockets;
  if (Array.isArray(sockets)) {
    return sockets.filter((s): s is string => typeof s === 'string');
  }
  const singleSocket = specs.socket as string | undefined;
  return singleSocket ? [singleSocket] : [];
}
