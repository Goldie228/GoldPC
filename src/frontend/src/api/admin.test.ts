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
} from './admin';

describe('api/admin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── usersAdminApi ────────────────────────────────────────────

  describe('usersAdminApi', () => {
    it('getUsers — sends GET /auth/admin/users with params', async () => {
      const mockResponse = {
        data: {
          data: [{ id: '1', firstName: 'John', lastName: 'Doe' }],
          meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
        },
      };
      mockGet.mockResolvedValueOnce(mockResponse);

      const result = await usersAdminApi.getUsers({ page: 1, pageSize: 10, search: 'John' });

      expect(mockGet).toHaveBeenCalledWith('/auth/admin/users', {
        params: { page: 1, pageSize: 10, search: 'John' },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('getUser — sends GET /admin/users/:id via goldpcApi', async () => {
      const mockUser = { id: 'user-1', firstName: 'Jane', email: 'jane@test.com' };
      mockGoldpcApi.getAuthAdminUsersId.mockResolvedValueOnce({ data: mockUser });

      const result = await usersAdminApi.getUser('user-1');

      expect(mockGoldpcApi.getAuthAdminUsersId).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockUser);
    });

    it('updateUser — sends PUT /auth/admin/users/:id with data', async () => {
      const mockUser = { id: 'user-1', firstName: 'Updated' };
      mockPut.mockResolvedValueOnce({ data: mockUser });

      const result = await usersAdminApi.updateUser('user-1', { firstName: 'Updated' });

      expect(mockPut).toHaveBeenCalledWith('/auth/admin/users/user-1', { firstName: 'Updated' });
      expect(result).toEqual(mockUser);
    });

    it('updateUserRole — sends PATCH /auth/admin/users/:id/role', async () => {
      await usersAdminApi.updateUserRole('user-1', 'Admin');

      expect(mockPatch).toHaveBeenCalledWith('/auth/admin/users/user-1/role', { role: 'Admin' });
    });

    it('deleteUser — sends DELETE /admin/users/:id via goldpcApi', async () => {
      mockGoldpcApi.deleteAuthAdminUsersId.mockResolvedValueOnce({});

      await usersAdminApi.deleteUser('user-1');

      expect(mockGoldpcApi.deleteAuthAdminUsersId).toHaveBeenCalledWith('user-1');
    });

    it('createUser — sends POST /admin/users via goldpcApi', async () => {
      const mockUser = { id: 'user-new', firstName: 'New' };
      mockGoldpcApi.postAuthAdminUsers.mockResolvedValueOnce({ data: mockUser });

      const result = await usersAdminApi.createUser({
        firstName: 'New',
        lastName: 'User',
        email: 'new@test.com',
        role: 'Client',
        password: 'pass123',
      });

      expect(mockGoldpcApi.postAuthAdminUsers).toHaveBeenCalledWith({
        firstName: 'New',
        lastName: 'User',
        email: 'new@test.com',
        role: 'Client',
        password: 'pass123',
      });
      expect(result).toEqual(mockUser);
    });

    it('activateUser — sends POST /auth/admin/users/:id/activate via goldpcApi', async () => {
      mockGoldpcApi.postAuthAdminUsersIdActivate.mockResolvedValueOnce({});

      await usersAdminApi.activateUser('user-1');

      expect(mockGoldpcApi.postAuthAdminUsersIdActivate).toHaveBeenCalledWith('user-1');
    });

    it('deactivateUser — sends POST /auth/admin/users/:id/deactivate via goldpcApi', async () => {
      mockGoldpcApi.postAuthAdminUsersIdDeactivate.mockResolvedValueOnce({});

      await usersAdminApi.deactivateUser('user-1');

      expect(mockGoldpcApi.postAuthAdminUsersIdDeactivate).toHaveBeenCalledWith('user-1');
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
  });
});
