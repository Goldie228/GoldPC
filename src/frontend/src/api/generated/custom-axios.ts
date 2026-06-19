/**
 * Адаптер для orval — переиспользует существующий apiClient
 * с JWT/CSRF перехватчиками из client.ts
 */
import apiClient from '@/api/client';

export { apiClient };
