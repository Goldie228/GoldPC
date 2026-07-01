/**
 * Action Handlers
 * Pure state transformations for PC builder actions
 * Extracted from usePCBuilder.ts for better organization
 */

import type { Product } from '@/api/types';
import type { BundleComponent } from '@/store/cartStore';
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

export function addToCartAsAssembly(
  selectedComponents: PCBuilderSelectedState,
  addBundleItem: (bundle: {
    name: string;
    pcConfigurationId: string;
    assemblyFee: number;
    totalPrice: number;
    components: BundleComponent[];
  }) => void,
  totalPrice: number,
  configurationId?: string
): void {
  const s = selectedComponents;
  const components: BundleComponent[] = [];

  const keys: (keyof PCBuilderSelectedState)[] = [
    'cpu', 'gpu', 'motherboard', 'psu', 'case', 'cooling',
    'monitor', 'keyboard', 'mouse', 'headphones',
  ];

  for (const key of keys) {
    const c = s[key];
    if (c != null && typeof c === 'object' && 'product' in c) {
      const p = (c as { product: Product }).product;
      components.push({
        productId: p.id,
        productName: p.name,
        category: p.category,
        price: p.price,
        quantity: 1,
        imageUrl: p.mainImage?.url,
      });
    }
  }

  for (const r of s.ram) {
    components.push({
      productId: r.product.id,
      productName: r.product.name,
      category: r.product.category,
      price: r.product.price,
      quantity: 1,
      imageUrl: r.product.mainImage?.url,
    });
  }

  for (const st of s.storage) {
    components.push({
      productId: st.product.id,
      productName: st.product.name,
      category: st.product.category,
      price: st.product.price,
      quantity: 1,
      imageUrl: st.product.mainImage?.url,
    });
  }

  for (const f of s.fan) {
    components.push({
      productId: f.product.id,
      productName: f.product.name,
      category: f.product.category,
      price: f.product.price,
      quantity: 1,
      imageUrl: f.product.mainImage?.url,
    });
  }

  // KNOWN TRADE-OFF: Hardcoded assembly fee of 100 BYN.
  //
  // The correct source of truth is ServiceType.BasePrice (fetched via API), but
  // addToCartAsAssembly is a pure synchronous helper called deep inside a Zustand
  // store action. Making it async would require:
  //   1. Changing addToCartAsAssembly to return a Promise
  //   2. Updating all callers to await it (PCBuilderPage handleAddAsAssembly,
  //      the entire cartStore.addBundleItem path, etc.)
  //   3. Adding loading/error states for what is currently an instant operation
  //
  // Until a dedicated "get assembly fee" API call is wired in higher up (e.g. the
  // PCBuilderPage component fetches it and passes it down), this constant is the
  // pragmatic compromise. To update the fee: change this constant and rebuild.
  const assemblyFee = 100;

  addBundleItem({
    name: `Сборка ПК (${components.length} комплектующих)`,
    pcConfigurationId: configurationId || crypto.randomUUID(),
    assemblyFee,
    totalPrice: totalPrice + assemblyFee,
    components,
  });
}