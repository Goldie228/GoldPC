/**
 * usePCBuilder — сборка ПК: одиночные слоты + несколько модулей ОЗУ и накопителей,
 * совместимость, корзина, LocalStorage v2 (миграция с v1).
 *
 * v3: мемоизация расчётов, интеграция API /api/v1/pcbuilder/check-compatibility,
 * мгновенное обновление цены, расчёт bottleneck / FPS / рекомендуемой мощности БП.
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Product, ProductSpecifications } from '../api/types';
import { useCartStore } from '../store/cartStore';
import { calculatePerformance, type EstimatedFps, type PerformanceResult } from '../utils/performanceCalculator';
import { checkCompatibilityAPI, calculateFpsApi } from '../api/pcBuilderService';
import type { CompatibilityCheckResponse, FpsApiResponse } from '../api/pcBuilderService';
import { hasIntegratedGraphics } from '../utils/compatibilityUtils';
import compatibilityRules from '../config/compatibilityRules.json';
import type { CompatibilityRulesConfig } from '../config/compatibilityTypes';

const rules = compatibilityRules as unknown as CompatibilityRulesConfig;

// === Типы ===

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
  /** Текст bottleneck-рекомендации от API (или пустая строка) */
  bottleneck?: string;
  /** Локальный bottleneck CPU/GPU (не зависит от API) */
  bottleneckSeverity?: 'balanced' | 'cpu-bound' | 'gpu-bound' | null;
  /** Оценки производительности (мгновенный расчёт) */
  performanceScores?: PerformanceResult;
  /** Рекомендуемая мощность БП от API (0 если нет) */
  apiRecommendedPsu?: number;
  /** Потребление мощности от API */
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

// === Сериализация ===

interface SerializedSingle {
  productId: string;
  product: Product;
  type: PCComponentType;
}

interface SerializedBuildV2 {
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

interface SerializedBuildV1 {
  savedAt: string;
  components: Record<string, SerializedSingle>;
}

// === Константы ===

const RAM_TYPES = rules.ramCompatibility.validTypes as readonly string[];
type RAMType = (typeof RAM_TYPES)[number];

const TOTAL_CATEGORIES = 12;
export const MAX_RAM_MODULES = 8;
export const MAX_STORAGE_MODULES = 8;
export const MAX_FAN_MODULES = 8;

const BASE_POWER_CONSUMPTION = rules.powerCompatibility.baseSystemPower;
const PSU_BUFFER = rules.powerCompatibility.psuBufferPercent;
const STORAGE_KEY = 'goldpc-pc-builder';

// Дебаунс для API-запроса совместимости (мс)
const COMPATIBILITY_DEBOUNCE_MS = 120;

// Дебаунс для FPS API-запроса (мс) — тяжелее, чем совместимость
const FPS_DEBOUNCE_MS = 300;

export function emptyPcBuilderState(): PCBuilderSelectedState {
  return { ram: [], storage: [], fan: [] };
}

// === Извлечение спецификаций (мемоизируемых) ===

function extractSocket(specs: ProductSpecifications | undefined): string | null {
  if (!specs) return null;
  return (specs.socket as string) || (specs.cpuSocket as string) || null;
}

function extractRAMType(specs: ProductSpecifications | undefined): RAMType | null {
  if (!specs) return null;
  const memoryType = specs.memoryType as string | undefined;
  if (memoryType && RAM_TYPES.includes(memoryType as RAMType)) {
    return memoryType as RAMType;
  }
  return null;
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

function extractMbRamSlots(specs: ProductSpecifications | undefined): number {
  if (!specs) return 4;
  return (specs.ramSlots as number) || 4;
}

/**
 * Парсит количество плашек из спецификации modules (например "2 модуля" → 2).
 * Используется для RAM-продуктов с заводскими комплектами.
 */
function extractModulesCount(specs: ProductSpecifications | undefined): number {
  if (!specs) return 1;
  const raw = specs.modules as string | undefined;
  if (!raw) return 1;
  const match = raw.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

function extractTDP(specs: ProductSpecifications | undefined): number {
  if (!specs) return 0;
  return (specs.tdp as number) || (specs.powerDraw as number) || 0;
}

function checkBuildCompatibility(components: PCBuilderSelectedState): CompatibilityResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const cpu = components.cpu?.product;
  const motherboard = components.motherboard?.product;
  const rams = components.ram;
  const cooling = components.cooling?.product;
  const gpu = components.gpu?.product;
  const psu = components.psu?.product;

  if (cpu && motherboard) {
    const cpuSocket = extractSocket(cpu.specifications);
    const mbSocket = extractSocket(motherboard.specifications);

    if (cpuSocket && mbSocket && cpuSocket !== mbSocket) {
      errors.push(
        `Сокет процессора (${cpuSocket}) не соответствует сокету материнской платы (${mbSocket})`
      );
    }
  }

  if (motherboard && rams.length > 0) {
    const mbMemoryType = extractRAMType(motherboard.specifications);
    let refType: RAMType | null = null;
    for (const r of rams) {
      const ramType = extractRAMType(r.product.specifications);
      if (ramType && mbMemoryType && ramType !== mbMemoryType) {
        errors.push(
          `Тип памяти (${ramType}) не поддерживается материнской платой (${mbMemoryType})`
        );
        break;
      }
      if (ramType) {
        if (refType && ramType !== refType) {
          errors.push('Все модули ОЗУ должны быть одного типа (DDR4/DDR5 и т.д.)');
          break;
        }
        refType = ramType;
      }
    }

    // Check motherboard RAM slot limit accounting for modules per unit (e.g. "2 модуля" kit)
    if (rams.length > 0) {
      const mbRamSlots = extractMbRamSlots(motherboard.specifications);
      const modulesPerUnit = extractModulesCount(rams[0].product.specifications);
      const totalSticks = rams.length * modulesPerUnit;
      if (totalSticks > mbRamSlots) {
        errors.push(`Выбрано ${rams.length} комплект(ов) ОЗУ (×${modulesPerUnit} плашек), итого ${totalSticks} плашек, но материнская плата имеет только ${mbRamSlots} слотов`);
      }
    }
  }

  if (cooling && cpu) {
    const cpuSocket = extractSocket(cpu.specifications);
    const supportedSockets = extractSupportedSockets(cooling.specifications);

    if (cpuSocket && supportedSockets.length > 0 && !supportedSockets.includes(cpuSocket)) {
      warnings.push(`Система охлаждения может не поддерживать сокет ${cpuSocket}`);
    }
  }

  if (!gpu && cpu) {
    const igpu = hasIntegratedGraphics(cpu.specifications);
    if (!igpu) {
      warnings.push('Не выбрана видеокарта, а процессор не имеет встроенной графики');
    }
  }

  if (psu && (cpu || gpu)) {
    const psuWattage = psu.specifications?.wattage as number | undefined;
    const cpuTdp = extractTDP(cpu?.specifications);
    const gpuTdp = extractTDP(gpu?.specifications);

    if (psuWattage) {
      const totalTdp = cpuTdp + gpuTdp + BASE_POWER_CONSUMPTION;
      const recommendedPsu = totalTdp * 1.3;

      if (psuWattage < recommendedPsu) {
        warnings.push(
          `Рекомендуется блок питания мощнее (${Math.ceil(recommendedPsu)}W), текущий: ${psuWattage}W`
        );
      }
    }
  }

  return {
    isCompatible: errors.length === 0,
    errors,
    warnings,
  };
}

function calculatePowerConsumption(components: PCBuilderSelectedState): number {
  let total = BASE_POWER_CONSUMPTION;
  const cpu = components.cpu?.product;
  const gpu = components.gpu?.product;
  const cooling = components.cooling?.product;

  if (cpu) total += extractTDP(cpu.specifications);
  if (gpu) total += extractTDP(gpu.specifications);
  for (const s of components.storage) {
    total += extractTDP(s.product.specifications) || 5;
  }
  if (cooling) total += extractTDP(cooling.specifications) || 10;
  for (const f of components.fan) {
    total += extractTDP(f.product.specifications) || 3;
  }

  return Math.max(0, total);
}

function isBuilderEmpty(c: PCBuilderSelectedState): boolean {
  return (
    !c.cpu &&
    !c.gpu &&
    !c.motherboard &&
    !c.psu &&
    !c.case &&
    !c.cooling &&
    c.ram.length === 0 &&
    c.storage.length === 0 &&
    c.fan.length === 0 &&
    !c.monitor &&
    !c.keyboard &&
    !c.mouse &&
    !c.headphones
  );
}

function saveToLocalStorage(components: PCBuilderSelectedState): void {
  try {
    if (isBuilderEmpty(components)) {
      clearLocalStorage();
      return;
    }
    const componentsPayload: SerializedBuildV2['components'] = {};
    const singleKeys: (keyof PCBuilderSelectedState)[] = [
      'cpu',
      'gpu',
      'motherboard',
      'psu',
      'case',
      'cooling',
      'monitor',
      'keyboard',
      'mouse',
      'headphones',
    ];
    for (const key of singleKeys) {
      const comp = components[key];
      if (comp && typeof comp === 'object' && 'product' in comp) {
        const sc = comp as SelectedComponent;
        (componentsPayload as Record<string, SerializedSingle>)[key] = {
          productId: sc.product.id,
          product: sc.product,
          type: sc.type,
        };
      }
    }
    if (components.ram.length > 0) {
      componentsPayload.ram = components.ram.map((c) => ({
        productId: c.product.id,
        product: c.product,
        type: 'ram' as const,
      }));
    }
    if (components.storage.length > 0) {
      componentsPayload.storage = components.storage.map((c) => ({
        productId: c.product.id,
        product: c.product,
        type: 'storage' as const,
      }));
    }
    if (components.fan.length > 0) {
      componentsPayload.fan = components.fan.map((c) => ({
        productId: c.product.id,
        product: c.product,
        type: 'fan' as const,
      }));
    }

    const serialized: SerializedBuildV2 = {
      v: 2,
      savedAt: new Date().toISOString(),
      components: componentsPayload,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch {
    /* ignore */
  }
}

function migrateV1ToState(parsed: SerializedBuildV1): PCBuilderSelectedState {
  const out = emptyPcBuilderState();
  const c = parsed.components || {};
  for (const [, raw] of Object.entries(c)) {
    if (!raw || typeof raw !== 'object') continue;
    const entry = raw as SerializedSingle;
    const type = entry.type as PCComponentType;
    const sc: SelectedComponent = { product: entry.product, type };
    if (type === 'ram') out.ram.push(sc);
    else if (type === 'storage') out.storage.push(sc);
    else if (type === 'cpu') out.cpu = sc;
    else if (type === 'gpu') out.gpu = sc;
    else if (type === 'motherboard') out.motherboard = sc;
    else if (type === 'psu') out.psu = sc;
    else if (type === 'case') out.case = sc;
    else if (type === 'cooling') out.cooling = sc;
    else if (type === 'fan') out.fan.push(sc);
  }
  return out;
}

function loadFromLocalStorage(): PCBuilderSelectedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyPcBuilderState();
    const parsed = JSON.parse(raw) as SerializedBuildV2 | SerializedBuildV1;

    if ('v' in parsed && parsed.v === 2 && parsed.components) {
      const c = parsed.components;
      return {
        cpu: c.cpu ? { product: c.cpu.product, type: 'cpu' } : undefined,
        gpu: c.gpu ? { product: c.gpu.product, type: 'gpu' } : undefined,
        motherboard: c.motherboard
          ? { product: c.motherboard.product, type: 'motherboard' }
          : undefined,
        psu: c.psu ? { product: c.psu.product, type: 'psu' } : undefined,
        case: c.case ? { product: c.case.product, type: 'case' } : undefined,
        cooling: c.cooling ? { product: c.cooling.product, type: 'cooling' } : undefined,
        ram: (c.ram ?? []).map((x) => ({ product: x.product, type: 'ram' as const })),
        storage: (c.storage ?? []).map((x) => ({
          product: x.product,
          type: 'storage' as const,
        })),
        fan: (c.fan ?? []).map((x) => ({ product: x.product, type: 'fan' as const })),
        monitor: c.monitor ? { product: c.monitor.product, type: 'monitor' } : undefined,
        keyboard: c.keyboard ? { product: c.keyboard.product, type: 'keyboard' } : undefined,
        mouse: c.mouse ? { product: c.mouse.product, type: 'mouse' } : undefined,
        headphones: c.headphones ? { product: c.headphones.product, type: 'headphones' } : undefined,
      };
    }

    return migrateV1ToState(parsed as SerializedBuildV1);
  } catch {
    return emptyPcBuilderState();
  }
}

function clearLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function getComponentState(
  type: PCComponentType,
  multiIndex: number | undefined,
  components: PCBuilderSelectedState,
  compatibility: CompatibilityResult
): ComponentCompatibility {
  let hasComponent = false;
  if (type === 'ram') {
    hasComponent =
      multiIndex !== undefined ? !!components.ram[multiIndex] : components.ram.length > 0;
  } else if (type === 'fan') {
    hasComponent =
      multiIndex !== undefined ? !!components.fan[multiIndex] : components.fan.length > 0;
  } else if (type === 'storage') {
    hasComponent =
      multiIndex !== undefined ? !!components.storage[multiIndex] : components.storage.length > 0;
  } else {
    hasComponent = !!components[type];
  }

  if (!hasComponent) {
    return { state: 'empty' };
  }

  const componentErrors = compatibility.errors.filter((error) => {
    const errorLower = error.toLowerCase();
    const typeName =
      type === 'cpu'
        ? 'процессор'
        : type === 'motherboard'
          ? 'материнск'
          : type === 'ram'
            ? 'памят'
            : type === 'cooling'
              ? 'охлажден'
              : type === 'gpu'
                ? 'видеокарт'
                : type === 'psu'
                  ? 'блок питания'
                  : type === 'storage'
                    ? 'накопител'
                    : '';
    return errorLower.includes(typeName);
  });

  if (componentErrors.length > 0) {
    return {
      state: 'incompatible',
      warning: componentErrors[0],
    };
  }

  const componentWarnings = compatibility.warnings.filter((warning) => {
    const warningLower = warning.toLowerCase();
    const typeName =
      type === 'cpu'
        ? 'процессор'
        : type === 'motherboard'
          ? 'материнск'
          : type === 'ram'
            ? 'памят'
            : type === 'cooling'
              ? 'охлажден'
              : type === 'gpu'
                ? 'видеокарт'
                : type === 'psu'
                  ? 'блок питания'
                  : '';
    return warningLower.includes(typeName);
  });

  if (componentWarnings.length > 0 && type === 'cooling') {
    return {
      state: 'incompatible',
      warning: componentWarnings[0],
    };
  }

  return { state: 'selected' };
}

function countSelectedCategories(c: PCBuilderSelectedState): number {
  let n = 0;
  if (c.cpu) n++;
  if (c.gpu) n++;
  if (c.motherboard) n++;
  if (c.ram.length > 0) n++;
  if (c.storage.length > 0) n++;
  if (c.psu) n++;
  if (c.case) n++;
  if (c.cooling) n++;
  if (c.fan.length > 0) n++;
  if (c.monitor) n++;
  if (c.keyboard) n++;
  if (c.mouse) n++;
  if (c.headphones) n++;
  return n;
}

export interface SelectComponentOptions {
  multiIndex?: number;
}

export interface UsePCBuilderReturn {
  selectedComponents: PCBuilderSelectedState;
  compatibility: CompatibilityResult;
  totalPrice: number;
  powerConsumption: number;
  recommendedPsu: number;
  estimatedFps: EstimatedFps;
  bottleneck: string;
  isApiLoading: boolean;
  selectedCount: number;
  totalCount: number;
  /** Данные с backend FPS API (если CPU+GPU выбраны) */
  apiFpsData?: FpsApiResponse;
  selectComponent: (
    type: PCComponentType,
    product: Product,
    options?: SelectComponentOptions
  ) => void;
  /** Увеличить количество модулей типа (RAM/fan) за счёт дублирования первого */
  duplicateModule: (type: 'ram' | 'storage' | 'fan') => void;
  removeComponent: (type: PCComponentType, multiIndex?: number) => void;
  resetBuild: () => void;
  clearBuild: () => void;
  addToCart: () => void;
  getSlotState: (type: PCComponentType, multiIndex?: number) => ComponentCompatibility;
  checkCompatibility: () => CompatibilityResult;
  isCompatible: boolean;
  maxRamModules: number;
  /** Макс. количество комплектов ОЗУ (с учётом modulesPerUnit и слотов материнки) */
  maxRamQty: number;
  maxStorageModules: number;
  maxFanModules: number;
}

export function usePCBuilder(): UsePCBuilderReturn {
  const [selectedComponents, setSelectedComponents] =
    useState<PCBuilderSelectedState>(loadFromLocalStorage);

  const isFirstRender = useRef(true);
  const apiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fpsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [apiResult, setApiResult] = useState<CompatibilityCheckResponse | null>(null);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [apiFpsData, setApiFpsData] = useState<FpsApiResponse | null>(null);

  // --- Мемоизированные локальные расчёты (мгновенные, без API) ---

  const localCompatibility = useMemo(
    () => checkBuildCompatibility(selectedComponents),
    [selectedComponents]
  );

  const totalPrice = useMemo(() => {
    let sum = 0;
    const s = selectedComponents;
    
    if (s.cpu) sum += s.cpu.product.price;
    if (s.gpu) sum += s.gpu.product.price;
    if (s.motherboard) sum += s.motherboard.product.price;
    if (s.psu) sum += s.psu.product.price;
    if (s.case) sum += s.case.product.price;
    if (s.cooling) sum += s.cooling.product.price;
    
    for (const r of s.ram) sum += r.product.price;
    for (const st of s.storage) sum += st.product.price;
    for (const f of s.fan) sum += f.product.price;
    if (s.monitor) sum += s.monitor.product.price;
    if (s.keyboard) sum += s.keyboard.product.price;
    if (s.mouse) sum += s.mouse.product.price;
    if (s.headphones) sum += s.headphones.product.price;

    return sum;
  }, [
    selectedComponents.cpu,
    selectedComponents.gpu,
    selectedComponents.motherboard,
    selectedComponents.psu,
    selectedComponents.case,
    selectedComponents.cooling,
    selectedComponents.ram,
    selectedComponents.storage,
    selectedComponents.fan,
    selectedComponents.monitor,
    selectedComponents.keyboard,
    selectedComponents.mouse,
    selectedComponents.headphones,
  ]);

  const powerConsumption = useMemo(
    () => calculatePowerConsumption(selectedComponents),
    [selectedComponents]
  );

  // Мемоизированный расчёт производительности
  const cpuProduct = selectedComponents.cpu?.product ?? null;
  const gpuProduct = selectedComponents.gpu?.product ?? null;
  const ramFirst = selectedComponents.ram[0]?.product ?? null;

  const performance = useMemo(
    () => calculatePerformance(cpuProduct, gpuProduct, ramFirst),
    [cpuProduct, gpuProduct, ramFirst]
  );

  // --- API-интеграция: проверка совместимости через backend с дебаунсом ---

  useEffect(() => {
    const hasComponents =
      !!selectedComponents.cpu || !!selectedComponents.gpu || !!selectedComponents.motherboard;
    if (!hasComponents) {
      setApiResult(null);
      return;
    }

    if (apiTimerRef.current) clearTimeout(apiTimerRef.current);
    apiTimerRef.current = setTimeout(async () => {
      setIsApiLoading(true);
      try {
        const result = await checkCompatibilityAPI(
          selectedComponents as Parameters<typeof checkCompatibilityAPI>[0]
        );
        setApiResult(result);
      } catch {
        // API недоступно — работаем на локальной проверке
      } finally {
        setIsApiLoading(false);
      }
    }, COMPATIBILITY_DEBOUNCE_MS);

    return () => {
      if (apiTimerRef.current) clearTimeout(apiTimerRef.current);
    };
  }, [selectedComponents]);

  // --- FPS API: debounced call when both CPU and GPU are selected ---

  const ramProduct = selectedComponents.ram[0]?.product ?? null;

  useEffect(() => {
    const cpuId = selectedComponents.cpu?.product.id;
    const gpuId = selectedComponents.gpu?.product.id;

    if (!cpuId || !gpuId) {
      setApiFpsData(null);
      return;
    }

    const ramCapacity = (ramProduct?.specifications?.capacity as number) ?? undefined;
    const ramFrequency = (ramProduct?.specifications?.frequency as number) ?? undefined;

    if (fpsTimerRef.current) clearTimeout(fpsTimerRef.current);
    fpsTimerRef.current = setTimeout(async () => {
      try {
        const fpsResult = await calculateFpsApi({
          cpuId,
          gpuId,
          ramCapacity,
          ramFrequency,
        });
        console.log('FPS API response:', fpsResult);
        setApiFpsData(fpsResult);
      } catch (error) {
        console.error('FPS API error:', error);
        setApiFpsData(null);
      }
    }, FPS_DEBOUNCE_MS);

    return () => {
      if (fpsTimerRef.current) clearTimeout(fpsTimerRef.current);
    };
  }, [selectedComponents.cpu, selectedComponents.gpu, ramProduct]);

  const addItemToCart = useCartStore((s) => s.addItem);

  const selectComponent = useCallback(
    (type: PCComponentType, product: Product, options?: SelectComponentOptions) => {
      const idx = options?.multiIndex;
      setSelectedComponents((prev) => {
        const next: PCBuilderSelectedState = {
          cpu: prev.cpu,
          gpu: prev.gpu,
          motherboard: prev.motherboard,
          psu: prev.psu,
          case: prev.case,
          cooling: prev.cooling,
          ram: [...prev.ram],
          storage: [...prev.storage],
          fan: [...prev.fan],
          monitor: prev.monitor,
          keyboard: prev.keyboard,
          mouse: prev.mouse,
          headphones: prev.headphones,
        };
        const sc: SelectedComponent = { product, type };

        if (type === 'ram') {
          // Single-slot + qty: always one product, user controls quantity via UI
          next.ram = [sc];
          return next;
        }
        if (type === 'storage') {
          if (idx !== undefined) {
            if (idx < next.storage.length) {
              next.storage[idx] = sc;
            } else if (idx === next.storage.length && next.storage.length < MAX_STORAGE_MODULES) {
              next.storage.push(sc);
            }
          } else if (next.storage.length < MAX_STORAGE_MODULES) {
            next.storage.push(sc);
          }
          return next;
        }
        if (type === 'fan') {
          // Single-slot + qty: always one product
          next.fan = [sc];
          return next;
        }

        (next as Record<string, unknown>)[type] = sc;
        return next;
      });
    },
    []
  );

  const duplicateModule = useCallback((type: 'ram' | 'storage' | 'fan') => {
    setSelectedComponents((prev) => {
      const arr = prev[type];
      if (arr.length === 0 || arr.length >= MAX_RAM_MODULES) return prev;
      const first = arr[0];
      if (!first) return prev;
      return { ...prev, [type]: [...arr, { ...first }] };
    });
  }, []);

  const removeComponent = useCallback((type: PCComponentType, multiIndex?: number) => {
    setSelectedComponents((prev) => {
      if (type === 'cpu') {
        return {
          cpu: undefined,
          motherboard: undefined,
          ram: [],
          cooling: undefined,
          // Fans are case-mounted and not CPU-dependent — preserve them
          fan: [...prev.fan],
          gpu: prev.gpu,
          storage: [...prev.storage],
          psu: prev.psu,
          case: prev.case,
        };
      }
      if (type === 'motherboard') {
        return { ...prev, motherboard: undefined, ram: [] };
      }
      if (type === 'ram') {
        if (multiIndex !== undefined) {
          const ram = [...prev.ram];
          ram.splice(multiIndex, 1);
          return { ...prev, ram };
        }
        return { ...prev, ram: [] };
      }
      if (type === 'storage') {
        if (multiIndex !== undefined) {
          const storage = [...prev.storage];
          storage.splice(multiIndex, 1);
          return { ...prev, storage };
        }
        return { ...prev, storage: [] };
      }
      if (type === 'fan') {
        if (multiIndex !== undefined) {
          const fan = [...prev.fan];
          fan.splice(multiIndex, 1);
          return { ...prev, fan };
        }
        return { ...prev, fan: [] };
      }
      const next = { ...prev };
      delete (next as Record<string, unknown>)[type];
      return next;
    });
  }, []);

  const resetBuild = useCallback(() => {
    setSelectedComponents(emptyPcBuilderState());
    clearLocalStorage();
  }, []);

  const clearBuild = resetBuild;

  const addToCart = useCallback(() => {
    const s = selectedComponents;
    const keys: (keyof PCBuilderSelectedState)[] = [
      'cpu',
      'gpu',
      'motherboard',
      'psu',
      'case',
      'cooling',
      'fan',
      'monitor',
      'keyboard',
      'mouse',
      'headphones',
    ];
    for (const key of keys) {
      const c = s[key];
      if (c && typeof c === 'object' && 'product' in c) {
        addItemToCart((c as SelectedComponent).product, 1);
      }
    }
    for (const r of s.ram) addItemToCart(r.product, 1);
    for (const st of s.storage) addItemToCart(st.product, 1);
    for (const f of s.fan) addItemToCart(f.product, 1);
  }, [selectedComponents, addItemToCart]);

  // Итоговый результат совместимости: API приоритетнее, локальная — мгновенный фоллбэк
  const compatibility: CompatibilityResult = useMemo(() => {
    if (apiResult) {
      const apiIssues = apiResult.result;
      const errors: string[] = apiIssues.issues
        .filter((i) => i.severity === 'Error')
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

  const recommendedPsu = useMemo(() => {
    if (apiResult?.recommendedPSU) return apiResult.recommendedPSU;
    const gpuRecommendedPsu = selectedComponents.gpu?.product?.specifications?.recommendedPsu as number | undefined;
    const calculated = Math.ceil(powerConsumption * 1.3);
    return gpuRecommendedPsu ? Math.max(calculated, gpuRecommendedPsu) : calculated;
  }, [apiResult, powerConsumption, selectedComponents.gpu]);

  const selectedCount = countSelectedCategories(selectedComponents);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveToLocalStorage(selectedComponents);
  }, [selectedComponents]);

  const getSlotState = useCallback(
    (type: PCComponentType, multiIndex?: number): ComponentCompatibility => {
      return getComponentState(type, multiIndex, selectedComponents, compatibility);
    },
    [selectedComponents, compatibility]
  );

  const checkCompatibility = useCallback(() => {
    return checkBuildCompatibility(selectedComponents);
  }, [selectedComponents]);

  // Dynamic RAM slot limit based on selected motherboard
  const maxRamModules = useMemo(() => {
    if (selectedComponents.motherboard) {
      return extractMbRamSlots(selectedComponents.motherboard.product.specifications);
    }
    return MAX_RAM_MODULES;
  }, [selectedComponents.motherboard]);

  // Max quantity of RAM *units* that fit in MB slots (accounting for modules per unit)
  const maxRamQty = useMemo(() => {
    if (selectedComponents.ram.length > 0) {
      const modulesPerUnit = extractModulesCount(selectedComponents.ram[0]?.product.specifications);
      return Math.min(MAX_RAM_MODULES, Math.floor(maxRamModules / Math.max(1, modulesPerUnit)));
    }
    return MAX_RAM_MODULES;
  }, [selectedComponents.ram.length, maxRamModules]);

  // Trim excess RAM modules if motherboard is swapped to one with fewer slots
  useEffect(() => {
    if (selectedComponents.ram.length > maxRamModules) {
      setSelectedComponents((prev) => ({
        ...prev,
        ram: prev.ram.slice(0, maxRamModules),
      }));
    }
  }, [maxRamModules]);

  return {
    selectedComponents,
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
    selectComponent,
    duplicateModule,
    removeComponent,
    resetBuild,
    clearBuild,
    addToCart,
    getSlotState,
    checkCompatibility,
    isCompatible: compatibility.isCompatible,
    maxRamModules,
    maxRamQty,
    maxStorageModules: MAX_STORAGE_MODULES,
    maxFanModules: MAX_FAN_MODULES,
  };
}

export const PC_BUILDER_SLOTS: { key: PCComponentType; label: string; description: string }[] = [
  { key: 'cpu', label: 'Процессор', description: 'Мозг компьютера. Отвечает за все вычисления. Важные параметры: количество ядер, частота, TDP (тепловыделение).' },
  { key: 'motherboard', label: 'Материнская плата', description: 'Соединяет все компоненты вместе. Определяет сокет процессора, чипсет и доступные слоты расширения.' },
  { key: 'ram', label: 'Оперативная память', description: 'Быстрая память для временных данных. Объём и тайминги (задержки) влияют на отзывчивость системы.' },
  { key: 'storage', label: 'Накопитель', description: 'Хранит операционную систему, программы и файлы. SSD быстрее HDD.' },
  { key: 'psu', label: 'Блок питания', description: 'Поставляет электричество всем компонентам. Мощность (Вт) должна покрывать потребление сборки.' },
  { key: 'case', label: 'Корпус', description: 'Определяет форм-фактор (размер) сборки: ATX, Micro-ATX или Mini-ITX. Влияет на охлаждение и расширяемость.' },
  { key: 'fan', label: 'Вентилятор', description: 'Корпусной вентилятор для охлаждения. Можно установить несколько.' },
  { key: 'cooling', label: 'Охлаждение', description: 'Отводит тепло от процессора. Бывает воздушным или жидкостным.' },
  { key: 'gpu', label: 'Видеокарта', description: 'Отвечает за вывод изображения и 3D-графику. Ключевая для игр и работы с графикой.' },
  { key: 'monitor', label: 'Монитор', description: 'Устройство вывода изображения. Диагональ, разрешение и частота обновления влияют на комфорт.' },
  { key: 'keyboard', label: 'Клавиатура', description: 'Основное устройство ввода. Механические клавиатуры обеспечивают лучшую тактильность.' },
  { key: 'mouse', label: 'Мышь', description: 'Основное устройство навигации. DPI и частота опроса влияют на точность.' },
  { key: 'headphones', label: 'Наушники', description: 'Устройство воспроизведения звука. Качество драйверов и шумоподавление важны.' },
];
