/**
 * API для административных функций
 *
 * Использует сгенерированные orval-функции (goldpcApi) там, где есть
 * соответствующие эндпоинты в OpenAPI-спецификации. Для эндпоинтов,
 * отсутствующих в спеке, сохранены ручные вызовы через apiClient.
 */

import api from './index';
import { goldpcApi } from './generated/client';
import { CATEGORY_NAME_TO_SLUG, FRONTEND_TO_BACKEND } from '@/utils/category-mappings';
import type { ProductImage, User, Product, PagedResponse, ProductCategory, PriceHistoryDto, CategorySpecificationsDto } from './types';
export type { ProductImage, User, Product, PagedResponse, ProductCategory, PriceHistoryDto } from './types';

// === Маппинг категорий ===

/**
 * Преобразует category из ответа CatalogService (название на русском) в ProductCategory slug.
 * Если значение уже является валидным ProductCategory — возвращает как есть.
 */
function normalizeCategory(raw: string): ProductCategory {
  if (raw in CATEGORY_NAME_TO_SLUG) return CATEGORY_NAME_TO_SLUG[raw as keyof typeof CATEGORY_NAME_TO_SLUG];
  // Уже slug или неизвестное значение — возвращаем как есть
  return raw as ProductCategory;
}

// === Типы для администрирования ===

export type UserRole = 'Client' | 'Manager' | 'Master' | 'Admin' | 'Accountant';

// === Типы для статистики дашборда ===

export interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  revenue: number;
  usersChange: number;
  ordersChange: number;
  revenueChange: number;
}

export interface StatsResponse {
  stats: DashboardStats;
  lastUpdated: string;
}

// === Типы для графиков ===

export interface ChartPoint {
  label: string;
  value: number;
}

export interface ChartResponse {
  orders: ChartPoint[];
  revenue: ChartPoint[];
}

export interface SparklinesResponse {
  users: number[];
  orders: number[];
  revenue: number[];
}

export interface ActivityItem {
  id: string;
  type: 'order' | 'registration' | 'review' | 'product' | 'service';
  text: string;
  time: string;
  icon: string;
  color: string;
}

export interface ActivityResponse {
  items: ActivityItem[];
}

// === Типы для аудит-лога ===

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export interface AuditLogResponse {
  entries: AuditLogEntry[];
  total: number;
}

export interface AuditLogParams {
  page?: number;
  pageSize?: number;
  action?: string;
  entity?: string;
  userId?: string;
  from?: string;
  to?: string;
}

// === Типы для продуктов (админ) ===

export interface UpdateProductRequest {
  name?: string;
  slug?: string;
  manufacturerId?: string;
  price?: number;
  oldPrice?: number;
  stock?: number;
  warrantyMonths?: number;
  description?: string;
  specifications?: Record<string, unknown>;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface CreateProductRequest {
  name?: string;
  sku?: string;
  slug?: string;
  category?: string;
  categoryId?: string;
  manufacturerId?: string;
  price?: number;
  oldPrice?: number;
  stock?: number;
  warrantyMonths?: number;
  description?: string;
  specifications?: Record<string, unknown>;
  isActive?: boolean;
  isFeatured?: boolean;
}

// === Типы для справочников ===

export interface DictionaryItem {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DictionaryCategory extends DictionaryItem {
  productCount?: number;
}

export interface DictionaryManufacturer extends DictionaryItem {
  country?: string;
  logo?: string;
  productCount?: number;
}

export interface CreateDictionaryItemRequest {
  name: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateDictionaryItemRequest {
  name?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
}

/**
 * Параметры фильтрации для каталога товаров (админ).
 */
export interface AdminProductFilter {
  page?: number;
  pageSize?: number;
  category?: string;
  search?: string;
  isActive?: boolean;
}

/**
 * API управления пользователями
 */
export const usersAdminApi = {
  /**
   * Получить список пользователей с пагинацией и фильтрами
   */
  async getUsers(params?: {
    page?: number;
    pageSize?: number;
    role?: string;
    search?: string;
    isActive?: boolean;
  }): Promise<PagedResponse<User>> {
    const response = await api.get<PagedResponse<User>>('/auth/admin/users', { params });
    return response.data;
  },

  /**
   * Получить пользователя по ID
   */
  async getUser(userId: string): Promise<User> {
    const response = await goldpcApi.getAuthAdminUsersId(userId);
    return response.data as User;
  },

  /**
   * Изменить роль пользователя
   */
  async updateUserRole(userId: string, role: UserRole): Promise<void> {
    await api.patch(`/auth/admin/users/${userId}/role`, { role });
  },

  /**
   * Деактивировать пользователя
   */
  async deactivateUser(userId: string): Promise<void> {
    await goldpcApi.postAuthAdminUsersIdDeactivate(userId);
  },

  /**
   * Активировать пользователя
   */
  async activateUser(userId: string): Promise<void> {
    await goldpcApi.postAuthAdminUsersIdActivate(userId);
  },

  /**
   * Обновить пользователя
   */
  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    const response = await api.put<User>(`/auth/admin/users/${userId}`, data);
    return response.data;
  },

  /**
   * Создать нового пользователя
   */
  async createUser(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
  }): Promise<User> {
    const response = await goldpcApi.postAuthAdminUsers(data);
    return response.data as User;
  },

  /**
   * Удалить пользователя
   */
  async deleteUser(userId: string): Promise<void> {
    await goldpcApi.deleteAuthAdminUsersId(userId);
  },
};

/**
 * API администрирования каталога
 */
export const catalogAdminApi = {
  /**
   * Получить все продукты (включая неактивные).
   * Проксируется через GoldPC.Api → CatalogService.
   *
   * Ответ: PagedResult<ProductListDto> — category приходит как русское название
   * (напр. "Процессоры"), поэтому нормализуем в ProductCategory slug.
   */
  async getProducts(params?: {
    page?: number;
    pageSize?: number;
    category?: string;
    search?: string;
    isActive?: boolean;
  }): Promise<PagedResponse<Product>> {
    // Маппим frontend slug → backend slug для фильтрации (CatalogService ожидает slug категории)
    const apiParams = params?.category
      ? { ...params, category: FRONTEND_TO_BACKEND[params.category as keyof typeof FRONTEND_TO_BACKEND] ?? params.category }
      : params;

    const response = await goldpcApi.getAdminProducts(apiParams);
    const result = response.data as PagedResponse<Product>;

    // Нормализуем category: CatalogService возвращает "Процессоры", а фронтенд ждёт "cpu"
    if (result?.data && Array.isArray(result.data)) {
      for (const p of result.data) {
        const raw = (p as unknown as { category: string }).category;
        if (typeof raw === 'string') {
          (p as unknown as { category: ProductCategory }).category = normalizeCategory(raw);
        }
      }
    }

    return result;
  },

  /**
   * Обновить продукт
   */
  async updateProduct(productId: string, data: UpdateProductRequest): Promise<Product> {
    const response = await goldpcApi.putAdminProductsProductId(productId, data);
    return response.data as Product;
  },

  /**
   * Удалить продукт
   */
  async deleteProduct(productId: string): Promise<void> {
    await goldpcApi.deleteAdminProductsProductId(productId);
  },

  /**
   * Создать новый продукт
   */
  async createProduct(data: CreateProductRequest): Promise<Product> {
    const response = await goldpcApi.postAdminProducts(data);
    return response.data as Product;
  },

  /**
   * Получить продукт по ID (админ)
   */
  async getProductById(productId: string): Promise<Product> {
    // В OpenAPI-спеке нет отдельного GET /admin/products/{id} — используем ручной вызов
    const response = await api.get<Product>(`/admin/products/${productId}`);
    return response.data;
  },

  /**
   * Получить историю цен продукта
   */
  async getPriceHistory(productId: string): Promise<PriceHistoryDto[]> {
    const response = await goldpcApi.getAdminProductsProductIdPriceHistory(productId);
    return (response.data ?? []) as PriceHistoryDto[];
  },

  /**
   * Сгенерировать название продукта по характеристикам
   */
  async generateProductName(data: {
    category: string;
    specifications: Record<string, unknown>;
  }): Promise<{ name: string }> {
    const response = await goldpcApi.postAdminProductsGenerateName(data);
    return response.data as { name: string };
  },

  /**
   * Получить спецификации для категории
   */
  async getCategorySpecifications(categoryId: string): Promise<CategorySpecificationsDto> {
    const response = await goldpcApi.getAdminSpecificationsByCategoryCategoryId(categoryId);
    return response.data as CategorySpecificationsDto;
  },

  /**
   * Получить уникальные значения характеристик для фильтрации
   */
  async getUniqueSpecValues(categoryId: string): Promise<Record<string, string[]>> {
    const response = await goldpcApi.getAdminSpecificationsUniqueValuesCategoryId(categoryId);
    return (response.data ?? {}) as Record<string, string[]>;
  },
};

/**
 * API для загрузки изображений продуктов
 */
export const imagesAdminApi = {
  /**
   * Загрузить изображение для продукта
   */
  async upload(productId: string, file: File, alt?: string): Promise<ProductImage> {
    const formData = new FormData();
    formData.append('file', file);
    if (alt) formData.append('alt', alt);

    const response = await api.post<ProductImage>(`/admin/products/${productId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Удалить изображение
   */
  async delete(productId: string, imageId: string): Promise<void> {
    await api.delete(`/admin/products/${productId}/images/${imageId}`);
  },

  /**
   * Установить главное изображение
   */
  async setPrimary(productId: string, imageId: string): Promise<void> {
    await api.put(`/admin/products/${productId}/images/${imageId}/primary`);
  },

  /**
   * Изменить порядок изображений
   */
  async reorder(productId: string, imageIds: string[]): Promise<void> {
    await api.put(`/admin/products/${productId}/images/reorder`, { imageIds });
  },
};

/**
 * Параметры фильтрации для справочников
 */
export interface DictionaryFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
}

/**
 * API для управления справочниками
 */
export const dictionariesApi = {
  /**
   * Получить список категорий
   */
  async getCategories(): Promise<DictionaryCategory[]> {
    const response = await api.get<DictionaryCategory[]>('/admin/dictionaries/categories');
    return response.data;
  },

  /**
   * Получить список производителей
   */
  async getManufacturers(): Promise<DictionaryManufacturer[]> {
    const response = await api.get<DictionaryManufacturer[]>('/admin/dictionaries/manufacturers');
    return response.data;
  },

  /**
   * Получить список характеристик
   */
  async getAttributes(): Promise<DictionaryItem[]> {
    const response = await api.get<DictionaryItem[]>('/admin/dictionaries/attributes');
    return response.data;
  },

  /**
   * Создать запись в справочнике
   */
  async createItem(
    type: 'categories' | 'manufacturers' | 'attributes',
    data: CreateDictionaryItemRequest
  ): Promise<DictionaryItem> {
    const response = await api.post<DictionaryItem>(`/admin/dictionaries/${type}`, data);
    return response.data;
  },

  /**
   * Обновить запись в справочнике
   */
  async updateItem(
    type: 'categories' | 'manufacturers' | 'attributes',
    id: string,
    data: UpdateDictionaryItemRequest
  ): Promise<DictionaryItem> {
    const response = await api.put<DictionaryItem>(`/admin/dictionaries/${type}/${id}`, data);
    return response.data;
  },

  /**
   * Удалить запись из справочника
   */
  async deleteItem(
    type: 'categories' | 'manufacturers' | 'attributes',
    id: string
  ): Promise<void> {
    await api.delete(`/admin/dictionaries/${type}/${id}`);
  },
};

// === Типы для настроек системы ===

export interface SiteSettings {
  general: GeneralSettings;
  delivery: DeliverySettings;
  notifications: NotificationSettings;
  maintenance: MaintenanceSettings;
}

export interface GeneralSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  workingHours: string;
}

export interface DeliverySettings {
  freeShippingThreshold: number;
  standardDeliveryPrice: number;
  expressDeliveryPrice: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  orderConfirmation: boolean;
  shipmentUpdates: boolean;
  promotionalEmails: boolean;
}

export interface MaintenanceSettings {
  isMaintenanceMode: boolean;
  maintenanceMessage: string;
}

/**
 * API для настроек системы
 */
export const settingsApi = {
  /**
   * Получить настройки
   */
  async getSettings(): Promise<SiteSettings> {
    const response = await api.get<SiteSettings>('/admin/settings');
    return response.data;
  },

  /**
   * Обновить настройки
   */
  async updateSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    const response = await api.put<SiteSettings>('/admin/settings', settings);
    return response.data;
  },

  /**
   * Сбросить настройки по умолчанию
   */
  async resetSettings(): Promise<SiteSettings> {
    const response = await api.post<SiteSettings>('/admin/settings/reset');
    return response.data;
  },
};

/**
 * API для статистики дашборда
 */
export const statsApi = {
  /**
   * Получить статистику дашборда
   */
  async getStats(): Promise<StatsResponse> {
    const response = await api.get<StatsResponse>('/admin/stats');
    return response.data;
  },

  /**
   * Получить данные для графиков
   */
  async getCharts(): Promise<ChartResponse> {
    const response = await api.get<ChartResponse>('/admin/stats/charts');
    return response.data;
  },

  /**
   * Получить спарклайны
   */
  async getSparklines(): Promise<SparklinesResponse> {
    const response = await api.get<SparklinesResponse>('/admin/stats/sparklines');
    return response.data;
  },

  /**
   * Получить ленту активности дашборда
   */
  async getActivity(): Promise<ActivityResponse> {
    const response = await api.get<ActivityResponse>('/admin/stats/activity');
    return response.data;
  },
};

/**
 * API для журнала аудита
 */
export const auditLogApi = {
  /**
   * Получить записи аудита с пагинацией и фильтрацией
   */
  async getLogs(params?: AuditLogParams): Promise<AuditLogResponse> {
    const response = await api.get<AuditLogResponse>('/admin/audit-logs', { params });
    return response.data;
  },
};

// === Stub Manager API ===

export type StubMode = 'Normal' | 'Slow' | 'Failing' | 'Unstable';

export interface ChaosConfig {
  failureRate: number;
  latencyRate: number;
  maxLatencyMs?: number;
}

export interface Stub {
  name: string;
  serviceName: string;
  mode: StubMode;
  chaos?: ChaosConfig;
}

export interface StubUpdateRequest {
  mode: StubMode;
  chaos?: ChaosConfig;
}

/**
 * API для управления заглушками (Chaos Engineering)
 */
export const stubApi = {
  /** Получить список всех заглушек */
  async getStubs(): Promise<Stub[]> {
    const response = await goldpcApi.getApiInternalStubs();
    return (response.data ?? []) as Stub[];
  },

  /** Обновить режим заглушки */
  async updateStub(name: string, data: StubUpdateRequest): Promise<void> {
    await goldpcApi.patchApiInternalStubsName(name, data);
  },
};
