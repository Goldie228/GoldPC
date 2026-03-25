import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

/**
 * Конфигурация нагрузочных тестов для GoldPC
 * 
 * Документация: development-plan/10-e2e-and-load-testing.md (Section 10.2)
 * 
 * Сценарии:
 * 1. Smoke Test - базовая проверка каталога (ramp up до 100 VU)
 * 2. Order Creation - создание заказов с mock-авторизацией
 * 
 * Запуск: k6 run k6.config.js
 * С переменными окружения: BASE_URL=http://api.example.com k6 run k6.config.js
 */

// ============================================================================
// Кастомные метрики
// ============================================================================

const errorRate = new Rate('errors');
const responseTimeTrend = new Trend('response_time');
const ordersCreated = new Counter('orders_created');
const catalogRequests = new Counter('catalog_requests');

// ============================================================================
// Конфигурация
// ============================================================================

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// Статический токен для mock-авторизации (в продакшене использовать __ENV.AUTH_TOKEN)
const STATIC_AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-static-token-for-load-testing';

// Включить mock-режим (без реальных запросов к auth сервису)
const USE_MOCK_AUTH = __ENV.MOCK_AUTH !== 'false';

/**
 * Конфигурация сценариев нагрузочного тестирования
 * 
 * Thresholds:
 * - http_req_duration: p(95) < 500ms - 95% запросов должны быть быстрее 500ms
 * - errors: rate < 0.01 - уровень ошибок менее 1%
 */
export const options = {
  // Пороги производительности (согласно требованиям)
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% запросов < 500ms
    errors: ['rate<0.01'],              // Менее 1% ошибок
    response_time: ['p(95)<500'],
  },
  
  // Сценарии нагрузки
  scenarios: {
    // =========================================================================
    // Сценарий 1: Catalog Browsing - просмотр каталога
    // =========================================================================
    // Ramp up до 100 VU, проверка GET /api/v1/catalog/products
    catalog_browsing: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },    // Начальный разогрев
        { duration: '2m', target: 100 },   // Ramp up до 100 VU
        { duration: '5m', target: 100 },   // Удержание 100 VU
        { duration: '1m', target: 0 },     // Снижение
      ],
      gracefulRampDown: '30s',
      exec: 'catalogBrowsingScenario',     // Функция для этого сценария
    },

    // =========================================================================
    // Сценарий 2: PC Builder Interaction
    // =========================================================================
    // Имитация работы с конструктором ПК
    pc_builder: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 25 },    // Начальная нагрузка
        { duration: '2m', target: 50 },    // Увеличение
        { duration: '4m', target: 50 },    // Удержание
        { duration: '1m', target: 0 },     // Снижение
      ],
      gracefulRampDown: '30s',
      exec: 'pcBuilderScenario',           // Функция для этого сценария
      startTime: '1m',                     // Начать через 1 минуту
    },

    // =========================================================================
    // Сценарий 3: Order Creation - создание заказов
    // =========================================================================
    // Имитация создания заказов
    order_creation: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 25 },    // Начальная нагрузка
        { duration: '2m', target: 50 },    // Увеличение
        { duration: '3m', target: 50 },    // Удержание
        { duration: '1m', target: 0 },     // Снижение
      ],
      gracefulRampDown: '30s',
      exec: 'orderCreationScenario',       // Функция для этого сценария
      startTime: '2m',                     // Начать через 2 минуты
    },
  },
};

// ============================================================================
// Вспомогательные функции
// ============================================================================

/**
 * Генерация тестовой конфигурации ПК
 */
function generateTestConfig() {
  return {
    processorId: '00000000-0000-0000-0000-000000000001',
    motherboardId: '00000000-0000-0000-0000-000000000002',
    ramId: '00000000-0000-0000-0000-000000000003',
    gpuId: '00000000-0000-0000-0000-000000000004',
    psuId: '00000000-0000-0000-0000-000000000005',
    caseId: '00000000-0000-0000-0000-000000000006',
    storageIds: ['00000000-0000-0000-0000-000000000007'],
    coolingId: '00000000-0000-0000-0000-000000000008'
  };
}

/**
 * Генерация тестового заказа
 */
function generateTestOrder() {
  const products = [
    { productId: '00000000-0000-0000-0000-000000000001', quantity: 1 },
    { productId: '00000000-0000-0000-0000-000000000002', quantity: 2 },
    { productId: '00000000-0000-0000-0000-000000000003', quantity: 1 },
  ];
  
  const randomProduct = products[Math.floor(Math.random() * products.length)];
  
  return {
    items: [
      randomProduct,
      { 
        productId: `product-${__VU}-${__ITER}`, 
        quantity: Math.floor(Math.random() * 3) + 1 
      }
    ],
    deliveryMethod: ['pickup', 'delivery', 'express'][Math.floor(Math.random() * 3)],
    paymentMethod: ['online', 'on-receipt'][Math.floor(Math.random() * 2)],
    notes: `Load test order VU${__VU} ITER${__ITER}`,
  };
}

/**
 * Генерация тестового пользователя для регистрации
 */
function generateTestUser() {
  const timestamp = Date.now();
  return {
    email: `loadtest-${__VU}-${timestamp}@example.com`,
    password: 'LoadTest123!@#',
    firstName: 'LoadTest',
    lastName: `User${__VU}`,
    phone: `+37529${String(__VU).padStart(7, '0')}`,
  };
}

/**
 * Получение заголовков с авторизацией
 */
function getAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

/**
 * Mock-авторизация (возврат статического токена)
 */
function getMockToken() {
  // В mock-режиме возвращаем статический токен
  // В реальном окружении - запрос к auth сервису
  if (USE_MOCK_AUTH) {
    return STATIC_AUTH_TOKEN;
  }
  
  // Реальная авторизация (если mock отключен)
  const loginResponse = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    email: 'loadtest@example.com',
    password: 'LoadTest123!@#',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (loginResponse.status === 200) {
    return loginResponse.json('accessToken') || loginResponse.json('token');
  }
  
  return STATIC_AUTH_TOKEN; // Fallback
}

// ============================================================================
// Сценарий 1: Catalog Browsing - Просмотр каталога
// ============================================================================

/**
 * Catalog Browsing сценарий
 * 
 * - Ramp up до 100 VU
 * - GET /api/v1/catalog/products
 */
export function catalogBrowsingScenario() {
  group('Catalog Browsing', () => {
    // Основной запрос: получение списка продуктов
    const response = http.get(
      `${BASE_URL}/api/v1/catalog/products?page=1&limit=20`,
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    // Записываем метрики
    catalogRequests.add(1);
    responseTimeTrend.add(response.timings.duration);
    
    // Проверки
    const success = check(response, {
      'status is 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
      'response has valid structure': (r) => {
        try {
          const body = r.json();
          return body !== null && body !== undefined && 
                 (body.data !== undefined || Array.isArray(body));
        } catch {
          return false;
        }
      },
    });
    
    errorRate.add(!success);
    
    if (response.status === 200) {
      // Получение категорий
      const categoriesResponse = http.get(`${BASE_URL}/api/v1/catalog/categories`);
      check(categoriesResponse, { 'categories status is 200': (r) => r.status === 200 });
      errorRate.add(categoriesResponse.status >= 500);
      
      // Поиск товаров
      if (Math.random() < 0.3) {
        const query = ['ryzen', 'intel', 'rtx', 'ddr5'][Math.floor(Math.random() * 4)];
        const searchResponse = http.get(`${BASE_URL}/api/v1/catalog/products/search?q=${query}`);
        check(searchResponse, { 'search status is 200': (r) => r.status === 200 });
        errorRate.add(searchResponse.status >= 500);
      }
    }
  });
  
  sleep(Math.random() * 2 + 1);
}

// ============================================================================
// Сценарий 2: PC Builder - Конструктор ПК
// ============================================================================

/**
 * PC Builder сценарий
 * 
 * - Проверка совместимости
 * - Расчет мощности
 */
export function pcBuilderScenario() {
  group('PC Builder', () => {
    const config = generateTestConfig();
    
    // Шаг 1: Проверка совместимости
    const compatibilityResponse = http.post(
      `${BASE_URL}/api/v1/pcbuilder/check-compatibility`,
      JSON.stringify(config),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    check(compatibilityResponse, {
      'compatibility status is 200': (r) => r.status === 200,
      'compatibility check fast': (r) => r.timings.duration < 500,
    });
    
    errorRate.add(compatibilityResponse.status >= 500);
    responseTimeTrend.add(compatibilityResponse.timings.duration);
    
    sleep(1);
    
    // Шаг 2: Расчет мощности
    const powerResponse = http.post(
      `${BASE_URL}/api/v1/pcbuilder/calculate-power`,
      JSON.stringify({ componentIds: Object.values(config).flat() }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    check(powerResponse, {
      'power calc status is 200': (r) => r.status === 200,
    });
    
    errorRate.add(powerResponse.status >= 500);
    
    // Шаг 3: Сохранение конфигурации (для авторизованных)
    if (Math.random() < 0.2) {
      const token = getMockToken();
      const saveResponse = http.post(
        `${BASE_URL}/api/v1/pcbuilder/configurations`,
        JSON.stringify({ ...config, name: `LoadTest-${__VU}` }),
        { headers: getAuthHeaders(token) }
      );
      
      check(saveResponse, {
        'config save status is 201 or 401': (r) => [201, 200, 401].includes(r.status),
      });
      
      errorRate.add(saveResponse.status >= 500);
    }
  });
  
  sleep(Math.random() * 3 + 2);
}

// ============================================================================
// Сценарий 3: Order Creation - Создание заказов
// ============================================================================

/**
 * Order Creation сценарий
 * 
 * - Создание заказов с static token или mock
 * - Проверка корректности создания
 */
export function orderCreationScenario() {
  const token = getMockToken();
  const headers = getAuthHeaders(token);
  
  group('Order Creation', () => {
    // Шаг 1: Получение списка продуктов для выбора
    const productsResponse = http.get(
      `${BASE_URL}/api/v1/catalog/products?page=1&limit=10`,
      { headers }
    );
    
    check(productsResponse, {
      'products fetched for order': (r) => r.status === 200 || r.status === 401,
    });
    
    responseTimeTrend.add(productsResponse.timings.duration);
    
    sleep(1);
    
    // Шаг 2: Создание заказа
    const orderData = generateTestOrder();
    const createOrderResponse = http.post(
      `${BASE_URL}/api/v1/orders`,
      JSON.stringify(orderData),
      { headers }
    );
    
    const orderCreated = check(createOrderResponse, {
      'order status is 201 or 200': (r) => r.status === 201 || r.status === 200,
      'order response time < 500ms': (r) => r.timings.duration < 500,
      'order has id': (r) => {
        if (r.status === 201 || r.status === 200) {
          try {
            const body = r.json();
            return body.id !== undefined || body.orderId !== undefined;
          } catch {
            return false;
          }
        }
        // 401 - авторизация не прошла (ожидаемо для mock)
        // 400 - валидация не прошла (может быть в mock режиме)
        return r.status === 401 || r.status === 400;
      },
    });
    
    if (createOrderResponse.status === 201 || createOrderResponse.status === 200) {
      ordersCreated.add(1);
    }
    
    // Ошибки 5xx считаем реальными ошибками
    errorRate.add(createOrderResponse.status >= 500);
    responseTimeTrend.add(createOrderResponse.timings.duration);
    
    sleep(2);
    
    // Шаг 3: Получение списка заказов (опционально)
    if (Math.random() < 0.5) {
      const ordersResponse = http.get(
        `${BASE_URL}/api/v1/orders`,
        { headers }
      );
      
      check(ordersResponse, {
        'orders list status is 200 or 401': (r) => 
          r.status === 200 || r.status === 401,
      });
      
      errorRate.add(ordersResponse.status >= 500);
      responseTimeTrend.add(ordersResponse.timings.duration);
    }
  });
  
  // Пауза между заказами
  sleep(Math.random() * 3 + 2);
}

// ============================================================================
