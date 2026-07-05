/**
 * usePCBuilder — PC Builder Hook (Thin Orchestrator)
 *
 * ONLY wires together:
 - extracted side-effect hooks
 - pure logic modules
 - state + actions
 *
 * NO business logic, NO API calls, NO localStorage
 */

import { useState, useEffect, useCallback, useMemo, useRef, type MutableRefObject } from 'react';
import type { Product } from '../api/types';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { calculatePerformance, type EstimatedFps } from '@/features/pc-builder/logic/performance';
import type { FpsApiResponse } from '../api/pcBuilderService';

import type {
  PCComponentType,
  CompatibilityResult,
  ComponentCompatibility,
  PCBuilderSelectedState,
  SelectComponentOptions,
} from '@/features/pc-builder/logic/types';
export type {
  PCComponentType,
  CompatibilityResult,
  ComponentCompatibility,
  PCBuilderSelectedState,
  SelectComponentOptions,
} from '@/features/pc-builder/logic/types';
// Re-exported for external use
export type {
  ComponentSlotState,
  SelectedComponent,
} from '@/features/pc-builder/logic/types';
import {
  MAX_STORAGE_MODULES,
  MAX_FAN_MODULES,
  TOTAL_CATEGORIES,
} from '@/features/pc-builder/logic/constants';
import { checkCompatibility } from '@/shared/utils/compatibility/orchestration';
import { calculatePowerConsumption } from '@/shared/utils/compatibility/checks';
import { loadFromLocalStorage } from '@/features/pc-builder/logic/persistence';
import {
  getComponentState,
  countSelectedCategories,
  buildComponentMap,
} from '@/features/pc-builder/logic/slotHelpers';
import {
  selectComponent,
  duplicateModule,
  removeComponent,
  resetBuild,
  addToCart,
  addToCartAsAssembly,
} from '@/features/pc-builder/logic/actions';
import { calculateTotalPrice } from '@/features/pc-builder/logic/pricing';
import { getMaxRamModules, getMaxRamQty } from '@/features/pc-builder/logic/slotLimits';

import { useCompatibilityApi } from './pc-builder/useCompatibilityApi';
import { useFpsApi } from './pc-builder/useFpsApi';
import { usePersistence } from './pc-builder/usePersistence';
import { useRamTrim } from './pc-builder/useRamTrim';

export interface UsePCBuilderReturn {
  selectedComponents: PCBuilderSelectedState;
  /** Stable ref that always holds the latest selectedComponents (avoids stale closures in effects) */
  selectedComponentsRef: MutableRefObject<PCBuilderSelectedState>;
  compatibility: CompatibilityResult;
  totalPrice: number;
  powerConsumption: number;
  recommendedPsu: number;
  estimatedFps: EstimatedFps;
  bottleneck: string;
  isApiLoading: boolean;
  selectedCount: number;
  totalCount: number;
  apiFpsData?: FpsApiResponse;
  selectComponent: (type: PCComponentType, product: Product, options?: SelectComponentOptions) => void;
  duplicateModule: (type: 'ram' | 'storage' | 'fan') => void;
  removeComponent: (type: PCComponentType, multiIndex?: number) => void;
  resetBuild: () => void;
  clearBuild: () => void;
  /** When set to true, usePersistence will skip saving to localStorage (used during config loading) */
  skipSaveRef: { current: boolean };
  addToCart: () => void;
  addToCartAsAssembly: () => void;
  getSlotState: (type: PCComponentType, multiIndex?: number) => ComponentCompatibility;
  checkCompatibility: () => CompatibilityResult;
  isCompatible: boolean;
  maxRamModules: number;
  maxRamQty: number;
  maxStorageModules: number;
  maxFanModules: number;
}

export function usePCBuilder(): UsePCBuilderReturn {
  // === State ===
  const [selectedComponents, setSelectedComponents] = useState<PCBuilderSelectedState>(loadFromLocalStorage);
  /** Ref that always holds the latest selectedComponents (avoids stale closures) */
  const selectedComponentsRef = useRef(selectedComponents);
  selectedComponentsRef.current = selectedComponents;

  // === Side Effect Hooks ===
  const { apiResult, isLoading: isApiLoading } = useCompatibilityApi(selectedComponents);
  const { fpsData: apiFpsData } = useFpsApi(selectedComponents);

  // Auto-save to API for authenticated users
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const lastSavedJsonRef = useRef('');
  const lastSavedConfigIdRef = useRef<string | null>(null);
  /** Ref that prevents usePersistence from saving to localStorage during config loading */
  const skipSaveRef = useRef(false);

  // On mount: load existing auto-save ID so we update instead of creating new
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      try {
        const apiClient = (await import('@/api/index')).default;
        const { data } = await apiClient.get<Array<{ id: string; name: string }>>('/pcbuilder/configurations');
        if (cancelled) return;
        const existing = Array.isArray(data) ? data.find((c) => c.name === 'Автосохранение') : null;
        if (existing) lastSavedConfigIdRef.current = existing.id;
      } catch {
        // Ignore — will create new auto-save
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const autoSaveToApi = useCallback(async (state: PCBuilderSelectedState) => {
    if (!isAuthenticated) return;
    // Skip if nothing meaningful changed (avoid empty saves)
    const hasAny = state.cpu || state.motherboard || state.gpu || state.ram.length > 0 || state.storage.length > 0;
    if (!hasAny) return;
    const json = JSON.stringify(state, (_k, v) => v === undefined ? null : v);
    if (json === lastSavedJsonRef.current) return;
    lastSavedJsonRef.current = json;
    try {
      const apiClient = (await import('@/api/index')).default;
      const { calculateTotalPrice } = await import('@/features/pc-builder/logic/pricing');
      const payload = {
        id: lastSavedConfigIdRef.current ?? undefined,
        name: 'Автосохранение',
        purpose: 'gaming',
        processorId: state.cpu?.product.id,
        motherboardId: state.motherboard?.product.id,
        ramId: state.ram.length > 0 ? state.ram[0].product.id : undefined,
        gpuId: state.gpu?.product.id,
        psuId: state.psu?.product.id,
        storageId: state.storage.length > 0 ? state.storage[0].product.id : undefined,
        caseId: state.case?.product.id,
        coolerId: state.cooling?.product.id,
        totalPrice: calculateTotalPrice(state),
      };
      const { data } = await apiClient.post('/pcbuilder/configurations', payload);
      if (data?.id) lastSavedConfigIdRef.current = data.id;
    } catch {
      // Silent fail for auto-save
    }
  }, [isAuthenticated]);

  usePersistence(selectedComponents, {
    initialState: selectedComponents,
    onClearStorage: () => {},
    autoSaveToApi,
    skipSaveRef,
  });

  // === Cart Store ===
  const cartAddItem = useCartStore((s) => s.addItem);
  const cartAddBundleItem = useCartStore((s) => s.addBundleItem);

  // === Derived Data (pure logic) ===
  const SOCKET_ERROR_RE = /Не удалось определить сокет/i;
  const localCompatibility = useMemo(() => {
    const componentMap = buildComponentMap(selectedComponents);
    const allRamSticks = selectedComponents.ram.map(r => r.product);
    const fanCount = selectedComponents.fan.length;
    const result = checkCompatibility(componentMap, allRamSticks, fanCount);
    return {
      isCompatible: result.isCompatible,
      errors: result.issues.filter(i => !SOCKET_ERROR_RE.test(i.message)).map(i => i.message),
      warnings: result.warnings.map(w => w.message),
      bottleneck: result.bottleneckPercentage > 0 ? `${result.bottleneckPercentage}%` : undefined,
    };
  }, [selectedComponents]);

  const totalPrice = useMemo(
    () => calculateTotalPrice(selectedComponents),
    [selectedComponents]
  );

  const powerConsumption = useMemo(() => {
    const componentMap = buildComponentMap(selectedComponents);
    return calculatePowerConsumption(componentMap);
  }, [selectedComponents]);

  const cpuProduct = selectedComponents.cpu?.product ?? null;
  const gpuProduct = selectedComponents.gpu?.product ?? null;
  const ramFirst = selectedComponents.ram[0]?.product ?? null;

  const performance = useMemo(
    () => calculatePerformance(cpuProduct, gpuProduct, ramFirst),
    [cpuProduct, gpuProduct, ramFirst]
  );

  // === Combined Compatibility (API + local) ===
  const compatibility: CompatibilityResult = useMemo(() => {
    if (apiResult != null) {
      const apiIssues = apiResult.result;
      const errors: string[] = apiIssues.issues
        .filter((i) => i.severity === 'Error')
        .filter((i) => !SOCKET_ERROR_RE.test(i.message))
        .map((i) => i.message);
      const warnings: string[] = [
        ...apiIssues.warnings.map((w) => w.message),
        ...apiIssues.issues.filter((i) => i.severity === 'Warning').map((i) => i.message),
      ];
      const bottleneck = apiIssues.issues.find((i) =>
        i.message.toLowerCase().includes('bottleneck')
      )?.message ?? '';
      return { isCompatible: errors.length === 0, errors, warnings, bottleneck };
    }
    return { ...localCompatibility, bottleneck: '' };
  }, [apiResult, localCompatibility]);

  // === Computed Values ===
  const recommendedPsu = useMemo(() => {
    if (apiResult?.recommendedPSU) return apiResult.recommendedPSU;
    const gpuRecommendedPsu = selectedComponents.gpu?.product?.specifications?.recommendedPsu as number | undefined;
    const calculated = Math.ceil(powerConsumption * 1.2); // Unified 1.2x margin
    return gpuRecommendedPsu ? Math.max(calculated, gpuRecommendedPsu) : calculated;
  }, [apiResult, powerConsumption, selectedComponents.gpu]);

  const selectedCount = countSelectedCategories(selectedComponents);

  const maxRamModules = useMemo(
    () => getMaxRamModules(selectedComponents.motherboard?.product),
    [selectedComponents.motherboard]
  );

  const maxRamQty = useMemo(
    () => getMaxRamQty(selectedComponents, maxRamModules),
    [selectedComponents.ram.length, maxRamModules]
  );

  // === RAM Trim Effect ===
  useRamTrim({
    ramModules: selectedComponents.ram,
    maxModules: maxRamModules,
    onTrim: (trimmedRam) => setSelectedComponents((prev) => ({ ...prev, ram: trimmedRam })),
  });

  // === Actions ===
  const selectComponentAction = useCallback(
    (type: PCComponentType, product: Product, options?: SelectComponentOptions) => {
      setSelectedComponents((prev) => selectComponent(prev, type, product, options));
    },
    []
  );

  const duplicateModuleAction = useCallback((type: 'ram' | 'storage' | 'fan') => {
    setSelectedComponents((prev) => duplicateModule(prev, type));
  }, []);

  const removeComponentAction = useCallback((type: PCComponentType, multiIndex?: number) => {
    setSelectedComponents((prev) => removeComponent(prev, type, multiIndex));
  }, []);

  const resetBuildAction = useCallback(() => {
    setSelectedComponents(resetBuild());
  }, []);

  const clearBuildAction = resetBuildAction;

  const addToCartAction = useCallback(() => {
    addToCart(selectedComponents, cartAddItem);
  }, [selectedComponents, cartAddItem]);

  const addToCartAsAssemblyAction = useCallback(() => {
    addToCartAsAssembly(selectedComponents, cartAddBundleItem, totalPrice);
  }, [selectedComponents, cartAddBundleItem, totalPrice]);

  const getSlotState = useCallback(
    (type: PCComponentType, multiIndex?: number): ComponentCompatibility => {
      return getComponentState(type, multiIndex, selectedComponents, compatibility);
    },
    [selectedComponents, compatibility]
  );

  const checkCompatibilityAction = useCallback(() => {
    const componentMap = buildComponentMap(selectedComponents);
    const allRamSticks = selectedComponents.ram.map(r => r.product);
    const fanCount = selectedComponents.fan.length;
    const result = checkCompatibility(componentMap, allRamSticks, fanCount);
    return {
      isCompatible: result.isCompatible,
      errors: result.issues.map(i => i.message),
      warnings: result.warnings.map(w => w.message),
      bottleneck: result.bottleneckPercentage > 0 ? `${result.bottleneckPercentage}%` : undefined,
    };
  }, [selectedComponents]);

  // === Return ===
  return {
    selectedComponents,
    selectedComponentsRef,
    compatibility,
    totalPrice,
    powerConsumption,
    recommendedPsu,
    estimatedFps: performance.estimatedFps,
    bottleneck: compatibility.bottleneck ?? '',
    isApiLoading,
    apiFpsData: apiFpsData ?? undefined,
    selectedCount,
    totalCount: TOTAL_CATEGORIES,
    selectComponent: selectComponentAction,
    duplicateModule: duplicateModuleAction,
    removeComponent: removeComponentAction,
    resetBuild: resetBuildAction,
    clearBuild: clearBuildAction,
    skipSaveRef,
    addToCart: addToCartAction,
    addToCartAsAssembly: addToCartAsAssemblyAction,
    getSlotState,
    checkCompatibility: checkCompatibilityAction,
    isCompatible: compatibility.isCompatible,
    maxRamModules,
    maxRamQty,
    maxStorageModules: MAX_STORAGE_MODULES,
    maxFanModules: MAX_FAN_MODULES,
  };
}