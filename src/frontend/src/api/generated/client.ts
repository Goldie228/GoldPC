/**
 * Обёртка над сгенерированным API — подставляет наш apiClient
 * (с JWT/CSRF перехватчиками) вместо axios.default
 */
import apiClient from '@/api/client';
import { getGoldPCAPI } from './api';

export const goldpcApi = getGoldPCAPI(apiClient);

// Re-export model types (includes all param types and DTOs)
export * from './model';
