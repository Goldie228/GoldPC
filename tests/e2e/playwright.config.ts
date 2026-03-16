import { defineConfig, devices } from '@playwright/test';

/**
 * Конфигурация Playwright для E2E тестов GoldPC
 * @see https://playwright.dev/docs/test-configuration
 * @see development-plan/10-e2e-and-load-testing.md (Section 10.1, 10.4)
 */
export default defineConfig({
  // Директория для тестов
  testDir: './specs',
  
  // Директория для артефактов
  outputDir: './test-results',
  
  // Параллельное выполнение
  fullyParallel: true,
  
  // Запрет на тесты без названия файла в CI
  forbidOnly: !!process.env.CI,
  
  // Повторы при падении (2 повтора для CI, 0 для локальной разработки)
  retries: process.env.CI ? 2 : 1,
  
  // Количество воркеров (1 в CI для стабильности, не ограничено локально)
  workers: process.env.CI ? 1 : undefined,
  
  // Репортеры: HTML и JSON как требуется в задании
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  
  // Глобальный таймаут для тестов
  timeout: 30000,
  
  // Общие настройки
  use: {
    // Базовый URL для docker-compose.test.yml окружения
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // API URL для backend запросов
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
    
    // Трейс при падении для отладки
    trace: 'on-first-retry',
    
    // Скриншот при падении
    screenshot: 'only-on-failure',
    
    // Видео при падении
    video: 'retain-on-failure',
    
    // Таймауты
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // Проекты для разных браузеров (Chromium, Firefox, WebKit как требуется)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
