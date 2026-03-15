import http from 'k6';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

/**
 * Stress Test для GoldPC
 * 
 * Стресс-тест проверяет поведение системы под высокой нагрузкой.
 * 
 * Цель: Определить пределы производительности системы
 * и убедиться, что уровень ошибок остаётся ниже 1% при росте нагрузки.
 * 
 * Запуск: k6 run stress-test.js
 */

// Кастомные метрики
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');

// Базовый URL API
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// Конфигурация: плавное увеличение до 100 пользователей за 1 минуту
export const options = {
    stages: [
        // Разогрев: 10 пользователей
        { duration: '10s', target: 10 },
        // Плавное увеличение до 100 пользователей за 1 минуту
        { duration: '1m', target: 100 },
        // Удержание нагрузки
        { duration: '30s', target: 100 },
        // Снижение нагрузки
        { duration: '20s', target: 0 },
    ],
    
    // Пороги производительности
    thresholds: {
        // Время ответа: 95% запросов < 500ms
        http_req_duration: ['p(95)<500'],
        // Уровень ошибок < 1%
        http_req_failed: ['rate<0.01'],
        // Кастомная метрика ошибок < 1%
        error_rate: ['rate<0.01'],
    },
};

export default function () {
    // GET /api/products - получение списка продуктов
    const response = http.get(`${BASE_URL}/api/products`);

    // Записываем время ответа
    responseTime.add(response.timings.duration);

    // Проверки
    const success = check(response, {
        'status is 200': (r) => r.status === 200,
        'response time < 500ms': (r) => r.timings.duration < 500,
        'response has valid structure': (r) => {
            try {
                const body = r.json();
                // Проверяем, что ответ содержит данные
                return body !== null && body !== undefined;
            } catch {
                return false;
            }
        },
    });

    // Записываем результат в метрику ошибок
    errorRate.add(!success);

    // Пауза между запросами (имитация пользователя)
    sleep(Math.random() * 2 + 1);
}

/**
 * Ожидаемые результаты:
 * - Плавное увеличение нагрузки от 10 до 100 VU за 1 минуту
 * - Уровень ошибок < 1% на протяжении всего теста
 * - 95% запросов имеют время ответа < 500ms
 * - Система продолжает отвечать на запросы при пиковой нагрузке
 * 
 * Интерпретация результатов:
 * - Если error_rate > 1%: система не справляется с нагрузкой
 * - Если p(95) > 500ms: необходимо оптимизировать производительность
 * - Если тест проходит успешно: система готова к нагрузке до 100 пользователей
 */