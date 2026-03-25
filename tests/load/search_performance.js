import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

/**
 * Нагрузочный тест для эндпоинта поиска и фильтрации товаров
 * 
 * Цель: Проверить производительность поиска под нагрузкой 100 VU
 * Эндпоинт: GET /api/v1/catalog/products
 * 
 * Пороги производительности (Thresholds):
 * - http_req_duration: p(95) < 500ms
 * - error_rate: < 1%
 */

// Кастомные метрики
const errorRate = new Rate('errors');
const searchTrend = new Trend('search_duration');

// Конфигурация
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export const options = {
  stages: [
    { duration: '1m', target: 50 },  // Разминка
    { duration: '3m', target: 100 }, // Нагрузка 100 VU
    { duration: '1m', target: 100 }, // Удержание
    { duration: '1m', target: 0 },   // Снижение
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'],
    'errors': ['rate<0.01'],
    'search_duration': ['p(95)<400'], // Внутренний целевой показатель чуть строже
  },
};

// Наборы данных для поиска
const searchQueries = [
  'Ryzen 9',
  'Intel i7',
  'RTX 4080',
  'DDR5 RAM',
  'Motherboard AM5',
  'SSD 1TB',
  'Gaming PC'
];

const categories = ['cpu', 'gpu', 'motherboard', 'ram', 'storage'];

export default function () {
  group('Search & Filter', function () {
    // Выбираем случайные параметры для поиска
    const query = searchQueries[Math.floor(Math.random() * searchQueries.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const minPrice = Math.floor(Math.random() * 10000);
    const maxPrice = minPrice + 50000;

    // Формируем URL с параметрами
    const url = `${BASE_URL}/api/v1/catalog/products?search=${encodeURIComponent(query)}&category=${category}&priceMin=${minPrice}&priceMax=${maxPrice}&page=1&limit=20`;

    const response = http.get(url, {
      headers: { 'Accept': 'application/json' },
    });

    // Записываем метрики
    searchTrend.add(response.timings.duration);
    
    // Проверки
    const success = check(response, {
      'status is 200': (r) => r.status === 200,
      'content is json': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
      'has data field': (r) => {
          try {
              const body = r.json();
              return body && body.data !== undefined;
          } catch(e) {
              return false;
          }
      },
    });

    errorRate.add(!success);
    
    // Эмуляция поведения пользователя (чтение результатов)
    sleep(Math.random() * 2 + 1);
  });
}
