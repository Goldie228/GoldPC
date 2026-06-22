import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the api client — vi.hoisted ensures these exist before vi.mock (which is hoisted)
const { mockGet, mockPost, mockPut, mockPatch, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
  mockPatch: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('./index', () => ({
  default: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    patch: mockPatch,
    delete: mockDelete,
  },
}));

// Mock the generated goldpcApi — functions that use orval-generated API
const mockGoldpcApi = vi.hoisted(() => ({
  getAuthAdminUsersId: vi.fn(),
  postAuthAdminUsersIdDeactivate: vi.fn(),
  postAuthAdminUsersIdActivate: vi.fn(),
  postAuthAdminUsers: vi.fn(),
  deleteAuthAdminUsersId: vi.fn(),
  getAdminProducts: vi.fn(),
  putAdminProductsProductId: vi.fn(),
  deleteAdminProductsProductId: vi.fn(),
  postAdminProducts: vi.fn(),
  getAdminProductsProductIdPriceHistory: vi.fn(),
  postAdminProductsGenerateName: vi.fn(),
  getAdminSpecificationsByCategoryCategoryId: vi.fn(),
  getAdminSpecificationsUniqueValuesCategoryId: vi.fn(),
  getApiInternalStubs: vi.fn(),
  patchApiInternalStubsName: vi.fn(),
}));

vi.mock('./generated/client', () => ({
  goldpcApi: mockGoldpcApi,
}));

import {
  usersAdminApi,
  catalogAdminApi,
  statsApi,
  settingsApi,
  dictionariesApi,
  imagesAdminApi,
  auditLogApi,
  stubApi,
} from './admin';

describe('api/admin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── usersAdminApi ────────────────────────────────────────────

  describe('usersAdminApi', () => {
    it('getUsers — sends GET /admin/users with params', async () => {
      const mockResponse = {
        data: {
          data: [{ id: '1', firstName: 'John', lastName: 'Doe' }],
          meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
        },
      };
      mockGet.mockResolvedValueOnce(mockResponse);

      const result = await usersAdminApi.getUsers({ page: 1, pageSize: 10, search: 'John' });

      expect(mockGet).toHaveBeenCalledWith('/admin/users', {
        params: { page: 1, pageSize: 10, search: 'John' },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('getUser — sends GET /admin/users/:id', async () => {
      const mockUser = { id: 'user-1', firstName: 'Jane', email: 'jane@test.com' };
      mockGet.mockResolvedValueOnce({ data: mockUser });

      const result = await usersAdminApi.getUser('user-1');

      expect(mockGet).toHaveBeenCalledWith('/admin/users/user-1');
      expect(result).toEqual(mockUser);
    });

    it('updateUser — sends PUT /admin/users/:id with data', async () => {
      const mockUser = { id: 'user-1', firstName: 'Updated' };
      mockPut.mockResolvedValueOnce({ data: mockUser });

      const result = await usersAdminApi.updateUser('user-1', { firstName: 'Updated' });

      expect(mockPut).toHaveBeenCalledWith('/admin/users/user-1', { firstName: 'Updated' });
      expect(result).toEqual(mockUser);
    });

    it('updateUserRole — sends PATCH /admin/users/:id/role', async () => {
      await usersAdminApi.updateUserRole('user-1', 'Admin');

      expect(mockPatch).toHaveBeenCalledWith('/admin/users/user-1/role', { role: 'Admin' });
    });

    it('deleteUser — sends DELETE /admin/users/:id', async () => {
      mockDelete.mockResolvedValueOnce({});

      await usersAdminApi.deleteUser('user-1');

      expect(mockDelete).toHaveBeenCalledWith('/admin/users/user-1');
    });

    it('createUser — sends POST /admin/users', async () => {
      const mockUser = { id: 'user-new', firstName: 'New' };
      mockPost.mockResolvedValueOnce({ data: mockUser });

      const result = await usersAdminApi.createUser({
        firstName: 'New',
        lastName: 'User',
        email: 'new@test.com',
        role: 'Client',
        password: 'pass123',
      });

      expect(mockPost).toHaveBeenCalledWith('/admin/users', {
        firstName: 'New',
        lastName: 'User',
        email: 'new@test.com',
        role: 'Client',
        password: 'pass123',
      });
      expect(result).toEqual(mockUser);
    });

    it('activateUser — sends POST /admin/users/:id/activate', async () => {
      mockPost.mockResolvedValueOnce({});

      await usersAdminApi.activateUser('user-1');

      expect(mockPost).toHaveBeenCalledWith('/admin/users/user-1/activate');
    });

    it('deactivateUser — sends POST /admin/users/:id/deactivate', async () => {
      mockPost.mockResolvedValueOnce({});

      await usersAdminApi.deactivateUser('user-1');

      expect(mockPost).toHaveBeenCalledWith('/admin/users/user-1/deactivate');
    });
  });

  // ─── catalogAdminApi ──────────────────────────────────────────

  describe('catalogAdminApi', () => {
    it('getProducts — sends GET /admin/products and normalizes Russian category names via goldpcApi', async () => {
      const mockResponse = {
        data: {
          data: [
            { id: 'p1', name: 'CPU 1', category: 'Процессоры' },
            { id: 'p2', name: 'GPU 1', category: 'Видеокарты' },
          ],
          meta: { page: 1, pageSize: 10, totalItems: 2, totalPages: 1 },
        },
      };
      mockGoldpcApi.getAdminProducts.mockResolvedValueOnce(mockResponse);

      const result = await catalogAdminApi.getProducts({ page: 1 });

      expect(mockGoldpcApi.getAdminProducts).toHaveBeenCalledWith({ page: 1 });
      expect(result.data[0].category).toBe('cpu');
      expect(result.data[1].category).toBe('gpu');
    });

    it('getProducts — maps frontend category slug to backend slug for filtering via goldpcApi', async () => {
      mockGoldpcApi.getAdminProducts.mockResolvedValueOnce({ data: { data: [], meta: {} } });

      await catalogAdminApi.getProducts({ category: 'cpu' });

      expect(mockGoldpcApi.getAdminProducts).toHaveBeenCalledWith({
        category: 'processors',
      });
    });

    it('getProducts — passes through unknown category as-is via goldpcApi', async () => {
      mockGoldpcApi.getAdminProducts.mockResolvedValueOnce({ data: { data: [], meta: {} } });

      await catalogAdminApi.getProducts({ category: 'unknown-category' });

      expect(mockGoldpcApi.getAdminProducts).toHaveBeenCalledWith({
        category: 'unknown-category',
      });
    });

    it('updateProduct — sends PUT /admin/products/:id via goldpcApi', async () => {
      const mockProduct = { id: 'p1', name: 'Updated Product' };
      mockGoldpcApi.putAdminProductsProductId.mockResolvedValueOnce({ data: mockProduct });

      const result = await catalogAdminApi.updateProduct('p1', { name: 'Updated Product' });

      expect(mockGoldpcApi.putAdminProductsProductId).toHaveBeenCalledWith('p1', { name: 'Updated Product' });
      expect(result).toEqual(mockProduct);
    });

    it('createProduct — sends POST /admin/products via goldpcApi', async () => {
      const mockProduct = { id: 'p-new', name: 'New Product' };
      mockGoldpcApi.postAdminProducts.mockResolvedValueOnce({ data: mockProduct });

      const result = await catalogAdminApi.createProduct({
        name: 'New Product',
        sku: 'SKU-001',
        category: 'cpu',
        price: 99.99,
        stock: 10,
      });

      expect(mockGoldpcApi.postAdminProducts).toHaveBeenCalledWith({
        name: 'New Product',
        sku: 'SKU-001',
        category: 'cpu',
        price: 99.99,
        stock: 10,
      });
      expect(result).toEqual(mockProduct);
    });

    it('deleteProduct — sends DELETE /admin/products/:id via goldpcApi', async () => {
      mockGoldpcApi.deleteAdminProductsProductId.mockResolvedValueOnce({});

      await catalogAdminApi.deleteProduct('p1');

      expect(mockGoldpcApi.deleteAdminProductsProductId).toHaveBeenCalledWith('p1');
    });

    it('getProductById — sends GET /admin/products/:id', async () => {
      const mockProduct = { id: 'p1', name: 'Product' };
      mockGet.mockResolvedValueOnce({ data: mockProduct });

      const result = await catalogAdminApi.getProductById('p1');

      expect(mockGet).toHaveBeenCalledWith('/admin/products/p1');
      expect(result).toEqual(mockProduct);
    });

    it('getPriceHistory — sends GET /admin/products/:id/price-history via goldpcApi', async () => {
      const mockHistory = [{ id: 'h1', price: 100, changedAt: '2025-01-01' }];
      mockGoldpcApi.getAdminProductsProductIdPriceHistory.mockResolvedValueOnce({ data: mockHistory });

      const result = await catalogAdminApi.getPriceHistory('p1');

      expect(mockGoldpcApi.getAdminProductsProductIdPriceHistory).toHaveBeenCalledWith('p1');
      expect(result).toEqual(mockHistory);
    });
  });

  // ─── statsApi ─────────────────────────────────────────────────

  describe('statsApi', () => {
    it('getStats — sends GET /admin/stats', async () => {
      const mockStats = {
        stats: { totalUsers: 100, totalOrders: 50, revenue: 10000 },
        lastUpdated: '2025-01-01T00:00:00Z',
      };
      mockGet.mockResolvedValueOnce({ data: mockStats });

      const result = await statsApi.getStats();

      expect(mockGet).toHaveBeenCalledWith('/admin/stats');
      expect(result).toEqual(mockStats);
    });
  });

  // ─── settingsApi ──────────────────────────────────────────────

  describe('settingsApi', () => {
    it('getSettings — sends GET /admin/settings', async () => {
      const mockSettings = { siteName: 'GoldPC', maintenanceMode: false };
      mockGet.mockResolvedValueOnce({ data: mockSettings });

      const result = await settingsApi.getSettings();

      expect(mockGet).toHaveBeenCalledWith('/admin/settings');
      expect(result).toEqual(mockSettings);
    });

    it('updateSettings — sends PUT /admin/settings', async () => {
      const mockSettings = { siteName: 'GoldPC Pro' };
      mockPut.mockResolvedValueOnce({ data: mockSettings });

      const result = await settingsApi.updateSettings({ siteName: 'GoldPC Pro' });

      expect(mockPut).toHaveBeenCalledWith('/admin/settings', { siteName: 'GoldPC Pro' });
      expect(result).toEqual(mockSettings);
    });
  });

  // ─── dictionariesApi ──────────────────────────────────────────

  describe('dictionariesApi', () => {
    it('getCategories — sends GET /admin/dictionaries/categories', async () => {
      const mockCategories = [{ id: 'c1', name: 'CPU', slug: 'cpu', isActive: true, productCount: 10 }];
      mockGet.mockResolvedValueOnce({ data: mockCategories });

      const result = await dictionariesApi.getCategories();

      expect(mockGet).toHaveBeenCalledWith('/admin/dictionaries/categories');
      expect(result).toEqual(mockCategories);
    });

    it('getManufacturers — sends GET /admin/dictionaries/manufacturers', async () => {
      const mockManufacturers = [{ id: 'm1', name: 'Intel', slug: 'intel', isActive: true, productCount: 5 }];
      mockGet.mockResolvedValueOnce({ data: mockManufacturers });

      const result = await dictionariesApi.getManufacturers();

      expect(mockGet).toHaveBeenCalledWith('/admin/dictionaries/manufacturers');
      expect(result).toEqual(mockManufacturers);
    });

    it('createItem — sends POST /admin/dictionaries/:type', async () => {
      const mockItem = { id: 'new-1', name: 'New Cat', slug: 'new-cat', isActive: true };
      mockPost.mockResolvedValueOnce({ data: mockItem });

      const result = await dictionariesApi.createItem('categories', {
        name: 'New Cat',
        slug: 'new-cat',
      });

      expect(mockPost).toHaveBeenCalledWith('/admin/dictionaries/categories', {
        name: 'New Cat',
        slug: 'new-cat',
      });
      expect(result).toEqual(mockItem);
    });

    it('updateItem — sends PUT /admin/dictionaries/:type/:id', async () => {
      const mockItem = { id: 'c1', name: 'Updated', slug: 'updated', isActive: true };
      mockPut.mockResolvedValueOnce({ data: mockItem });

      const result = await dictionariesApi.updateItem('categories', 'c1', { name: 'Updated' });

      expect(mockPut).toHaveBeenCalledWith('/admin/dictionaries/categories/c1', { name: 'Updated' });
      expect(result).toEqual(mockItem);
    });

    it('deleteItem — sends DELETE /admin/dictionaries/:type/:id', async () => {
      mockDelete.mockResolvedValueOnce({});

      await dictionariesApi.deleteItem('manufacturers', 'm1');

      expect(mockDelete).toHaveBeenCalledWith('/admin/dictionaries/manufacturers/m1');
    });

    it('getAttributes — sends GET /admin/dictionaries/attributes', async () => {
      const mockAttrs = [{ id: 'a1', name: 'Frequency', attributeKey: 'frequency' }];
      mockGet.mockResolvedValueOnce({ data: mockAttrs });

      const result = await dictionariesApi.getAttributes();

      expect(mockGet).toHaveBeenCalledWith('/admin/dictionaries/attributes');
      expect(result).toEqual(mockAttrs);
    });
  });

  // ─── settingsApi (missing methods) ────────────────────────────

  describe('settingsApi (additional)', () => {
    it('resetSettings — sends POST /admin/settings/reset', async () => {
      const mockDefaults = { siteName: 'GoldPC' };
      mockPost.mockResolvedValueOnce({ data: mockDefaults });

      const result = await settingsApi.resetSettings();

      expect(mockPost).toHaveBeenCalledWith('/admin/settings/reset');
      expect(result).toEqual(mockDefaults);
    });
  });

  // ─── statsApi (missing methods) ───────────────────────────────

  describe('statsApi (additional)', () => {
    it('getCharts — sends GET /admin/stats/charts', async () => {
      const mockCharts = { orders: [{ label: 'Mon', value: 10 }], revenue: [{ label: 'Mon', value: 1000 }] };
      mockGet.mockResolvedValueOnce({ data: mockCharts });

      const result = await statsApi.getCharts();

      expect(mockGet).toHaveBeenCalledWith('/admin/stats/charts');
      expect(result).toEqual(mockCharts);
    });

    it('getSparklines — sends GET /admin/stats/sparklines', async () => {
      const mockSparklines = { users: [1, 2, 3], orders: [4, 5, 6], revenue: [7, 8, 9] };
      mockGet.mockResolvedValueOnce({ data: mockSparklines });

      const result = await statsApi.getSparklines();

      expect(mockGet).toHaveBeenCalledWith('/admin/stats/sparklines');
      expect(result).toEqual(mockSparklines);
    });

    it('getActivity — sends GET /admin/stats/activity', async () => {
      const mockActivity = [{ id: '1', type: 'order', description: 'New order', timestamp: '2026-06-19T10:00:00Z' }];
      mockGet.mockResolvedValueOnce({ data: mockActivity });

      const result = await statsApi.getActivity();

      expect(mockGet).toHaveBeenCalledWith('/admin/stats/activity');
      expect(result).toEqual(mockActivity);
    });
  });

  // ─── imagesAdminApi ───────────────────────────────────────────

  describe('imagesAdminApi', () => {
    it('upload — sends POST /admin/products/:productId/images with FormData', async () => {
      const mockResult = { id: 'img-1', url: '/images/test.jpg', sortOrder: 0 };
      mockPost.mockResolvedValueOnce({ data: mockResult });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await imagesAdminApi.upload('prod-1', file);

      expect(mockPost).toHaveBeenCalledWith('/admin/products/prod-1/images', expect.any(FormData), {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      expect(result).toEqual(mockResult);
    });

    it('upload — sends alt text when provided', async () => {
      const mockResult = { id: 'img-1', url: '/images/test.jpg', sortOrder: 0 };
      mockPost.mockResolvedValueOnce({ data: mockResult });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await imagesAdminApi.upload('prod-1', file, 'My alt text');

      const formData = mockPost.mock.calls[0][1] as FormData;
      expect(formData.get('alt')).toBe('My alt text');
    });

    it('delete — sends DELETE /admin/products/:productId/images/:imageId', async () => {
      mockDelete.mockResolvedValueOnce({});

      await imagesAdminApi.delete('prod-1', 'img-1');

      expect(mockDelete).toHaveBeenCalledWith('/admin/products/prod-1/images/img-1');
    });

    it('setPrimary — sends PUT /admin/products/:productId/images/:imageId/primary', async () => {
      mockPut.mockResolvedValueOnce({});

      await imagesAdminApi.setPrimary('prod-1', 'img-1');

      expect(mockPut).toHaveBeenCalledWith('/admin/products/prod-1/images/img-1/primary');
    });

    it('reorder — sends PUT /admin/products/:productId/images/reorder', async () => {
      mockPut.mockResolvedValueOnce({});

      await imagesAdminApi.reorder('prod-1', ['img-2', 'img-1', 'img-3']);

      expect(mockPut).toHaveBeenCalledWith('/admin/products/prod-1/images/reorder', { imageIds: ['img-2', 'img-1', 'img-3'] });
    });
  });

  // ─── auditLogApi ──────────────────────────────────────────────

  describe('auditLogApi', () => {
    it('getLogs — sends GET /admin/audit-logs with params', async () => {
      const mockLogs = { data: [{ id: '1', action: 'USER_LOGIN', userId: 'u1' }], meta: { totalItems: 1 } };
      mockGet.mockResolvedValueOnce({ data: mockLogs });

      const result = await auditLogApi.getLogs({ page: 1, pageSize: 10, action: 'USER_LOGIN' });

      expect(mockGet).toHaveBeenCalledWith('/admin/audit-logs', {
        params: { page: 1, pageSize: 10, action: 'USER_LOGIN' },
      });
      expect(result).toEqual(mockLogs);
    });

    it('getLogs — sends GET /admin/audit-logs without params', async () => {
      const mockLogs = { data: [], meta: { totalItems: 0 } };
      mockGet.mockResolvedValueOnce({ data: mockLogs });

      const result = await auditLogApi.getLogs();

      expect(mockGet).toHaveBeenCalledWith('/admin/audit-logs', { params: undefined });
      expect(result).toEqual(mockLogs);
    });
  });

  // ─── stubApi ──────────────────────────────────────────────────

  describe('stubApi', () => {
    it('getStubs — calls goldpcApi.getApiInternalStubs and returns data', async () => {
      const mockStubs = [{ name: 'CatalogService', serviceName: 'catalog', mode: 'Normal' }];
      mockGoldpcApi.getApiInternalStubs.mockResolvedValueOnce({ data: mockStubs });

      const result = await stubApi.getStubs();

      expect(mockGoldpcApi.getApiInternalStubs).toHaveBeenCalled();
      expect(result).toEqual(mockStubs);
    });

    it('getStubs — returns empty array when data is null', async () => {
      mockGoldpcApi.getApiInternalStubs.mockResolvedValueOnce({ data: null });

      const result = await stubApi.getStubs();

      expect(result).toEqual([]);
    });

    it('updateStub — calls goldpcApi.patchApiInternalStubsName with mode', async () => {
      mockGoldpcApi.patchApiInternalStubsName.mockResolvedValueOnce({});

      await stubApi.updateStub('CatalogService', { mode: 'Failing' });

      expect(mockGoldpcApi.patchApiInternalStubsName).toHaveBeenCalledWith('CatalogService', { mode: 'Failing' });
    });

    it('updateStub — passes chaos config', async () => {
      mockGoldpcApi.patchApiInternalStubsName.mockResolvedValueOnce({});

      await stubApi.updateStub('CatalogService', {
        mode: 'Unstable',
        chaos: { failureRate: 0.5, latencyRate: 0.3, maxLatencyMs: 5000 },
      });

      expect(mockGoldpcApi.patchApiInternalStubsName).toHaveBeenCalledWith('CatalogService', {
        mode: 'Unstable',
        chaos: { failureRate: 0.5, latencyRate: 0.3, maxLatencyMs: 5000 },
      });
    });
  });
});
