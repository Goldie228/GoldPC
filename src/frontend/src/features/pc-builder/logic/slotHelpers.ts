/**
 * Slot Вспомогательный Functions
 * Pure functions for computing slot states and category counts
 * Extracted from usePCBuilder.ts for better organization
 */

import type {
  PCComponentType,
  ComponentCompatibility,
  CompatibilityResult,
  PCBuilderSelectedState,
} from './types';
import type { ComponentMap } from '@/shared/utils/compatibility/types';

export function getComponentState(
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
    // Ошибки совместимости генерируются на английском, ищем по ключевым словам
    const typeName =
      type === 'cpu'
        ? 'cpu'
        : type === 'motherboard'
          ? 'motherboard'
          : type === 'ram'
            ? 'ram'
          : type === 'cooling'
            ? 'cooler'
          : type === 'gpu'
            ? 'gpu'
          : type === 'psu'
            ? 'psu'
          : type === 'storage'
            ? 'storage'
          : null;

    return typeName ? errorLower.includes(typeName) : false;
  });

  if (componentErrors.length > 0) {
    return {
      state: 'incompatible',
      warning: componentErrors[0],
    };
  }

  const componentWarnings = compatibility.warnings.filter((warning) => {
    const warningLower = warning.toLowerCase();
    // Предупреждения тоже на английском, ищем по ключевым словам
    const typeName =
      type === 'cpu'
        ? 'cpu'
        : type === 'motherboard'
          ? 'motherboard'
          : type === 'ram'
            ? 'ram'
          : type === 'cooling'
            ? 'cooler'
          : type === 'gpu'
            ? 'gpu'
          : type === 'psu'
            ? 'psu'
          : type === 'storage'
            ? 'storage'
          : null;

    return typeName ? warningLower.includes(typeName) : false;
  });

  if (componentWarnings.length > 0 && type === 'psu') {
    return {
      state: 'incompatible',
      warning: componentWarnings[0],
    };
  }

  if (componentWarnings.length > 0 && type === 'cooling') {
    return {
      state: 'incompatible',
      warning: componentWarnings[0],
    };
  }

  return { state: 'selected' };
}

export function countSelectedCategories(c: PCBuilderSelectedState): number {
  let n =0;
  if (c.cpu != null) n++;
  if (c.gpu != null) n++;
  if (c.motherboard != null) n++;
  if (c.ram.length > 0) n++;
  if (c.storage.length > 0) n++;
  if (c.psu != null) n++;
  if (c.case != null) n++;
  if (c.cooling != null) n++;
  if (c.fan.length > 0) n++;
  if (c.monitor != null) n++;
  if (c.keyboard != null) n++;
  if (c.mouse != null) n++;
  if (c.headphones != null) n++;
  return n;
}

const PERIPHERY_KEYS: ReadonlyArray<keyof PCBuilderSelectedState> = [
  'fan',
  'monitor',
  'keyboard',
  'mouse',
  'headphones',
];

/**
 * Проверяет, что заполнены все обязательные слоты (без периферии).
 * Периферия (вентиляторы, монитор, клавиатура, мышь, наушники) — необязательна.
 */
export function hasAllRequiredSlots(c: PCBuilderSelectedState): boolean {
  if (c.cpu == null) return false;
  if (c.gpu == null) return false;
  if (c.motherboard == null) return false;
  if (c.ram.length === 0) return false;
  if (c.storage.length === 0) return false;
  if (c.psu == null) return false;
  if (c.case == null) return false;
  if (c.cooling == null) return false;
  return true;
}

/** Количество обязательных слотов (для UI-подсчёта прогресса). */
export const REQUIRED_SLOTS_TOTAL = 8;

/** Список ключей периферии — экспортируется для UI-меток и группировки. */
export const PERIPHERY_SLOT_KEYS = PERIPHERY_KEYS;

/**
 * Строит ComponentMap from selected components state
 * Used for compatibility checks and power consumption calculations
 */
export function buildComponentMap(components: PCBuilderSelectedState): ComponentMap {
  return {
    cpu: components.cpu?.product ?? null,
    gpu: components.gpu?.product ?? null,
    motherboard: components.motherboard?.product ?? null,
    ram: components.ram[0]?.product ?? null,
    storage: components.storage.map(s => s.product),
    psu: components.psu?.product ?? null,
    case: components.case?.product ?? null,
    cooling: components.cooling?.product ?? null,
  };
}