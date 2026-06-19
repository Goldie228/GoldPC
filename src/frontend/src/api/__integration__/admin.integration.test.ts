/**
 * Integration tests for Admin API module.
 *
 * These tests hit the REAL backend (no mocks).
 * Only READ operations — no destructive changes.
 * Backend must be running at http://localhost:5000
 */

import {
  usersAdminApi,
  catalogAdminApi,
  statsApi,
  settingsApi,
  dictionariesApi,
} from '@/api/admin';
import {
  assertBackendAlive,
  loginAs,
  setAuthToken,
  clearAuthToken,
  unwrap,
} from '@/api/__integration__/setup';

beforeAll(async () => {
  await assertBackendAlive();
  const { accessToken } = await loginAs('admin');
  setAuthToken(accessToken);
});

afterAll(() => {
  clearAuthToken();
});

// ═══════════════════════════════════════════════
//  Users Admin API
// ═══════════════════════════════════════════════

describe('usersAdminApi', () => {
  it('getUsers returns paginated users list', async () => {
    const result = await usersAdminApi.getUsers({ page: 1, pageSize: 10 });

    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
  });

  it('getUsers with search filter works', async () => {
    const result = await usersAdminApi.getUsers({ search: 'admin' });

    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    // Should find at least the admin user
    expect(result.data.length).toBeGreaterThan(0);

    const emails = result.data.map((u) => u.email.toLowerCase());
    expect(emails.some((e) => e.includes('admin'))).toBe(true);
  });
});

// ═══════════════════════════════════════════════
//  Catalog Admin API
// ═══════════════════════════════════════════════

describe('catalogAdminApi', () => {
  it('getProducts returns admin product list', async () => {
    const result = await catalogAdminApi.getProducts({ page: 1, pageSize: 10 });

    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);

    // Verify product structure
    const product = result.data[0];
    expect(product.id).toBeDefined();
    expect(product.name).toBeDefined();
  });
});

// ═══════════════════════════════════════════════
//  Stats API
// ═══════════════════════════════════════════════

describe('statsApi', () => {
  it('getStats returns dashboard stats', async () => {
    const result = await statsApi.getStats();

    expect(result).toBeDefined();
    const stats = result.stats;
    expect(stats).toBeDefined();
    expect(typeof stats.totalUsers).toBe('number');
    expect(typeof stats.totalOrders).toBe('number');
    expect(typeof stats.revenue).toBe('number');
    expect(result.lastUpdated).toBeDefined();
  });
});

// ═══════════════════════════════════════════════
//  Settings API
// ═══════════════════════════════════════════════

describe('settingsApi', () => {
  it('getSettings returns site settings', async () => {
    const result = await settingsApi.getSettings();

    expect(result).toBeDefined();
    expect(result.general).toBeDefined();
    expect(typeof result.general.siteName).toBe('string');
    expect(result.delivery).toBeDefined();
    expect(typeof result.delivery.freeShippingThreshold).toBe('number');
    expect(result.maintenance).toBeDefined();
    expect(typeof result.maintenance.isMaintenanceMode).toBe('boolean');
  });
});

// ═══════════════════════════════════════════════
//  Dictionaries API
// ═══════════════════════════════════════════════

describe('dictionariesApi', () => {
  it('getCategories returns categories list', async () => {
    const result = await dictionariesApi.getCategories();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    const category = result[0];
    expect(category.id).toBeDefined();
    expect(category.name).toBeDefined();
  });

  it('getManufacturers returns manufacturers list', async () => {
    const result = await dictionariesApi.getManufacturers();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    const manufacturer = result[0];
    expect(manufacturer.id).toBeDefined();
    expect(manufacturer.name).toBeDefined();
  });
});
