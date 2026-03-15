import http from 'k6';
import { check, sleep } from 'k6';

/**
 * Smoke Test для GoldPC
 * 
 * Дымовой тест проверяет базовую функциональность системы
 * при минимальной нагрузке.
 * 
 * Цель: Убедиться, что система работает под минимальной нагрузкой
 * и отвечает в разумных пределах времени.
 * 
 * Запуск: k6 run smoke-test.js
 */

// Базовый URL API
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// Конфигурация: 10 виртуальных пользователей
export const options = {
    vus: 10,
    duration: '1m',
    
    // Пороги производительности
    thresholds: {
        // Время ответа: 95% запросов должны быть < 200ms
        http_req_duration: ['p(95)<200'],
        // Без ошибок
        http_req_failed: ['rate<0.01'],
    },
};

export default function () {
    // GET /api/products - получение списка продуктов
    const response = http.get(`${BASE_URL}/api/products`);

    // Проверки
    check(response, {
        'status is 200': (r) => r.status === 200,
        'response time < 200ms': (r) => r.timings.duration < 200,
        'response has data': (r) => {
            try {
                const body = r.json();
                return body !== null && body !== undefined;
            } catch {
                return false;
            }
        },
    });

    // Небольшая пауза между запросами
    sleep(1);
}

/**
 * Ожидаемые результаты:
 * - Все 10 VU успешно выполняют запросы
 * - 100% запросов возвращают статус 200
 * - 95% запросов имеют время ответа < 200ms
 * - 0% ошибок
 */