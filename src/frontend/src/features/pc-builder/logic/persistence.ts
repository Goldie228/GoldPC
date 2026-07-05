/**
 * Persistence Layer — localStorage + API backend
 * Save/load/migrate PC builder state to localStorage and sync with backend API.
 * localStorage is the source of truth for the active build; the API persists
 * named configurations the user explicitly saves.
 */

import type {
  PCBuilderSelectedState,
  SerializedBuildV1,
  SerializedBuildV2,
  SerializedSingle,
  SelectedComponent,
} from './types';
import {
  STORAGE_KEY,
  emptyPcBuilderState,
} from './constants';
import { pcbuilderApi, type SavedBuild } from '@/api/pcbuilder';

/**
 * Runtime validation for deserialized build data.
 * Prevents corrupted localStorage data from crashing the app.
 */
function isValidSerializedBuild(data: unknown): data is SerializedBuildV2 | SerializedBuildV1 {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;

  // Must have 'v' field (version)
  if (typeof obj.v !== 'number') return false;

  // V2 requires 'components' object
  if (obj.v === 2) {
    if (!obj.components || typeof obj.components !== 'object') return false;
    const comps = obj.components as Record<string, unknown>;
    // At least validate that component entries have product and type
    for (const [, value] of Object.entries(comps)) {
      if (value == null) continue;
      if (!Array.isArray(value)) {
        // Single component: must have product and type
        if (typeof value !== 'object') return false;
        const entry = value as Record<string, unknown>;
        if (!entry.product || !entry.type) return false;
      } else {
        // Array component (ram, storage, fan): each item must have product and type
        for (const item of value) {
          if (item == null || typeof item !== 'object') return false;
          const entry = item as Record<string, unknown>;
          if (!entry.product || !entry.type) return false;
        }
      }
    }
    return true;
  }

  return false;
}

export function isBuilderEmpty(c: PCBuilderSelectedState): boolean {
  return (
    c.cpu == null &&
    c.gpu == null &&
    c.motherboard == null &&
    c.psu == null &&
    c.case == null &&
    c.cooling == null &&
    c.ram.length === 0 &&
    c.storage.length === 0 &&
    c.fan.length === 0 &&
    c.monitor == null &&
    c.keyboard == null &&
    c.mouse == null &&
    c.headphones == null
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
      if (comp != null && typeof comp === 'object' && 'product' in comp) {
        const sc = comp;
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
    if (raw == null || typeof raw !== 'object') continue;
    const entry = raw;
    const type = entry.type;
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

/** Normalize API category names to PCBuilder component types */
function normalizeCategory(category: string | undefined, fallback: string): string {
  const map: Record<string, string> = {
    processors: 'cpu', video_cards: 'gpu', motherboards: 'motherboard',
    memory: 'ram', storage_devices: 'storage', power_supplies: 'psu',
    cases: 'case', coolers: 'cooling',
  };
  return map[category ?? ''] ?? category ?? fallback;
}

/** Normalize a product's category field and extract direct fields extractors need */
function normalizeProduct(product: Record<string, unknown>, targetType: string): Record<string, unknown> {
  const result = { ...product, category: normalizeCategory(product.category as string, targetType) };
  // Ensure socket/memoryType direct fields exist (extractors check these first)
  const specs = result.specifications as Record<string, string> | undefined;
  if (specs && !result.socket && specs['socket']) result.socket = specs['socket'];
  if (specs && !result.memoryType && specs['memoryType']) result.memoryType = specs['memoryType'];
  // Fallback: extract from specificationValues array if specs dict is missing
  const specValues = result.specificationValues as Array<{ specificationAttributeName: string; value: string }> | undefined;
  if (specValues) {
    if (!result.memoryType) {
      const memSpec = specValues.find(sv => sv.specificationAttributeName === 'Тип памяти');
      if (memSpec) result.memoryType = memSpec.value;
    }
    if (!result.socket) {
      const sockSpec = specValues.find(sv => sv.specificationAttributeName === 'Сокет');
      if (sockSpec) result.socket = sockSpec.value;
    }
  }
  // Fallback: extract socket from description text
  if (!result.socket && typeof result.description === 'string') {
    const desc = result.description as string;
    const socketMatch = desc.match(/(?:Сокет|Socket)[:\s]+([A-Za-z0-9\s\-]+)/i);
    if (socketMatch) {
      result.socket = socketMatch[1].trim().split(/[\s\n]/)[0];
    }
  }
  // Fallback: extract socket from descriptionShort
  if (!result.socket && typeof result.descriptionShort === 'string') {
    const descShort = result.descriptionShort as string;
    const socketMatch = descShort.match(/(?:Сокет|Socket)[:\s]+([A-Za-z0-9\s\-]+)/i);
    if (socketMatch) {
      result.socket = socketMatch[1].trim().split(/[\s\n]/)[0];
    }
  }
  return result;
}

export function loadFromLocalStorage(): PCBuilderSelectedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyPcBuilderState();
    const parsed = JSON.parse(raw);

    // Runtime validation before type assertion
    if (!isValidSerializedBuild(parsed)) {
      clearLocalStorage();
      return emptyPcBuilderState();
    }

    if ('v' in parsed && parsed.v === 2 && parsed.components != null) {
      const c = parsed.components;
      return {
        cpu: c.cpu != null ? { product: normalizeProduct(c.cpu.product, 'cpu'), type: 'cpu' } : undefined,
        gpu: c.gpu != null ? { product: normalizeProduct(c.gpu.product, 'gpu'), type: 'gpu' } : undefined,
        motherboard: c.motherboard != null
          ? { product: normalizeProduct(c.motherboard.product, 'motherboard'), type: 'motherboard' }
          : undefined,
        psu: c.psu != null ? { product: normalizeProduct(c.psu.product, 'psu'), type: 'psu' } : undefined,
        case: c.case != null ? { product: normalizeProduct(c.case.product, 'case'), type: 'case' } : undefined,
        cooling: c.cooling != null ? { product: normalizeProduct(c.cooling.product, 'cooling'), type: 'cooling' } : undefined,
        ram: (c.ram ?? []).map((x) => ({ product: normalizeProduct(x.product, 'ram'), type: 'ram' as const })),
        storage: (c.storage ?? []).map((x) => ({
          product: normalizeProduct(x.product, 'storage'),
          type: 'storage' as const,
        })),
        fan: (c.fan ?? []).map((x) => ({ product: normalizeProduct(x.product, 'fan'), type: 'fan' as const })),
        monitor: c.monitor != null ? { product: c.monitor.product, type: 'monitor' } : undefined,
        keyboard: c.keyboard != null ? { product: c.keyboard.product, type: 'keyboard' } : undefined,
        mouse: c.mouse != null ? { product: c.mouse.product, type: 'mouse' } : undefined,
        headphones: c.headphones != null ? { product: c.headphones.product, type: 'headphones' } : undefined,
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

// ============================================================================
// API-backed persistence
// ============================================================================

/** Convert a single SelectedComponent to a product ID for the API. */
function componentToProductId(sc: SelectedComponent): string {
  return sc.product.id;
}

/** Build a components map from the current state for the API payload. */
function stateToComponentsMap(state: PCBuilderSelectedState): Record<string, string> {
  const map: Record<string, string> = {};
  if (state.cpu) map.cpu = componentToProductId(state.cpu);
  if (state.gpu) map.gpu = componentToProductId(state.gpu);
  if (state.motherboard) map.motherboard = componentToProductId(state.motherboard);
  if (state.psu) map.psu = componentToProductId(state.psu);
  if (state.case) map.case = componentToProductId(state.case);
  if (state.cooling) map.cooling = componentToProductId(state.cooling);
  if (state.monitor) map.monitor = componentToProductId(state.monitor);
  if (state.keyboard) map.keyboard = componentToProductId(state.keyboard);
  if (state.mouse) map.mouse = componentToProductId(state.mouse);
  if (state.headphones) map.headphones = componentToProductId(state.headphones);
  state.ram.forEach((sc, i) => { map[`ram_${i}`] = componentToProductId(sc); });
  state.storage.forEach((sc, i) => { map[`storage_${i}`] = componentToProductId(sc); });
  state.fan.forEach((sc, i) => { map[`fan_${i}`] = componentToProductId(sc); });
  return map;
}

/**
 * Save a named configuration to the backend API.
 * localStorage is already the source of truth for the active build;
 * this persists a snapshot the user explicitly saves.
 */
export async function saveConfigurationToApi(
  state: PCBuilderSelectedState,
  name: string,
  purpose?: string,
): Promise<SavedBuild | null> {
  try {
    const payload = {
      name,
      purpose: purpose ?? 'gaming',
      components: stateToComponentsMap(state),
    };
    return await pcbuilderApi.saveConfiguration(payload);
  } catch {
    return null;
  }
}

/**
 * Update an existing named configuration on the backend API.
 */
export async function updateConfigurationOnApi(
  id: string,
  state: PCBuilderSelectedState,
  name: string,
  purpose?: string,
): Promise<SavedBuild | null> {
  try {
    const payload = {
      name,
      purpose: purpose ?? 'gaming',
      components: stateToComponentsMap(state),
    };
    return await pcbuilderApi.updateConfiguration(id, payload);
  } catch {
    return null;
  }
}

/**
 * Load all saved configurations from the backend API.
 * Returns null on failure so callers can fall back to localStorage.
 */
export async function loadConfigurationsFromApi(): Promise<SavedBuild[] | null> {
  try {
    return await pcbuilderApi.getConfigurations();
  } catch {
    return null;
  }
}

/**
 * Delete a saved configuration from the backend API.
 */
export async function deleteConfigurationFromApi(id: string): Promise<boolean> {
  try {
    await pcbuilderApi.deleteConfiguration(id);
    return true;
  } catch {
    return false;
  }
}