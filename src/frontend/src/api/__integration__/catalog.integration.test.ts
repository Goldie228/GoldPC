/**
 * Integration tests for the Catalog API module.
 *
 * These tests hit the REAL backend gateway at http://localhost:5000.
 * All endpoints are PUBLIC (no auth required).
 *
 * Run: npx vitest run --config vitest.integration.config.ts src/api/__integration__/catalog.integration.test.ts
 */

import { catalogApi } from '@/api/catalog';
import { assertBackendAlive, unwrap } from '@/api/__integration__/setup';

beforeAll(async () => {
  await assertBackendAlive();
});

// ═══════════════════════════════════════════════
//  getProducts — paginated list
// ═══════════════════════════════════════════════

describe('catalogApi.getProducts', () => {
  it('returns paginated products with data array and meta', async () => {
    const res = await unwrap(catalogApi.getProducts());
    expect(res).toHaveProperty('data');
    expect(res).toHaveProperty('meta');
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.meta).toHaveProperty('total');
    expect(res.meta).toHaveProperty('page');
    expect(res.meta).toHaveProperty('pageSize');
  });

  it('filters by category', async () => {
    const res = await unwrap(catalogApi.getProducts({ category: 'cpu' }));
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
    for (const item of res.data) {
      expect(item.categorySlug).toBe('cpu');
    }
  });

  it('searches by keyword', async () => {
    const res = await unwrap(catalogApi.getProducts({ search: 'Intel' }));
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
  });

  it('sorts by price ascending', async () => {
    const res = await unwrap(
      catalogApi.getProducts({ sortBy: 'price', sortOrder: 'asc' }),
    );
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
    const prices = res.data.map((p) => p.price).filter(Boolean);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });
});

// ═══════════════════════════════════════════════
//  getProduct — single product by ID
// ═══════════════════════════════════════════════

describe('catalogApi.getProduct', () => {
  it('returns a single product by ID', async () => {
    const list = await unwrap(catalogApi.getProducts());
    expect(list.data.length).toBeGreaterThan(0);

    const firstId = list.data[0].id;
    const product = await unwrap(catalogApi.getProduct(firstId));

    expect(product).toHaveProperty('id', firstId);
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('price');
    expect(product).toHaveProperty('categorySlug');
  });
});

// ═══════════════════════════════════════════════
//  getCategories
// ═══════════════════════════════════════════════

describe('catalogApi.getCategories', () => {
  it('returns an array of categories', async () => {
    const categories = await unwrap(catalogApi.getCategories());
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(0);
    for (const cat of categories) {
      expect(cat).toHaveProperty('id');
      expect(cat).toHaveProperty('name');
      expect(cat).toHaveProperty('slug');
    }
  });
});

// ═══════════════════════════════════════════════
//  getManufacturers
// ═══════════════════════════════════════════════

describe('catalogApi.getManufacturers', () => {
  it('returns an array of manufacturers', async () => {
    const manufacturers = await unwrap(catalogApi.getManufacturers());
    expect(Array.isArray(manufacturers)).toBe(true);
    expect(manufacturers.length).toBeGreaterThan(0);
    for (const m of manufacturers) {
      expect(m).toHaveProperty('id');
      expect(m).toHaveProperty('name');
    }
  });
});

// ═══════════════════════════════════════════════
//  getFilterAttributes
// ═══════════════════════════════════════════════

describe('catalogApi.getFilterAttributes', () => {
  it('returns filter attributes for a given category', async () => {
    const attrs = await unwrap(catalogApi.getFilterAttributes('cpu'));
    expect(Array.isArray(attrs)).toBe(true);
    for (const a of attrs) {
      expect(a).toHaveProperty('key');
      expect(a).toHaveProperty('displayName');
      expect(a).toHaveProperty('filterType');
      expect(['select', 'range']).toContain(a.filterType);
    }
  });
});

// ═══════════════════════════════════════════════
//  searchProducts
// ═══════════════════════════════════════════════

describe('catalogApi.searchProducts', () => {
  it('returns results for a valid search query', async () => {
    const res = await unwrap(catalogApi.searchProducts('Intel'));
    expect(res).toHaveProperty('data');
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════
//  getFeaturedProducts
// ═══════════════════════════════════════════════

describe('catalogApi.getFeaturedProducts', () => {
  it('returns featured products', async () => {
    const products = await unwrap(catalogApi.getFeaturedProducts());
    expect(Array.isArray(products)).toBe(true);
    for (const p of products) {
      expect(p).toHaveProperty('id');
      expect(p).toHaveProperty('name');
      expect(p).toHaveProperty('price');
    }
  });
});
