/**
 * API для административных функций
 */

import api from './index';
import type { ProductImage, User, Product, PagedResponse, ProductCategory, PriceHistoryDto, CategorySpecificationsDto } from './types';
export type { ProductImage, User, Product, PagedResponse, ProductCategory, PriceHistoryDto } from './types';

// === Маппинг категорий ===

/** Маппинг русских названий категорий из CatalogService → frontend ProductCategory slug */
const CATEGORY_NAME_TO_SLUG: Record<string, ProductCategory> = {
  'Процессоры': 'cpu',
  'Видеокарты': 'gpu',
  'Материнские платы': 'motherboard',
  'Оперативная память': 'ram',
  'Накопители': 'storage',
  'Блоки питания': 'psu',
  'Корпуса': 'case',
  'Охлаждение': 'cooling',
  'Вентиляторы': 'fan',
  'Мониторы': 'monitor',
  'Клавиатуры': 'keyboard',
  'Мыши': 'mouse',
  'Наушники': 'headphones',
};

/**
 * Преобразует category из ответа CatalogService (название на русском) в ProductCategory slug.
 * Если значение уже является валидным ProductCategory — возвращает как есть.
 */
function normalizeCategory(raw: string): ProductCategory {
  if (raw in CATEGORY_NAME_TO_SLUG) return CATEGORY_NAME_TO_SLUG[raw];
  // Уже slug или неизвестное значение — возвращаем как есть
  return raw as ProductCategory;
}

/** Маппинг frontend ProductCategory slug → backend Category slug (для фильтрации) */
const FRONTEND_TO_BACKEND_SLUG: Record<string, string> = {
  cpu: 'processors',
  gpu: 'gpu',
  motherboard: 'motherboards',
  ram: 'ram',
  storage: 'storage',
  psu: 'psu',
  case: 'cases',
  cooling: 'coolers',
  monitor: 'monitors',
  keyboard: 'keyboards',
  mouse: 'mice',
  headphones: 'headphones',
  fan: 'coolers',
};

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

export interface UpdateUserRoleRequest {
  role: UserRole;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  password: string;
}

/**
 * Тело запроса обновления товара — соответствует UpdateProductDto из SharedKernel
 */
export interface UpdateProductRequest {
  name?: string;
  slug?: string;
  manufacturerId?: string;
  price?: number;
  oldPrice?: number;
  stock?: number;
  warrantyMonths?: number;
  description?: string;
  specifications?: Record<string, string | number | boolean>;
  isActive?: boolean;
  isFeatured?: boolean;
}

/**
 * Тело запроса создания товара — соответствует CreateProductDto из SharedKernel
 */
export interface CreateProductRequest {
  name: string;
  sku: string;
  slug?: string;
  category: string;
  categoryId?: string;
  manufacturerId?: string;
  price: number;
  oldPrice?: number;
  stock: number;
  warrantyMonths?: number;
  description?: string;
  specifications?: Record<string, string | number | boolean>;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface GetUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
}

export type UserListResponse = PagedResponse<User>;

/**
 * API администрирования пользователей
 */
export const usersAdminApi = {
  /**
   * Получить список пользователей с пагинацией
   */
  async getUsers(params?: GetUsersParams): Promise<UserListResponse> {
    const response = await api.get<UserListResponse>('/admin/users', {
      params,
    });
    return response.data;
  },

  /**
   * Получить пользователя по ID
   */
  async getUser(userId: string): Promise<User> {
    const response = await api.get<User>(`/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Изменить роль пользователя
   */
  async updateUserRole(userId: string, data: UpdateUserRoleRequest): Promise<User> {
    const response = await api.patch<User>(`/admin/users/${userId}/role`, data);
    return response.data;
  },

  /**
   * Деактивировать пользователя
   */
  async deactivateUser(userId: string): Promise<User> {
    const response = await api.post<User>(`/admin/users/${userId}/deactivate`);
    return response.data;
  },

  /**
   * Активировать пользователя
   */
  async activateUser(userId: string): Promise<User> {
    const response = await api.post<User>(`/admin/users/${userId}/activate`);
    return response.data;
  },

  /**
   * Обновить пользователя
   */
  async updateUser(userId: string, data: UpdateUserRequest): Promise<User> {
    const response = await api.put<User>(`/admin/users/${userId}`, data);
    return response.data;
  },

  /**
   * Создать нового пользователя (только Admin)
   */
  async createUser(data: CreateUserRequest): Promise<User> {
    const response = await api.post<User>('/admin/users', data);
    return response.data;
  },

  /**
   * Удалить пользователя
   */
  async deleteUser(userId: string): Promise<void> {
    await api.delete(`/admin/users/${userId}`);
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
      ? { ...params, category: FRONTEND_TO_BACKEND_SLUG[params.category] ?? params.category }
      : params;

    const response = await api.get<PagedResponse<Product>>('/admin/products', {
      params: apiParams,
    });
    const result = response.data;

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
    const response = await api.put<Product>(`/admin/products/${productId}`, data);
    return response.data;
  },

  /**
   * Удалить продукт
   */
  async deleteProduct(productId: string): Promise<void> {
    await api.delete(`/admin/products/${productId}`);
  },

  /**
   * Создать продукт
   */
  async createProduct(data: CreateProductRequest): Promise<Product> {
    const response = await api.post<Product>('/admin/products', data);
    return response.data;
  },

  /**
   * Получить продукт по ID (для редактора)
   */
  async getProductById(id: string): Promise<Product> {
    const response = await api.get<Product>(`/admin/products/${id}`);
    return response.data;
  },

  /**
   * Получить историю цен продукта
   */
  async getPriceHistory(productId: string): Promise<PriceHistoryDto[]> {
    const response = await api.get<PriceHistoryDto[]>(`/admin/products/${productId}/price-history`);
    return response.data;
  },

  /**
   * Сгенерировать название товара по шаблону
   */
  async generateProductName(data: {
    manufacturerName?: string;
    categorySlug?: string;
    specifications?: Record<string, string | number | boolean>;
  }): Promise<{ name: string }> {
    const response = await api.post<{ name: string }>('/admin/products/generate-name', data);
    return response.data;
  },

  /**
   * Получить мета-данные характеристик для категории
   */
  async getCategorySpecifications(categoryId: string): Promise<CategorySpecificationsDto> {
    const response = await api.get<CategorySpecificationsDto>(`/admin/specifications/by-category/${categoryId}`);
    return response.data;
  },
};

/**
 * API статистики дашборда
 */
export const statsApi = {
  /**
   * Получить статистику для административной панели
   */
  async getStats(): Promise<StatsResponse> {
    const response = await api.get<StatsResponse>('/admin/stats');
    return response.data;
  },
};

/**
 * API для управления изображениями товаров
 */
export const imagesAdminApi = {
  /**
   * Загрузить изображение для товара (multipart/form-data)
   */
  async upload(
    productId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ProductImage> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<ProductImage>(
      `/admin/products/${productId}/images`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress
          ? (progressEvent) => {
              if (progressEvent.total) {
                onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
              }
            }
          : undefined,
      }
    );
    return response.data;
  },

  /**
   * Удалить изображение товара
   */
  async delete(productId: string, imageId: string): Promise<void> {
    await api.delete(`/admin/products/${productId}/images/${imageId}`);
  },

  /**
   * Установить изображение как главное
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

// === Типы для справочников ===

export interface DictionaryItem {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface DictionaryCategory extends DictionaryItem {
  productCount: number;
}

export interface DictionaryManufacturer extends DictionaryItem {
  productCount: number;
  country?: string;
}

export interface CreateDictionaryItemRequest {
  name: string;
  slug: string;
}

export interface UpdateDictionaryItemRequest {
  name?: string;
  slug?: string;
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
  siteName: string;
  adminEmail: string;
  storeAddress: string;
  phone: string;
  workingHours: string;
  freeDeliveryThreshold: number;
  deliveryCost: number;
  deliveryTime: string;
  twoFactorRequired: boolean;
  auditLogging: boolean;
  loginNotifications: boolean;
  orderEmailNotifications: boolean;
  smsNotifications: boolean;
  lowStockNotifications: boolean;
  maintenanceMode: boolean;
}

export type UpdateSettingsRequest = Partial<SiteSettings>;

/**
 * API для управления настройками системы
 */
export const settingsApi = {
  /**
   * Получить текущие настройки
   */
  async getSettings(): Promise<SiteSettings> {
    const response = await api.get<SiteSettings>('/admin/settings');
    return response.data;
  },

  /**
   * Обновить настройки
   */
  async updateSettings(data: UpdateSettingsRequest): Promise<SiteSettings> {
    const response = await api.put<SiteSettings>('/admin/settings', data);
    return response.data;
  },

  /**
   * Сбросить настройки к значениям по умолчанию
   */
  async resetSettings(): Promise<SiteSettings> {
    const response = await api.post<SiteSettings>('/admin/settings/reset');
    return response.data;
  },
};

// === Типы для журнала аудита ===

export type AuditActionType =
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'USER_ROLE_CHANGED'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_ACTIVATED'
  | 'SETTINGS_UPDATED'
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_DELETED'
  | 'ORDER_STATUS_CHANGED'
  | 'MAINTENANCE_MODE_ENABLED'
  | 'MAINTENANCE_MODE_DISABLED'
  | 'SECURITY_EVENT';

export interface AuditLogEntry {
  id: string;
  actionType: AuditActionType;
  userId: string;
  userName: string;
  userEmail: string;
  ipAddress: string;
  description: string;
  additionalData?: Record<string, unknown>;
  createdAt: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface AuditLogParams {
  page?: number;
  pageSize?: number;
  actionType?: AuditActionType;
  userId?: string;
  startDate?: string;
  endDate?: string;
  severity?: string;
}

export interface AuditLogResponse {
  data: AuditLogEntry[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

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
    const response = await api.get<Stub[]>('/internal/stubs');
    return response.data;
  },

  /** Обновить режим заглушки */
  async updateStub(name: string, data: StubUpdateRequest): Promise<void> {
    await api.patch(`/internal/stubs/${encodeURIComponent(name)}`, data);
  },
};
