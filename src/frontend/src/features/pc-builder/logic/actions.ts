/**
 * Action Handlers
 * Pure state transformations for PC builder actions
 * Extracted from usePCBuilder.ts for better organization
 */

import type { Product } from '@/api/types';
import type {
  PCComponentType,
  PCBuilderSelectedState,
  SelectedComponent,
  SelectComponentOptions,
} from './types';
import {
  MAX_RAM_MODULES,
  MAX_STORAGE_MODULES,
  emptyPcBuilderState,
} from './constants';

export function selectComponent(
  prevState: PCBuilderSelectedState,
  type: PCComponentType,
  product: Product,
  options?: SelectComponentOptions
): PCBuilderSelectedState {
  const idx = options?.multiIndex;
  const next: PCBuilderSelectedState = {
    cpu: prevState.cpu,
    gpu: prevState.gpu,
    motherboard: prevState.motherboard,
    psu: prevState.psu,
    case: prevState.case,
    cooling: prevState.cooling,
    ram: [...prevState.ram],
    storage: [...prevState.storage],
    fan: [...prevState.fan],
    monitor: prevState.monitor,
    keyboard: prevState.keyboard,
    mouse: prevState.mouse,
    headphones: prevState.headphones,
  };
  const sc: SelectedComponent = { product, type };

  if (type === 'ram') {
    if (idx !== undefined) {
      if (idx < next.ram.length) {
        next.ram[idx] = sc;
      } else if (idx === next.ram.length && next.ram.length < MAX_RAM_MODULES) {
        next.ram.push(sc);
      }
    } else if (next.ram.length < MAX_RAM_MODULES) {
      next.ram.push(sc);
    }
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
    next.fan = [sc];
    return next;
  }

  // For single-component types, assign directly with proper typing
  const nextRecord = next as unknown as Record<string, unknown>;
  nextRecord[type] = sc;
  return next;
}

export function duplicateModule(
  prevState: PCBuilderSelectedState,
  type: 'ram' | 'storage' | 'fan'
): PCBuilderSelectedState {
  const arr = prevState[type];
  const maxModules = type === 'storage' ? MAX_STORAGE_MODULES : type === 'ram' ? MAX_RAM_MODULES : Infinity;
  if (arr.length === 0 || arr.length >= maxModules) return prevState;
  const first = arr[0];
  if (first == null) return prevState;
  return { ...prevState, [type]: [...arr, { ...first }] };
}

export function removeComponent(
  prevState: PCBuilderSelectedState,
  type: PCComponentType,
  multiIndex?: number
): PCBuilderSelectedState {
  if (type === 'cpu') {
    return {
      ...prevState,
      cpu: undefined,
      motherboard: undefined,
      ram: [],
      cooling: undefined,
    };
  }
  if (type === 'motherboard') {
    return { ...prevState, motherboard: undefined, ram: [] };
  }
  if (type === 'ram') {
    if (multiIndex !== undefined) {
      const ram = [...prevState.ram];
      ram.splice(multiIndex, 1);
      return { ...prevState, ram };
    }
    return { ...prevState, ram: [] };
  }
  if (type === 'storage') {
    if (multiIndex !== undefined) {
      const storage = [...prevState.storage];
      storage.splice(multiIndex, 1);
      return { ...prevState, storage };
    }
    return { ...prevState, storage: [] };
  }
  if (type === 'fan') {
    if (multiIndex !== undefined) {
      const fan = [...prevState.fan];
      fan.splice(multiIndex, 1);
      return { ...prevState, fan };
    }
    return { ...prevState, fan: [] };
  }
  const next = { ...prevState };
  delete (next as Record<string, unknown>)[type];
  return next;
}

export function resetBuild(): PCBuilderSelectedState {
  return emptyPcBuilderState();
}

export function addToCart(
  selectedComponents: PCBuilderSelectedState,
  addItemToCart: (product: Product, quantity: number) => void
): void {
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
    if (c != null && typeof c === 'object' && 'product' in c) {
      addItemToCart((c).product, 1);
    }
  }
  for (const r of s.ram) addItemToCart(r.product, 1);
  for (const st of s.storage) addItemToCart(st.product, 1);
  for (const f of s.fan) addItemToCart(f.product, 1);
}