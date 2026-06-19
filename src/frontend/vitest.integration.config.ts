/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import path from 'path'

/**
 * Vitest config for integration tests that hit real backend services.
 * Run with: npx vitest run --config vitest.integration.config.ts
 * Requires backend running on localhost:5000 (gateway)
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__integration__/**/*.integration.test.ts'],
    testTimeout: 30000,
    hookTimeout: 10000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  }
})
