import { defineConfig } from 'vitest/config';

/**
 * Конфигурация Vitest для контрактных тестов (Pact)
 * 
 * Запуск: npm run test:contract
 * 
 * Контрактные тесты проверяют соответствие API между:
 * - Consumer (Frontend) и Provider (Backend)
 */

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['pacts/**/*.test.ts', 'pacts/**/*.spec.ts'],
    testTimeout: 30000, // Увеличенный таймаут для Pact тестов
    hookTimeout: 30000,
    pool: 'forks', // Изоляция тестов в отдельных процессах
    poolOptions: {
      forks: {
        singleFork: true // Pact требует последовательное выполнение
      }
    },
    reporters: ['verbose'],
    outputFile: {
      junit: './results/contract-tests.xml'
    }
  }
});