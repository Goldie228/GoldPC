/**
 * Конфигурация orval для генерации TypeScript-типов, API-функций и Zod-схем
 * из OpenAPI спецификации GoldPC
 */
import { defineConfig } from 'orval';

export default defineConfig({
  goldpc: {
    input: {
      target: './openapi/gateway.json',
    },
    output: {
      target: './src/api/generated/index.ts',
      schemas: './src/api/generated/model',
      client: 'axios',
      override: {
        axios: {
          instance: 'apiClient',
          importPath: '@/api/client',
        },
        query: {
          useQuery: true,
          useMutation: true,
        },
      },
    },
  },
});
