import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

/**
 * Конфигурация нагрузочных тестов для GoldPC
 * 
 * Запуск: k6 run k6.config.js
 * С контейнерами: docker-compose -f docker-compose.load.yml up
 */

// Кастомные метрики
const errorRate = new Rate('errors');
const responseTimeTrend = new Trend('response_time');
const ordersCreated = new Counter('orders_created');

// Базовый URL
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// Конфигурация сценариев
export const options = {
  // Пороги производительности
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% запросов < 500ms, 99% < 1000ms
    errors: ['rate<0.01'], // Менее 1% ошибок
    response_time: ['p(95)<500'],
  },
  
  // Сценарии нагрузки
  scenarios: {
    // Плавное увеличение нагрузки
    ramping: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },   // Разогрев
        { duration: '5m', target: 100 },  // Рабочая нагрузка
        { duration: '2m', target: 200 },  // Пиковая нагрузка
        { duration: '3m', target: 200 },  // Удержание пика
        { duration: '2m', target: 0 },    // Снижение
      ],
      gracefulRampDown: '30s',
    },
  },
};

// Генерация тестовых данных
function generateProduct() {
  return {
    name: `Test Product ${Date.now()}`,
    price: Math.floor(Math.random() * 50000) + 1000,
    category: ['cpu', 'gpu', 'ram', 'motherboard'][Math.floor(Math.random() * 4)],
    stock: Math.floor(Math.random() * 100) + 1,
    manufacturer: 'Test Manufacturer',
    specifications: {}
  };
}

function generateOrder() {
  return {
    items: [
      { productId: '00000000-0000-0000-0000-000000000001', quantity: 1 }
    ],
    deliveryMethod: 'pickup',
    paymentMethod: 'online'
  };
}

function generateUser() {
  return {
    email: `loadtest${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    phone: '+375291234567'
  };
}

// Получение токена авторизации
let authToken = '';

export function setup() {
  // Создаём тестового пользователя и получаем токен
  const loginResponse = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    email: 'loadtest@example.com',
    password: 'TestPassword123!'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginResponse.status === 200) {
    return { token: loginResponse.json('accessToken') };
  }
  
  return { token: '' };
}

export default function (data) {
  const token = data.token;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Сценарий 1: Просмотр каталога (самый частый)
  group('Catalog Browsing', () => {
    // Главная страница каталога
    let response = http.get(`${BASE_URL}/api/v1/catalog/products?page=1&limit=20`, { headers });
    
    check(response, {
      'catalog status is 200': (r) => r.status === 200,
      'catalog response time < 500ms': (r) => r.timings.duration < 500,
      'catalog has products': (r) => r.json('data')?.length > 0,
    });
    
    errorRate.add(response.status !== 200);
    responseTimeTrend.add(response.timings.duration);
    
    sleep(1);

    // Поиск товаров
    response = http.get(`${BASE_URL}/api/v1/catalog/products/search?q=ryzen`, { headers });
    
    check(response, {
      'search status is 200': (r) => r.status === 200,
      'search has results': (r) => r.json('data')?.length >= 0,
    });
    
    errorRate.add(response.status !== 200);
    sleep(1);

    // Просмотр категорий
    response = http.get(`${BASE_URL}/api/v1/catalog/categories`, { headers });
    
    check(response, {
      'categories status is 200': (r) => r.status === 200,
    });
    
    errorRate.add(response.status !== 200);
    sleep(0.5);
  });

  // Сценарий 2: Просмотр конкретного товара
  group('Product Detail', () => {
    const productId = '00000000-0000-0000-0000-000000000001';
    const response = http.get(`${BASE_URL}/api/v1/catalog/products/${productId}`, { headers });
    
    check(response, {
      'product detail status is 200': (r) => r.status === 200 || r.status === 404,
      'product has required fields': (r) => {
        if (r.status === 200) {
          const body = r.json();
          return body.id && body.name && body.price !== undefined;
        }
        return true;
      },
    });
    
    errorRate.add(response.status >= 500);
    responseTimeTrend.add(response.timings.duration);
    sleep(1);
  });

  // Сценарий 3: Работа с заказами (только для авторизованных)
  if (token && Math.random() < 0.3) { // 30% пользователей делают заказы
    group('Order Operations', () => {
      // Создание заказа
      const createResponse = http.post(
        `${BASE_URL}/api/v1/orders`,
        JSON.stringify(generateOrder()),
        { headers }
      );
      
      check(createResponse, {
        'order created': (r) => r.status === 201 || r.status === 400,
      });
      
      if (createResponse.status === 201) {
        ordersCreated.add(1);
      }
      
      errorRate.add(createResponse.status >= 500);
      sleep(2);

      // Получение списка заказов
      const listResponse = http.get(`${BASE_URL}/api/v1/orders`, { headers });
      
      check(listResponse, {
        'orders list status is 200': (r) => r.status === 200,
      });
      
      errorRate.add(listResponse.status >= 500);
      sleep(1);
    });
  }

  // Случайная задержка между запросами
  sleep(Math.random() * 2 + 0.5);
}

// Отчёт после выполнения
export function teardown(data) {
  console.log('Load test completed');
}