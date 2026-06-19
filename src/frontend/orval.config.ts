/**
 * Конфигурация orval для генерации TypeScript-типов и API-функций
 * из OpenAPI спецификации GoldPC
 *
 * React Query хуки — пишутся вручную (орval генерирует fetch-based,
 * а нам нужен Axios с JWT/CSRF перехватчиками).
 * Zod-схемы — генерируются отдельным output.
 */
import { defineConfig } from 'orval';

export default defineConfig({
  goldpc: {
    input: {
      target: './openapi/gateway.json',
    },
    output: {
      target: './src/api/generated/api.ts',
      schemas: './src/api/generated/model',
      client: 'axios',
      override: {
        axios: {
          instance: 'apiClient',
          importPath: '@/api/client',
        },
      },
    },
  },
  goldpcZod: {
    input: {
      target: './openapi/gateway.json',
    },
    output: {
      target: './src/api/generated/zod.ts',
      client: 'zod',
    },
  },
});
