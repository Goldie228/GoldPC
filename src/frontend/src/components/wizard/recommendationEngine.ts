/**
 * Recommendation Engine for Build Wizard
 *
 * Fetches products from the catalog API and selects the best component
 * for each category based on purpose, budget, and brand preferences.
 */

import { catalogApi } from '@/api/catalog';
import type { Product, ProductCategory } from '@/api/types';
import type { Purpose, Budget, CpuBrand, Resolution, BuildTemplate } from './types';
import { getTemplate } from './types';

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
  resolution: Resolution;
}

const COMPONENT_CATEGORIES: ProductCategory[] = [
  'cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooling',
];

/** Order of priority — GPU/CPU first for gaming, CPU first for office/workstation */
function getFetchOrder(purpose: Purpose): ProductCategory[] {
  switch (purpose) {
    case 'gaming':
      return ['gpu', 'cpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooling'];
    case 'office':
      return ['cpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooling', 'gpu'];
    case 'workstation':
      return ['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooling'];
  }
}

function matchesBrandFilter(product: Product, brand: CpuBrand): boolean {
  if (brand === 'any') return true;
  const p = product.brand?.toLowerCase() ?? '';
  const name = product.name.toLowerCase();
  if (brand === 'intel') {
    return p.includes('intel') || name.includes('intel') || name.includes('core i');
  }
  if (brand === 'amd') {
    return p.includes('amd') || name.includes('amd') || name.includes('ryzen');
  }
  return true;
}

function matchesGpuBrandFilter(product: Product, cpuBrand: CpuBrand): boolean {
  // For GPU, we don't filter by CPU brand, but we can prefer matching ecosystem
  return true;
}

/**
 * Pick the best product within a price range.
 * Prefers products closest to the upper bound of the budget (spend more for better quality).
 */
function pickBest(
  products: Product[],
  minPrice: number,
  maxPrice: number,
): Product | null {
  const candidates = products.filter(
    (p) => p.price >= minPrice && p.price <= maxPrice && p.stock > 0,
  );
  if (candidates.length === 0) {
    // Fallback: try products just above maxPrice
    const above = products
      .filter((p) => p.price > maxPrice && p.stock > 0)
      .sort((a, b) => a.price - b.price);
    if (above.length > 0) return above[0];
    // Fallback: try products just below minPrice
    const below = products
      .filter((p) => p.price < minPrice && p.stock > 0)
      .sort((a, b) => b.price - a.price);
    if (below.length > 0) return below[0];
    return null;
  }
  // Prefer products near 70% of range (good balance)
  const target = minPrice + (maxPrice - minPrice) * 0.7;
  candidates.sort((a, b) => {
    const distA = Math.abs(a.price - target);
    const distB = Math.abs(b.price - target);
    return distA - distB;
  });
  return candidates[0];
}

/**
 * Main recommendation function.
 * Fetches products from the catalog and builds a recommended configuration.
 */
export async function buildRecommendation(
  purpose: Purpose,
  budget: Budget,
  cpuBrand: CpuBrand,
  resolution: Resolution,
  onProgress?: (step: number, total: number, category: string) => void,
): Promise<RecommendedBuild> {
  const template = getTemplate(purpose, budget);
  const order = getFetchOrder(purpose);
  const results: Record<string, Product | null> = {};

  // Adjust template based on resolution for gaming
  if (purpose === 'gaming' && resolution === '4k') {
    template.gpu.maxPrice = Math.round(template.gpu.maxPrice * 1.4);
    template.gpu.minPrice = Math.round(template.gpu.minPrice * 1.2);
  } else if (purpose === 'gaming' && resolution === '1080p') {
    template.gpu.maxPrice = Math.round(template.gpu.maxPrice * 0.7);
    template.gpu.minPrice = Math.round(template.gpu.minPrice * 0.8);
  }

  // Fetch products for each category in priority order
  for (let i = 0; i < order.length; i++) {
    const category = order[i];
    onProgress?.(i + 1, order.length, category);

    try {
      const response = await catalogApi.getProducts({
        category,
        pageSize: 100,
        sortBy: 'price',
        sortOrder: 'asc',
        inStock: true,
      });

      let products = response.data;

      // Apply brand filter for CPU
      if (category === 'cpu') {
        products = products.filter((p) => matchesBrandFilter(p, cpuBrand));
      }

      // Pick best product within template price range
      const tmpl = template[category as keyof BuildTemplate];
      if (tmpl && 'minPrice' in tmpl) {
        results[category] = pickBest(products, tmpl.minPrice, tmpl.maxPrice);
      }
    } catch {
      // If fetch fails, leave as null
      results[category] = null;
    }
  }

  // Ensure motherboard is compatible with CPU socket
  if (results.cpu && results.motherboard) {
    const cpuSocket = results.cpu.socket ?? '';
    const mbSocket = results.motherboard.socket ?? '';
    if (cpuSocket && mbSocket && cpuSocket !== mbSocket) {
      // Try to find a compatible motherboard
      try {
        const mbResponse = await catalogApi.getProducts({
          category: 'motherboard',
          pageSize: 100,
          sortBy: 'price',
          sortOrder: 'asc',
          inStock: true,
        });
        const compatible = mbResponse.data.filter((p) => {
          const s = p.socket ?? '';
          return s === cpuSocket;
        });
        const tmpl = template.motherboard;
        const fallback = pickBest(compatible, tmpl.minPrice, tmpl.maxPrice);
        if (fallback) {
          results.motherboard = fallback;
        }
      } catch {
        // Keep current motherboard
      }
    }
  }

  // Ensure RAM is compatible with motherboard memory type
  if (results.motherboard && results.ram) {
    const mbMemType = results.motherboard.memoryType ?? '';
    const ramType = results.ram.memoryType ?? '';
    if (mbMemType && ramType && mbMemType !== ramType) {
      try {
        const ramResponse = await catalogApi.getProducts({
          category: 'ram',
          pageSize: 100,
          sortBy: 'price',
          sortOrder: 'asc',
          inStock: true,
        });
        const compatible = ramResponse.data.filter((p) => {
          const t = p.memoryType ?? '';
          return t === mbMemType;
        });
        const tmpl = template.ram;
        const fallback = pickBest(compatible, tmpl.minPrice, tmpl.maxPrice);
        if (fallback) {
          results.ram = fallback;
        }
      } catch {
        // Keep current RAM
      }
    }
  }

  const totalPrice = COMPONENT_CATEGORIES.reduce((sum, cat) => {
    return sum + (results[cat]?.price ?? 0);
  }, 0);

  return {
    cpu: results.cpu ?? null,
    gpu: results.gpu ?? null,
    motherboard: results.motherboard ?? null,
    ram: results.ram ?? null,
    storage: results.storage ?? null,
    psu: results.psu ?? null,
    case: results.case ?? null,
    cooling: results.cooling ?? null,
    totalPrice,
    purpose,
    budget,
    resolution,
  };
}
