/**
 * Обёртка над сгенерированным API — подставляет наш apiClient
 * (с JWT/CSRF перехватчиками) вместо axios.default
 */
import apiClient from '@/api/client';
import { getGoldPCAPI } from './api';

export const goldpcApi = getGoldPCAPI(apiClient);

// Re-export types
export type {
  GetApiV1AdminProductsParams,
  GetApiV1CatalogProductsParams,
  GetApiV1OrdersParams,
  GetApiV1ServicesParams,
  GetApiV1AuthNotificationsParams,
  GetApiV1AuthSecurityLoginHistoryParams,
} from './api';

// Re-export model types
export * from './model';
