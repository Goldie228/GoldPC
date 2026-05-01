/**
 * Slot Helper Functions
 * Pure functions for computing slot states and category counts
 * Extracted from usePCBuilder.ts for better organization
 */

import type {
  PCComponentType,
  ComponentCompatibility,
  CompatibilityResult,
  PCBuilderSelectedState,
} from './types';

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