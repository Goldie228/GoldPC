/**
 * Recommendation Engine for Build Wizard
 *
 * Fetches products from the catalog API and selects the best component
 * for each category based on purpose, budget, brand preferences,
 * form factor, noise, RGB, and cooling preferences.
 */

import { catalogApi } from '@/api/catalog';
import type { Product, ProductCategory } from '@/api/types';
import type {
  Purpose, Budget, CpuPreference, GpuPreference,
  FormFactor, NoiseLevel, RgbPreference, CoolingPreference,
  WizardState,
} from './types';
import { BUDGET_RANGES } from './types';

export interface RecommendedBuild {
  cpu: Product | null;
  gpu: Product | null;
  motherboard: Product | null;
  ram: Product | null;
  storage: Product | null;
  psu: Product | null;
  case: Product | null;
  cooling: Product | null;
  totalPrice: number;
  purpose: Purpose;
  budget: Budget;
}

const COMPONENT_CATEGORIES: ProductCategory[] = [
  'cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooling',
];

/** Order of priority — GPU/CPU first for gaming, CPU first for office/workstation */
function getFetchOrder(purpose: Purpose): ProductCategory[] {
  switch (purpose) {
    case 'gaming':
    case 'streaming':
      return ['gpu', 'cpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooling'];
    case 'office':
    case 'home-theater':
      return ['cpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooling', 'gpu'];
    case 'workstation':
    case 'server':
      return ['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooling'];
  }
}

function matchesBrandFilter(product: Product, brand: CpuPreference | GpuPreference, type: 'cpu' | 'gpu'): boolean {
  if (brand === 'any') return true;
  const p = product.brand?.toLowerCase() ?? '';
  const name = product.name.toLowerCase();
  if (type === 'cpu') {
    if (brand === 'intel') return p.includes('intel') || name.includes('intel') || name.includes('core i');
    if (brand === 'amd') return p.includes('amd') || name.includes('amd') || name.includes('ryzen');
  }
  if (type === 'gpu') {
    if (brand === 'nvidia') return name.includes('nvidia') || name.includes('geforce') || name.includes('rtx') || name.includes('gtx');
    if (brand === 'amd') return name.includes('amd') || name.includes('radeon') || name.includes('rx');
  }
  return true;
}

/** Extract numeric price from product */
function getPrice(product: Product): number {
  return product.price ?? 0;
}

/** Check if product has specs with given name and value containing */
function specValue(product: Product, specName: string, values: string[]): boolean {
  if (!product.specificationValues?.length) return false;
  return product.specificationValues.some(
    sv => sv.specificationAttributeName?.toLowerCase() === specName.toLowerCase()
      && values.some(v => sv.value?.toLowerCase().includes(v.toLowerCase()))
  );
}

/** Check motherboard form factor */
function matchesFormFactor(product: Product, ff: FormFactor): boolean {
  if (ff === 'any') return true;
  const labels: Record<string, string[]> = {
    atx: ['atx'],
    'micro-atx': ['micro-atx', 'matx', 'micro atx', 'm-atx'],
    'mini-itx': ['mini-itx', 'mitx', 'mini itx', 'itx'],
  };
  return specValue(product, 'Форм-фактор', labels[ff] ?? []);
}

/** Check cooler type for cooling preference */
function matchesCoolingType(product: Product, pref: CoolingPreference, category: ProductCategory): boolean {
  if (pref === 'any') return true;
  if (category === 'cooling') {
    const aio = ['жидкостн', 'водян', 'aio', 'сvo', 'liquid'];
    const air = ['башенн', 'башенный', 'tower', 'воздушн'];
    const name = product.name.toLowerCase();
    if (pref === 'aio') return aio.some(v => name.includes(v));
    if (pref === 'air') return air.some(v => name.includes(v)) || !aio.some(v => name.includes(v));
  }
  return true;
}

/** Check noise level via specs or name heuristics */
function matchesNoiseLevel(product: Product, level: NoiseLevel): boolean {
  if (level === 'performance') return true;
  if (level === 'silent') {
    // Prefer products labeled quiet/silent or low RPM
    const name = product.name.toLowerCase();
    const quietHints = ['тихи', 'silent', 'quiet', 'low noise', 'шум', 'db', 'аэродинам'];
    if (quietHints.some(v => name.includes(v))) return true;
  }
  // balanced passes everything
  return true;
}

/** Check RGB preference */
function matchesRgb(product: Product, pref: RgbPreference): boolean {
  if (pref === 'none') {
    const name = product.name.toLowerCase();
    return !name.includes('rgb');
  }
  if (pref === 'full') {
    const name = product.name.toLowerCase();
    return name.includes('rgb');
  }
  return true;
}

/** Score product for preference matching (higher = better) */
function scoreProduct(product: Product, state: WizardState, category: ProductCategory): number {
  let score = 0;
  const name = product.name.toLowerCase();

  // Noise scoring
  if (state.noiseLevel === 'silent') {
    const quietHints = ['тихи', 'silent', 'quiet', 'low noise'];
    if (quietHints.some(v => name.includes(v))) score += 3;
  }

  // RGB scoring
  if (state.rgbPreference === 'full' && name.includes('rgb')) score += 2;
  if (state.rgbPreference === 'none' && !name.includes('rgb')) score += 1;

  // Cooling preference scoring
  if (state.coolingPreference === 'aio' && category === 'cooling') {
    const aio = ['жидкостн', 'водян', 'aio', 'liquid'];
    if (aio.some(v => name.includes(v))) score += 3;
  }
  if (state.coolingPreference === 'air' && category === 'cooling') {
    const air = ['башенн', 'tower'];
    if (air.some(v => name.includes(v))) score += 3;
  }

  // Price proximity to budget center
  const range = BUDGET_RANGES[state.budget!] ?? BUDGET_RANGES.optimal;
  const mid = (range.min + range.max) / 2;
  const price = getPrice(product);
  const dist = Math.abs(price - mid) / mid;
  if (dist < 0.3) score += 1;

  return score;
}

interface FetchProductsResult {
  byCategory: Record<ProductCategory, Product[]>;
  errors: string[];
}

/** Fetch products for all component categories */
async function fetchProductsForBuild(
  state: WizardState,
  signal?: AbortSignal,
): Promise<FetchProductsResult> {
  const order = getFetchOrder(state.purpose!);
  const byCategory = {} as Record<ProductCategory, Product[]>;
  const errors: string[] = [];

  for (const cat of order) {
    try {
      const res = await catalogApi.getProducts({
        categories: [cat],
        pageSize: 100,
        inStock: true,
        signal,
      });
      byCategory[cat] = res.items ?? [];
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') throw err;
      errors.push(`${cat}: ${err instanceof Error ? err.message : 'ошибка'}`);
      byCategory[cat] = [];
    }
  }

  return { byCategory, errors };
}

/** Get budget price range for a component category */
function getCategoryRange(state: WizardState, category: ProductCategory): { min: number; max: number } {
  const range = BUDGET_RANGES[state.budget!] ?? BUDGET_RANGES.optimal;
  const totalBudget = (range.min + range.max) / 2;
  const alloc = getPurposeAllocation(state.purpose!);
  const pct = alloc[category] ?? 0.1;
  const min = Math.floor(totalBudget * pct * 0.4);
  const max = Math.ceil(totalBudget * pct * 2.2);
  return { min, max };
}

function getPurposeAllocation(purpose: Purpose): Record<ProductCategory, number> {
  switch (purpose) {
    case 'gaming':
      return { gpu: 0.35, cpu: 0.22, motherboard: 0.12, ram: 0.08, storage: 0.06, psu: 0.06, case: 0.06, cooling: 0.05 };
    case 'office':
      return { cpu: 0.25, motherboard: 0.15, ram: 0.12, storage: 0.15, psu: 0.08, case: 0.12, cooling: 0.08, gpu: 0.05 };
    case 'workstation':
      return { cpu: 0.28, gpu: 0.25, ram: 0.15, motherboard: 0.12, storage: 0.08, psu: 0.05, case: 0.04, cooling: 0.03 };
    case 'streaming':
      return { cpu: 0.25, gpu: 0.28, ram: 0.12, motherboard: 0.1, storage: 0.08, psu: 0.07, case: 0.05, cooling: 0.05 };
    case 'home-theater':
      return { cpu: 0.15, gpu: 0.2, motherboard: 0.15, ram: 0.1, storage: 0.15, psu: 0.08, case: 0.1, cooling: 0.07 };
    case 'server':
      return { cpu: 0.25, motherboard: 0.2, ram: 0.2, storage: 0.15, psu: 0.1, case: 0.05, cooling: 0.05, gpu: 0 };
  }
}

function filterByFormFactor(products: Product[], ff: FormFactor, category: ProductCategory): Product[] {
  if (ff === 'any') return products;
  if (category === 'motherboard') return products.filter(p => matchesFormFactor(p, ff));
  if (category === 'case') {
    const labels: Record<string, string[]> = {
      atx: ['atx', 'midtower', 'mid-tower'],
      'micro-atx': ['micro-atx', 'matx', 'mini tower', 'micro'],
      'mini-itx': ['mini-itx', 'mitx', 'itx', 'sff', 'mini'],
    };
    const ffLabels = labels[ff] ?? [];
    return products.filter(p => {
      const name = p.name.toLowerCase();
      return ffLabels.some(v => name.includes(v));
    });
  }
  return products;
}

/** Pick best component from filtered products */
function pickBest(
  products: Product[],
  state: WizardState,
  category: ProductCategory,
): Product | null {
  const range = getCategoryRange(state, category);

  // Filter by form factor
  let filtered = filterByFormFactor(products, state.formFactor, category);

  // Filter by noise level
  filtered = filtered.filter(p => matchesNoiseLevel(p, state.noiseLevel));

  // Filter by RGB
  filtered = filtered.filter(p => matchesRgb(p, state.rgbPreference));

  // Filter by cooling type
  if (category === 'cooling' || category === 'case') {
    filtered = filtered.filter(p => matchesCoolingType(p, state.coolingPreference, category));
  }

  // Price filter — prefer within range, allow outside if nothing else
  let candidates = filtered.filter(p => {
    const price = getPrice(p);
    return price >= range.min && price <= range.max;
  });

  if (candidates.length === 0) {
    // Fallback: allow products just slightly outside range
    const tolerance = (range.max - range.min) * 0.3;
    candidates = filtered.filter(p => {
      const price = getPrice(p);
      return price >= range.min - tolerance && price <= range.max + tolerance;
    });
  }

  if (candidates.length === 0) return filtered.length > 0 ? filtered[0] : products[0] ?? null;

  // Score and pick best
  candidates.sort((a, b) => scoreProduct(b, state, category) - scoreProduct(a, state, category));
  return candidates[0] ?? null;
}

/** Validate CPU-Motherboard socket compatibility */
function validateCpuMb(cpu: Product | null, mb: Product | null): boolean {
  if (!cpu || !mb) return true;
  const cpuSpecs = cpu.specificationValues ?? [];
  const mbSpecs = mb.specificationValues ?? [];

  const getCpuSocket = () => cpuSpecs
    .find(s => s.specificationAttributeName?.toLowerCase() === 'сокет')
    ?.value ?? '';
  const getMbSocket = () => mbSpecs
    .find(s => s.specificationAttributeName?.toLowerCase() === 'сокет')
    ?.value ?? '';

  const cpuSocket = getCpuSocket().trim().toLowerCase();
  const mbSocket = getMbSocket().trim().toLowerCase();

  if (!cpuSocket || !mbSocket) return true;
  return cpuSocket === mbSocket;
}

export async function buildRecommendation(
  state: WizardState,
  signal?: AbortSignal,
  onProgress?: (current: number, total: number, category: string) => void,
): Promise<RecommendedBuild> {
  if (!state.purpose || !state.budget) {
    throw new Error('Необходимо выбрать назначение и бюджет');
  }

  const { byCategory } = await fetchProductsForBuild(state, signal);
  const result: RecommendedBuild = {
    cpu: null, gpu: null, motherboard: null, ram: null,
    storage: null, psu: null, case: null, cooling: null,
    totalPrice: 0, purpose: state.purpose, budget: state.budget,
  };

  const order = getFetchOrder(state.purpose);

  for (let i = 0; i < order.length; i++) {
    const cat = order[i];
    onProgress?.(i + 1, order.length, cat);

    const products = byCategory[cat] ?? [];

    if (cat === 'cpu') {
      const brandProducts = products.filter(p => matchesBrandFilter(p, state.cpuPreference, 'cpu'));
      result.cpu = pickBest(brandProducts.length > 0 ? brandProducts : products, state, cat);
    } else if (cat === 'gpu') {
      const brandProducts = products.filter(p => matchesBrandFilter(p, state.gpuPreference, 'gpu'));
      result.gpu = pickBest(brandProducts.length > 0 ? brandProducts : products, state, cat);
    } else if (cat === 'motherboard') {
      const cpuSocket = result.cpu?.specificationValues
        ?.find(s => s.specificationAttributeName?.toLowerCase() === 'сокет')
        ?.value?.trim();
      let mbProducts = products;
      if (cpuSocket) {
        mbProducts = products.filter(p => {
          const socket = p.specificationValues
            ?.find(s => s.specificationAttributeName?.toLowerCase() === 'сокет')
            ?.value?.trim();
          return !socket || socket === cpuSocket;
        });
      }
      result.motherboard = pickBest(mbProducts.length > 0 ? mbProducts : products, state, cat);
    } else if (cat === 'ram') {
      const memType = result.motherboard?.specificationValues
        ?.find(s => s.specificationAttributeName?.toLowerCase() === 'тип памяти')
        ?.value?.trim().toLowerCase();
      let ramProducts = products;
      if (memType) {
        ramProducts = products.filter(p => {
          const pType = p.specificationValues
            ?.find(s => s.specificationAttributeName?.toLowerCase() === 'тип памяти')
            ?.value?.trim().toLowerCase();
          return !pType || pType === memType;
        });
      }
      // Filter by minRam
      ramProducts = ramProducts.filter(p => {
        const capacity = p.specificationValues
          ?.find(s => s.specificationAttributeName?.toLowerCase() === 'общий объём')
          ?.value;
        if (!capacity) return true;
        const gb = parseInt(capacity.replace(/[^\d]/g, ''), 10);
        return !isNaN(gb) && gb >= state.minRam;
      });
      result.ram = pickBest(ramProducts.length > 0 ? ramProducts : products, state, cat);
    } else {
      result[cat] = pickBest(products, state, cat);
    }
  }

  // Validate CPU-MB socket
  if (!validateCpuMb(result.cpu, result.motherboard)) {
    const mbSocket = result.motherboard?.specificationValues
      ?.find(s => s.specificationAttributeName?.toLowerCase() === 'сокет')
      ?.value?.trim().toLowerCase();
    if (mbSocket) {
      const cpuSocketProducts = (byCategory.cpu ?? []).filter(p => {
        const socket = p.specificationValues
          ?.find(s => s.specificationAttributeName?.toLowerCase() === 'сокет')
          ?.value?.trim().toLowerCase();
        return socket === mbSocket;
      });
      if (cpuSocketProducts.length > 0) {
        const brandFiltered = cpuSocketProducts.filter(p => matchesBrandFilter(p, state.cpuPreference, 'cpu'));
        result.cpu = pickBest(brandFiltered.length > 0 ? brandFiltered : cpuSocketProducts, state, 'cpu');
      }
    }
  }

  result.totalPrice = (['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooling'] as const)
    .reduce((sum, cat) => sum + getPrice(result[cat]), 0);

  return result;
}
