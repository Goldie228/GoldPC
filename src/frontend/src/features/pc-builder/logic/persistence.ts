/**
 * LocalStorage Persistence Layer
 * Save/load/migrate PC builder state to localStorage
 * Extracted from usePCBuilder.ts for better organization
 */

import type {
  PCBuilderSelectedState,
  SerializedBuildV1,
  SerializedBuildV2,
  SerializedSingle,
  PCComponentType,
  SelectedComponent,
} from './types';
import {
  STORAGE_KEY,
  emptyPcBuilderState,
} from './constants';

export function isBuilderEmpty(c: PCBuilderSelectedState): boolean {
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

export function saveToLocalStorage(components: PCBuilderSelectedState): void {
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

export function migrateV1ToState(parsed: SerializedBuildV1): PCBuilderSelectedState {
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

export function loadFromLocalStorage(): PCBuilderSelectedState {
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

export function clearLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}