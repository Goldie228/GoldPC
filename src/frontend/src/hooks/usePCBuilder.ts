/**
 * usePCBuilder - Хук для управления сборкой ПК
 * 
 * Features:
 * - Управление выбранными компонентами (Record<PCComponentType, SelectedComponent>)
 * - Проверка совместимости (CompatibilityService client-side)
 * - Расчет общей стоимости и энергопотребления (powerConsumption)
 * - Интеграция с корзиной (addToCart)
 * - LocalStorage автосохранение/восстановление
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Product, ProductSpecifications } from '../api/types';
import { useCartStore } from '../store/cartStore';

// === Типы ===

/** Типы компонентов для сборки ПК */
export type PCComponentType = 
  | 'cpu'
  | 'gpu'
  | 'motherboard'
  | 'ram'
  | 'storage'
  | 'psu'
  | 'case'
  | 'cooling';

/** Состояние слота компонента */
export type ComponentSlotState = 'empty' | 'selected' | 'incompatible';

/** Выбранный компонент */
export interface SelectedComponent {
  product: Product;
  type: PCComponentType;
}

/** Результат проверки совместимости */
export interface CompatibilityResult {
  isCompatible: boolean;
  errors: string[];
  warnings: string[];
}

/** Информация о совместимости для конкретного компонента */
export interface ComponentCompatibility {
  state: ComponentSlotState;
  warning?: string;
}

/** Сериализованная сборка для LocalStorage */
interface SerializedBuild {
  components: Record<string, { productId: string; product: Product; type: PCComponentType }>;
  savedAt: string;
}

// === Константы ===

/** Типы памяти */
const RAM_TYPES = ['DDR5', 'DDR4', 'DDR3'] as const;
type RAMType = typeof RAM_TYPES[number];

/** Общее количество слотов */
const TOTAL_SLOTS = 8;

/** Базовое энергопотребление системы (RAM, SSD, fans, etc.) */
const BASE_POWER_CONSUMPTION = 50;

/** Ключ LocalStorage */
const STORAGE_KEY = 'goldpc-pc-builder';

// === Вспомогательные функции ===

/**
 * Извлекает сокет из спецификаций продукта
 */
function extractSocket(specs: ProductSpecifications | undefined): string | null {
  if (!specs) return null;
  return (specs.socket as string) || (specs.cpuSocket as string) || null;
}

/**
 * Извлекает тип памяти из спецификаций
 */
function extractRAMType(specs: ProductSpecifications | undefined): RAMType | null {
  if (!specs) return null;
  const memoryType = specs.memoryType as string | undefined;
  if (memoryType && RAM_TYPES.includes(memoryType as RAMType)) {
    return memoryType as RAMType;
  }
  return null;
}

/**
 * Извлекает поддерживаемые сокеты из спецификаций охлаждения
 */
function extractSupportedSockets(specs: ProductSpecifications | undefined): string[] {
  if (!specs) return [];
  const sockets = specs.supportedSockets;
  if (Array.isArray(sockets)) {
    return sockets.filter((s): s is string => typeof s === 'string');
  }
  // Если указан один сокет
  const singleSocket = specs.socket as string | undefined;
  return singleSocket ? [singleSocket] : [];
}

/**
 * Извлекает TDP компонента
 */
function extractTDP(specs: ProductSpecifications | undefined): number {
  if (!specs) return 0;
  return (specs.tdp as number) || (specs.powerDraw as number) || 0;
}

// === CompatibilityService (client-side) ===

/**
 * Проверяет совместимость сборки
 */
function checkBuildCompatibility(
  components: Partial<Record<PCComponentType, SelectedComponent>>
): CompatibilityResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const cpu = components.cpu?.product;
  const motherboard = components.motherboard?.product;
  const ram = components.ram?.product;
  const cooling = components.cooling?.product;
  const gpu = components.gpu?.product;
  const psu = components.psu?.product;

  // 1. Проверка сокета CPU <-> Motherboard
  if (cpu && motherboard) {
    const cpuSocket = extractSocket(cpu.specifications);
    const mbSocket = extractSocket(motherboard.specifications);

    if (cpuSocket && mbSocket && cpuSocket !== mbSocket) {
      errors.push(
        `Сокет процессора (${cpuSocket}) не соответствует сокету материнской платы (${mbSocket})`
      );
    }
  }

  // 2. Проверка типа памяти RAM <-> Motherboard
  if (ram && motherboard) {
    const ramType = extractRAMType(ram.specifications);
    const mbMemoryType = extractRAMType(motherboard.specifications);

    if (ramType && mbMemoryType && ramType !== mbMemoryType) {
      errors.push(
        `Тип памяти (${ramType}) не поддерживается материнской платой (${mbMemoryType})`
      );
    }
  }

  // 3. Проверка совместимости охлаждения с сокетом
  if (cooling && cpu) {
    const cpuSocket = extractSocket(cpu.specifications);
    const supportedSockets = extractSupportedSockets(cooling.specifications);

    if (cpuSocket && supportedSockets.length > 0 && !supportedSockets.includes(cpuSocket)) {
      warnings.push(
        `Система охлаждения может не поддерживать сокет ${cpuSocket}`
      );
    }
  }

  // 4. Предупреждение о встроенной графике
  if (!gpu && cpu) {
    const hasIntegratedGraphics = cpu.specifications?.integratedGraphics as boolean;
    if (!hasIntegratedGraphics) {
      warnings.push('Не выбрана видеокарта, а процессор не имеет встроенной графики');
    }
  }

  // 5. Предупреждение о мощности БП
  if (psu && (cpu || gpu)) {
    const psuWattage = psu.specifications?.wattage as number | undefined;
    const cpuTdp = extractTDP(cpu?.specifications);
    const gpuTdp = extractTDP(gpu?.specifications);

    if (psuWattage) {
      const totalTdp = cpuTdp + gpuTdp + BASE_POWER_CONSUMPTION;
      const recommendedPsu = totalTdp * 1.3; // 30% запас

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

/**
 * Вычисляет общее энергопотребление сборки (Watts)
 */
function calculatePowerConsumption(
  components: Partial<Record<PCComponentType, SelectedComponent>>
): number {
  let total = BASE_POWER_CONSUMPTION;
  const cpu = components.cpu?.product;
  const gpu = components.gpu?.product;
  const storage = components.storage?.product;
  const cooling = components.cooling?.product;

  if (cpu) total += extractTDP(cpu.specifications);
  if (gpu) total += extractTDP(gpu.specifications);
  if (storage) total += extractTDP(storage.specifications) || 5;
  if (cooling) total += extractTDP(cooling.specifications) || 10;

  return total;
}

// === LocalStorage ===

function saveToLocalStorage(components: Partial<Record<PCComponentType, SelectedComponent>>): void {
  try {
    const serialized: SerializedBuild = {
      components: Object.fromEntries(
        Object.entries(components).map(([type, comp]) => [
          type,
          { productId: comp!.product.id, product: comp!.product, type: comp!.type },
        ])
      ),
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch { /* Silent fail */ }
}

function loadFromLocalStorage(): Partial<Record<PCComponentType, SelectedComponent>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: SerializedBuild = JSON.parse(raw);
    if (!parsed.components) return {};
    return Object.fromEntries(
      Object.entries(parsed.components).map(([type, comp]) => [
        type as PCComponentType,
        { product: comp.product, type: comp.type as PCComponentType },
      ])
    ) as Partial<Record<PCComponentType, SelectedComponent>>;
  } catch { return {}; }
}

function clearLocalStorage(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* Silent fail */ }
}

/**
 * Определяет состояние слота компонента
 */
function getComponentState(
  type: PCComponentType,
  components: Partial<Record<PCComponentType, SelectedComponent>>,
  compatibility: CompatibilityResult
): ComponentCompatibility {
  const component = components[type];
  
  if (!component) {
    return { state: 'empty' };
  }

  // Проверяем, связан ли этот компонент с ошибками
  const componentErrors = compatibility.errors.filter(error => {
    const errorLower = error.toLowerCase();
    const typeName = type === 'cpu' ? 'процессор' :
                     type === 'motherboard' ? 'материнск' :
                     type === 'ram' ? 'памят' :
                     type === 'cooling' ? 'охлажден' :
                     type === 'psu' ? 'блок питания' : '';
    return errorLower.includes(typeName);
  });

  if (componentErrors.length > 0) {
    return {
      state: 'incompatible',
      warning: componentErrors[0],
    };
  }

  // Проверяем предупреждения
  const componentWarnings = compatibility.warnings.filter(warning => {
    const warningLower = warning.toLowerCase();
    const typeName = type === 'cpu' ? 'процессор' :
                     type === 'motherboard' ? 'материнск' :
                     type === 'ram' ? 'памят' :
                     type === 'cooling' ? 'охлажден' :
                     type === 'gpu' ? 'видеокарт' :
                     type === 'psu' ? 'блок питания' : '';
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

// === Хук ===

export interface UsePCBuilderReturn {
  /** Выбранные компоненты */
  selectedComponents: Partial<Record<PCComponentType, SelectedComponent>>;
  /** Результат проверки совместимости */
  compatibility: CompatibilityResult;
  /** Общая стоимость */
  totalPrice: number;
  /** Общее энергопотребление (Watts) */
  powerConsumption: number;
  /** Количество выбранных компонентов */
  selectedCount: number;
  /** Общее количество слотов */
  totalCount: number;
  /** Выбрать компонент */
  selectComponent: (type: PCComponentType, product: Product) => void;
  /** Удалить компонент */
  removeComponent: (type: PCComponentType) => void;
  /** Сбросить сборку */
  resetBuild: () => void;
  /** Очистить всю сборку (deprecated) */
  clearBuild: () => void;
  /** Добавить все компоненты в корзину */
  addToCart: () => void;
  /** Получить состояние слота */
  getSlotState: (type: PCComponentType) => ComponentCompatibility;
  /** Проверить совместимость */
  checkCompatibility: () => CompatibilityResult;
  /** Совместима ли вся сборка */
  isCompatible: boolean;
}

export function usePCBuilder(): UsePCBuilderReturn {
  const [selectedComponents, setSelectedComponents] = 
    useState<Partial<Record<PCComponentType, SelectedComponent>>>(loadFromLocalStorage);

  const isFirstRender = useRef(true);

  const compatibility = useMemo(
    () => checkBuildCompatibility(selectedComponents),
    [selectedComponents]
  );

  const totalPrice = useMemo(() => {
    return Object.values(selectedComponents)
      .filter((c): c is SelectedComponent => c !== undefined)
      .reduce((sum, c) => sum + c.product.price, 0);
  }, [selectedComponents]);

  const powerConsumption = useMemo(
    () => calculatePowerConsumption(selectedComponents),
    [selectedComponents]
  );

  const selectedCount = Object.keys(selectedComponents).length;

  // Auto-save to LocalStorage
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveToLocalStorage(selectedComponents);
  }, [selectedComponents]);

  const addItemToCart = useCartStore((s) => s.addItem);

  const selectComponent = useCallback((type: PCComponentType, product: Product) => {
    setSelectedComponents(prev => ({ ...prev, [type]: { product, type } }));
  }, []);

  const removeComponent = useCallback((type: PCComponentType) => {
    setSelectedComponents(prev => { const next = { ...prev }; delete next[type]; return next; });
  }, []);

  const resetBuild = useCallback(() => {
    setSelectedComponents({});
    clearLocalStorage();
  }, []);

  const clearBuild = resetBuild;

  const addToCart = useCallback(() => {
    const comps = Object.values(selectedComponents).filter((c): c is SelectedComponent => c !== undefined);
    for (const comp of comps) {
      addItemToCart(comp.product, 1);
    }
  }, [selectedComponents, addItemToCart]);

  const getSlotState = useCallback((type: PCComponentType): ComponentCompatibility => {
    return getComponentState(type, selectedComponents, compatibility);
  }, [selectedComponents, compatibility]);

  const checkCompatibility = useCallback(() => {
    return checkBuildCompatibility(selectedComponents);
  }, [selectedComponents]);

  return {
    selectedComponents,
    compatibility,
    totalPrice,
    powerConsumption,
    selectedCount,
    totalCount: TOTAL_SLOTS,
    selectComponent,
    removeComponent,
    resetBuild,
    clearBuild,
    addToCart,
    getSlotState,
    checkCompatibility,
    isCompatible: compatibility.isCompatible,
  };
}

// === Экспорт констант для использования в компонентах ===

export const PC_BUILDER_SLOTS: { key: PCComponentType; label: string }[] = [
  { key: 'cpu', label: 'Процессор' },
  { key: 'gpu', label: 'Видеокарта' },
  { key: 'motherboard', label: 'Материнская плата' },
  { key: 'ram', label: 'Оперативная память' },
  { key: 'storage', label: 'Накопитель' },
  { key: 'psu', label: 'Блок питания' },
  { key: 'case', label: 'Корпус' },
  { key: 'cooling', label: 'Охлаждение' },
];