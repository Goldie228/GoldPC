import { useState, useCallback } from 'react';
import { usersAdminApi, catalogAdminApi, statsApi, dictionariesApi, settingsApi, type User, type UserRole, type GetUsersParams, type UserListResponse, type UpdateUserRoleRequest, type UpdateUserRequest, type UpdateProductRequest, type Product, type PagedResponse, type StatsResponse, type DictionaryItem, type DictionaryCategory, type DictionaryManufacturer, type CreateDictionaryItemRequest, type UpdateDictionaryItemRequest, type SiteSettings } from '../api/admin';

export interface UseAdminReturn {
  // Users
  users: User[] | null;
  totalUsers: number;
  loadingUsers: boolean;
  getUsers: (params?: GetUsersParams) => Promise<UserListResponse | null>;
  getUser: (userId: string) => Promise<User | null>;
  updateUserRole: (userId: string, data: UpdateUserRoleRequest) => Promise<User | null>;
  deactivateUser: (userId: string) => Promise<User | null>;
  activateUser: (userId: string) => Promise<User | null>;
  updateUser: (userId: string, data: UpdateUserRequest) => Promise<User | null>;
  deleteUser: (userId: string) => Promise<boolean>;

  // Catalog Admin
  products: Product[] | null;
  totalProducts: number;
  loadingProducts: boolean;
  getProducts: (params?: { page?: number; pageSize?: number; category?: string; isActive?: boolean }) => Promise<PagedResponse<Product> | null>;
  updateProduct: (productId: string, data: UpdateProductRequest) => Promise<Product | null>;
  deleteProduct: (productId: string) => Promise<boolean>;
  createProduct: (data: Partial<Product>) => Promise<Product | null>;

  // Stats
  stats: StatsResponse | null;
  loadingStats: boolean;
  getStats: () => Promise<StatsResponse | null>;

  // Dictionaries
  loadingDictionaries: boolean;
  getCategories: () => Promise<DictionaryCategory[] | null>;
  getManufacturers: () => Promise<DictionaryManufacturer[] | null>;
  getAttributes: () => Promise<DictionaryItem[] | null>;
  createDictionaryItem: (type: 'categories' | 'manufacturers' | 'attributes', data: CreateDictionaryItemRequest) => Promise<DictionaryItem | null>;
  updateDictionaryItem: (type: 'categories' | 'manufacturers' | 'attributes', id: string, data: UpdateDictionaryItemRequest) => Promise<DictionaryItem | null>;
  deleteDictionaryItem: (type: 'categories' | 'manufacturers' | 'attributes', id: string) => Promise<boolean>;

  // Settings
  settings: SiteSettings | null;
  loadingSettings: boolean;
  getSettings: () => Promise<SiteSettings | null>;
  updateSettings: (data: Partial<SiteSettings>) => Promise<SiteSettings | null>;
  resetSettings: () => Promise<SiteSettings | null>;

  error: Error | null;
}

export function useAdmin(): UseAdminReturn {
  const [users, setUsers] = useState<User[] | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingDictionaries, setLoadingDictionaries] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Users
  const getUsers = useCallback(async (params?: GetUsersParams) => {
    setLoadingUsers(true);
    setError(null);
    try {
      const result = await usersAdminApi.getUsers(params);
      setUsers(result.items);
      setTotalUsers(result.totalCount);
      return result;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch users');
      setError(err);
      return null;
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const getUser = useCallback(async (userId: string) => {
    setLoadingUsers(true);
    setError(null);
    try {
      return await usersAdminApi.getUser(userId);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch user');
      setError(err);
      return null;
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const updateUserRole = useCallback(async (userId: string, data: UpdateUserRoleRequest) => {
    setLoadingUsers(true);
    setError(null);
    try {
      return await usersAdminApi.updateUserRole(userId, data);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to update user role');
      setError(err);
      return null;
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const deactivateUser = useCallback(async (userId: string) => {
    setLoadingUsers(true);
    setError(null);
    try {
      return await usersAdminApi.deactivateUser(userId);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to deactivate user');
      setError(err);
      return null;
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const activateUser = useCallback(async (userId: string) => {
    setLoadingUsers(true);
    setError(null);
    try {
      return await usersAdminApi.activateUser(userId);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to activate user');
      setError(err);
      return null;
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const updateUser = useCallback(async (userId: string, data: UpdateUserRequest) => {
    setLoadingUsers(true);
    setError(null);
    try {
      return await usersAdminApi.updateUser(userId, data);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to update user');
      setError(err);
      return null;
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const deleteUser = useCallback(async (userId: string) => {
    setLoadingUsers(true);
    setError(null);
    try {
      await usersAdminApi.deleteUser(userId);
      return true;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to delete user');
      setError(err);
      return false;
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Catalog Admin
  const getProducts = useCallback(async (params?: { page?: number; pageSize?: number; category?: string; isActive?: boolean }) => {
    setLoadingProducts(true);
    setError(null);
    try {
      const result = await catalogAdminApi.getProducts(params);
      setProducts(result.items);
      setTotalProducts(result.totalCount);
      return result;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch products');
      setError(err);
      return null;
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const updateProduct = useCallback(async (productId: string, data: UpdateProductRequest) => {
    setLoadingProducts(true);
    setError(null);
    try {
      return await catalogAdminApi.updateProduct(productId, data);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to update product');
      setError(err);
      return null;
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const deleteProduct = useCallback(async (productId: string) => {
    setLoadingProducts(true);
    setError(null);
    try {
      await catalogAdminApi.deleteProduct(productId);
      return true;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to delete product');
      setError(err);
      return false;
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const createProduct = useCallback(async (data: Partial<Product>) => {
    setLoadingProducts(true);
    setError(null);
    try {
      return await catalogAdminApi.createProduct(data);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to create product');
      setError(err);
      return null;
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // Stats
  const getStats = useCallback(async () => {
    setLoadingStats(true);
    setError(null);
    try {
      const result = await statsApi.getStats();
      setStats(result);
      return result;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch stats');
      setError(err);
      return null;
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Dictionaries
  const getCategories = useCallback(async () => {
    setLoadingDictionaries(true);
    setError(null);
    try {
      return await dictionariesApi.getCategories();
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch categories');
      setError(err);
      return null;
    } finally {
      setLoadingDictionaries(false);
    }
  }, []);

  const getManufacturers = useCallback(async () => {
    setLoadingDictionaries(true);
    setError(null);
    try {
      return await dictionariesApi.getManufacturers();
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch manufacturers');
      setError(err);
      return null;
    } finally {
      setLoadingDictionaries(false);
    }
  }, []);

  const getAttributes = useCallback(async () => {
    setLoadingDictionaries(true);
    setError(null);
    try {
      return await dictionariesApi.getAttributes();
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch attributes');
      setError(err);
      return null;
    } finally {
      setLoadingDictionaries(false);
    }
  }, []);

  const createDictionaryItem = useCallback(async (type: 'categories' | 'manufacturers' | 'attributes', data: CreateDictionaryItemRequest) => {
    setLoadingDictionaries(true);
    setError(null);
    try {
      return await dictionariesApi.createItem(type, data);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to create dictionary item');
      setError(err);
      return null;
    } finally {
      setLoadingDictionaries(false);
    }
  }, []);

  const updateDictionaryItem = useCallback(async (type: 'categories' | 'manufacturers' | 'attributes', id: string, data: UpdateDictionaryItemRequest) => {
    setLoadingDictionaries(true);
    setError(null);
    try {
      return await dictionariesApi.updateItem(type, id, data);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to update dictionary item');
      setError(err);
      return null;
    } finally {
      setLoadingDictionaries(false);
    }
  }, []);

  const deleteDictionaryItem = useCallback(async (type: 'categories' | 'manufacturers' | 'attributes', id: string) => {
    setLoadingDictionaries(true);
    setError(null);
    try {
      await dictionariesApi.deleteItem(type, id);
      return true;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to delete dictionary item');
      setError(err);
      return false;
    } finally {
      setLoadingDictionaries(false);
    }
  }, []);

  // Settings
  const getSettings = useCallback(async () => {
    setLoadingSettings(true);
    setError(null);
    try {
      const result = await settingsApi.getSettings();
      setSettings(result);
      return result;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch settings');
      setError(err);
      return null;
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  const updateSettings = useCallback(async (data: Partial<SiteSettings>) => {
    setLoadingSettings(true);
    setError(null);
    try {
      const result = await settingsApi.updateSettings(data);
      setSettings(result);
      return result;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to update settings');
      setError(err);
      return null;
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  const resetSettings = useCallback(async () => {
    setLoadingSettings(true);
    setError(null);
    try {
      const result = await settingsApi.resetSettings();
      setSettings(result);
      return result;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to reset settings');
      setError(err);
      return null;
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  return {
    users,
    totalUsers,
    loadingUsers,
    getUsers,
    getUser,
    updateUserRole,
    deactivateUser,
    activateUser,
    updateUser,
    deleteUser,
    products,
    totalProducts,
    loadingProducts,
    getProducts,
    updateProduct,
    deleteProduct,
    createProduct,
    stats,
    loadingStats,
    getStats,
    loadingDictionaries,
    getCategories,
    getManufacturers,
    getAttributes,
    createDictionaryItem,
    updateDictionaryItem,
    deleteDictionaryItem,
    settings,
    loadingSettings,
    getSettings,
    updateSettings,
    resetSettings,
    error,
  };
}

export default useAdmin;