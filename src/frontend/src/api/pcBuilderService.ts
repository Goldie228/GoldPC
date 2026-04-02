/**
 * PCBuilder API — проверка совместимости через backend
 */

import apiClient from './client';
import type { Product } from './types';

// === Request / Response типы по OpenAPI pcbuilder.yaml ===

export interface SelectedComponentDTO {
  productId: string;
  name: string;
  sku?: string;
  category?: string;
  price: number;
  quantity?: number;
  specifications?: Record<string, unknown>;
  isAvailable?: boolean;
  image?: string;
}

export interface PCComponentsDTO {
  cpu?: SelectedComponentDTO;
  motherboard?: SelectedComponentDTO;
  gpu?: SelectedComponentDTO;
  ram?: SelectedComponentDTO;
  psu?: SelectedComponentDTO;
  storage?: SelectedComponentDTO[];
  case?: SelectedComponentDTO;
  cooling?: SelectedComponentDTO;
}

export interface CompatibilityIssueDTO {
  severity: 'Error' | 'Warning' | 'Info';
  component1: string;
  component2: string;
  message: string;
  suggestion?: string;
}

export interface CompatibilityWarningDTO {
  severity: 'Warning' | 'Info';
  component: string;
  message: string;
  suggestion?: string;
}

export interface CompatibilityResultDTO {
  isCompatible: boolean;
  issues: CompatibilityIssueDTO[];
  warnings: CompatibilityWarningDTO[];
}

export interface CompatibilityCheckResponse {
  result: CompatibilityResultDTO;
  powerConsumption: number;
  recommendedPSU: number;
}

// === Утилиты ===

function productToDTO(product: Product): SelectedComponentDTO {
  return {
    productId: product.id,
    name: product.name,
    sku: product.sku,
    category: product.category,
    price: product.price,
    specifications: (product.specifications as Record<string, unknown>) ?? {},
    isAvailable: product.stock > 0,
    image: product.mainImage?.url,
  };
}

export interface SelectedComponentsState {
  cpu?: { product: Product };
  gpu?: { product: Product };
  motherboard?: { product: Product };
  psu?: { product: Product };
  case?: { product: Product };
  cooling?: { product: Product };
  ram: { product: Product }[];
  storage: { product: Product }[];
}

export function buildComponentsDTO(components: SelectedComponentsState): PCComponentsDTO {
  const dto: PCComponentsDTO = {};

  if (components.cpu) dto.cpu = productToDTO(components.cpu.product);
  if (components.gpu) dto.gpu = productToDTO(components.gpu.product);
  if (components.motherboard) dto.motherboard = productToDTO(components.motherboard.product);
  if (components.psu) dto.psu = productToDTO(components.psu.product);
  if (components.case) dto.case = productToDTO(components.case.product);
  if (components.cooling) dto.cooling = productToDTO(components.cooling.product);

  if (components.ram.length === 1) {
    dto.ram = productToDTO(components.ram[0].product);
  } else if (components.ram.length > 1) {
    dto.ram = productToDTO(components.ram[0].product);
  }

  if (components.storage.length > 0) {
    dto.storage = components.storage.map((s) => productToDTO(s.product));
  }

  return dto;
}

// === FPS API ===

export interface FpsGameEstimate {
  gameId: string;
  gameName: string;
  resolutions: {
    resolution1080p: number;
    resolution1440p: number;
    resolution4k: number;
  };
}

export interface FpsApiResponse {
  cpuScore: number;
  gpuScore: number;
  overallScore: number;
  bottleneck: string | null;
  games: FpsGameEstimate[];
  ramFactor: number;
}

export async function calculateFpsApi(params: {
  cpuId?: string;
  gpuId?: string;
  ramCapacity?: number;
  ramFrequency?: number;
}): Promise<FpsApiResponse> {
  const { data } = await apiClient.post<FpsApiResponse>(
    '/pcbuilder/calculate-fps',
    {
      components: { cpuId: params.cpuId, gpuId: params.gpuId },
      ramCapacity: params.ramCapacity,
      ramFrequency: params.ramFrequency,
    },
  );
  return data;
}

// === API ===

export async function checkCompatibilityAPI(
  components: SelectedComponentsState,
): Promise<CompatibilityCheckResponse> {
  const dto = buildComponentsDTO(components);
  const { data } = await apiClient.post<CompatibilityCheckResponse>(
    '/pcbuilder/check-compatibility',
    { components: dto },
  );
  return data;
}
