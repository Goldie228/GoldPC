/**
 * Lighthouse CI Configuration for GoldPC
 * 
 * Конфигурация для проверки производительности frontend
 * Запуск: lhci autorun
 * 
 * @see https://github.com/GoogleChrome/lighthouse-ci
 */

module.exports = {
  ci: {
    collect: {
      // URL для тестирования
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/catalog',
        'http://localhost:3000/pc-builder',
      ],
      // Количество прогонов для усреднения
      numberOfRuns: 3,
      // Настройки Lighthouse
      settings: {
        preset: 'desktop',
        // Дополнительные настройки
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        // Отключение сохранения сниппетов для экономии места
        skipAudits: ['full-page-screenshot'],
      },
    },
    assert: {
      // Assertions для категорий и метрик
      assertions: {
        // ========================================
        // Категории (minScore: 0.9 = 90%)
        // ========================================
        
        // Performance - предупреждение (warn), если < 90%
        'categories:performance': ['warn', { minScore: 0.9 }],
        
        // Accessibility - ошибка (error), если < 90%
        'categories:accessibility': ['error', { minScore: 0.9 }],
        
        // Best Practices - предупреждение (warn), если < 90%
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        
        // SEO - ошибка (error), если < 90%
        'categories:seo': ['error', { minScore: 0.9 }],

        // ========================================
        // Web Vitals - критические метрики
        // ========================================
        
        // First Contentful Paint < 2000ms
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        
        // Largest Contentful Paint < 3000ms (ошибка!)
        'largest-contentful-paint': ['error', { maxNumericValue: 3000 }],
        
        // Cumulative Layout Shift < 0.1
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        
        // Total Blocking Time < 300ms
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        
        // Speed Index < 3000ms
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        
        // Time to Interactive < 4000ms
        'interactive': ['warn', { maxNumericValue: 4000 }],

        // ========================================
        // Дополнительные метрики
        // ========================================
        
        // Server Response Time (TTFB) < 600ms
        'server-response-time': ['warn', { maxNumericValue: 600 }],
        
        // First Meaningful Paint < 2000ms
        'first-meaningful-paint': ['warn', { maxNumericValue: 2000 }],
        
        // Max Potential First Input Delay < 150ms
        'max-potential-fid': ['warn', { maxNumericValue: 150 }],

        // ========================================
        // Размеры ресурсов
        // ========================================
        
        // Общий размер страницы < 3MB
        'total-byte-weight': ['warn', { maxNumericValue: 3000000 }],
        
        // Размер DOM < 1500 элементов
        'dom-size': ['warn', { maxNumericValue: 1500 }],
        
        // Количество сетевых запросов < 100
        'network-requests': ['warn', { maxNumericValue: 100 }],

        // ========================================
        // Оптимизации
        // ========================================
        
        // Не должно быть блокирующих ресурсов
        'render-blocking-resources': 'off', // Временно отключено для разработки
        
        // Изображения должны иметь alt
        'document-title': ['error', { minLength: 10 }],
        
        // Meta description должен быть
        'meta-description': ['error'],
      },
    },
    upload: {
      // Загрузка результатов во временное хранилище
      target: 'temporary-public-storage',
    },
  },
};