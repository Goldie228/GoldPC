import { defineConfig, devices } from '@playwright/test';

/**
 * Конфигурация Playwright для E2E тестов
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Директория для тестов
  testDir: './specs',
  
  // Директория для артефактов
  outputDir: './test-results',
  
  // Параллельное выполнение
  fullyParallel: true,
  
  // Запрет на тесты без названия файла
  forbidOnly: !!process.env.CI,
  
  // Повторы при падении
  retries: process.env.CI ? 2 : 0,
  
  // Количество воркеров
  workers: process.env.CI ? 1 : undefined,
  
  // Репортер
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  
  // Общие настройки
  use: {
    // Базовый URL
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // API URL
    extraHTTPHeaders: {
      'Content-Type': 'application/json'
    },
    
    // Трейс при падении
    trace: 'on-first-retry',
    
    // Скриншот при падении
    screenshot: 'only-on-failure',
    
    // Видео при падении
    video: 'retain-on-failure',
    
    // Таймауты
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // Проекты для разных браузеров
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
    // Мобильные устройства
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Веб-сервер для автозапуска
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});