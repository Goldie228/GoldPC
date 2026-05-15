/**
 * Точка входа для API модуля GoldPC
 * Реэкспортирует клиент и сервисы
 */

// Базовый API клиент
export { default as apiClient, BASE_URL } from './client';
export { default } from './client';

// Сервис каталога
export {
  getProducts,
  getProductById,
  getCategories,
  getFeaturedProducts,
  searchProducts,
  catalogService,
} from './catalogService';

// Сервис аутентификации
export { authService } from './authService';

// Типы
export type {
  Product,
  ProductSummary,
  ProductCategory,
  ProductImage,
  ProductSpecifications,
  ProductListResponse,
  GetProductsParams,
  Category,
  Manufacturer,
  FilterAttribute,
  PaginationMeta,
  PagedResponse,
  Uuid,
// Auth types
   LoginRequest,
   RegisterRequest,
   AuthResponse,
   User,
   ChangePasswordRequest,
   TwoFactorEnableRequest,
   TwoFactorVerifyRequest,
   TwoFactorDisableRequest,
   TwoFactorStatusResponse,
   NotificationPreferenceRequest,
   NotificationPreferenceResponse,
   LoginHistoryItem,
  // Review types
  UpdateReviewRequest,
} from './types';

// Warranty
export { warrantyApi } from './warranty';
export type { WarrantyCard, WarrantyStatus, PagedResult } from './warranty';
