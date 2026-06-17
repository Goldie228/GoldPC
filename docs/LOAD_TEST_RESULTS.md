# Результаты нагрузочного тестирования GoldPC

> Дата проверки скриптов: 2026-06-17
> Статус: Скрипты исправлены, k6 не установлен — тесты не запускались

---

## 1. Обзор тестов

### 1.1 Smoke Test (`tests/load/smoke-test.js`)

| Параметр | Значение |
|----------|----------|
| **Цель** | Базовая проверка работоспособности каталога при минимальной нагрузке |
| **VUs** | 10 |
| **Длительность** | 1 минута |
| **Эндпоинт** | `GET /api/v1/catalog/products?page=1&limit=20` |
| **Threshold: p(95)** | < 200ms |
| **Threshold: ошибки** | < 1% |

### 1.2 Stress Test (`tests/load/stress-test.js`)

| Параметр | Значение |
|----------|----------|
| **Цель** | Пределы производительности при росте нагрузки |
| **VUs** | 10 → 100 (плавный ramp-up за 1 минуту) |
| **Удержание** | 30 секунд на пике (100 VU) |
| **Длительность** | ~1 мин 40 сек |
| **Эндпоинт** | `GET /api/v1/catalog/products?page=1&limit=20` |
| **Threshold: p(95)** | < 500ms |
| **Threshold: ошибки** | < 1% |

### 1.3 Search Performance (`tests/load/search_performance.js`)

| Параметр | Значение |
|----------|----------|
| **Цель** | Производительность поиска и фильтрации товаров |
| **VUs** | 50 → 100 (разминка + пик) |
| **Длительность** | ~6 минут |
| **Эндпоинт** | `GET /api/v1/catalog/products?search=...&category=...&priceMin=...&priceMax=...` |
| **Threshold: p(95)** | < 500ms |
| **Threshold: search_duration p(95)** | < 400ms |
| **Threshold: ошибки** | < 1% |

### 1.4 Full Config (`tests/load/k6.config.js`)

| Параметр | Значение |
|----------|----------|
| **Цель** | Комплексное тестирование: каталог + конструктор ПК + заказы |
| **Сценарии** | 3 параллельных с ramping-vus |
| **Длительность** | ~9 минут (с staggered start) |
| **Threshold: p(95)** | < 500ms |
| **Threshold: ошибки** | < 1% |

**Сценарии:**

| Сценарий | VUs | Начало | Длительность | Эндпоинты |
|----------|-----|--------|-------------|-----------|
| Catalog Browsing | 0→100 | сразу | 9 мин | `GET /api/v1/catalog/products`, `GET /api/v1/catalog/categories`, поиск |
| PC Builder | 0→50 | +1 мин | 8 мин | `POST /api/v1/PCBuilder/check-compatibility`, `POST /api/v1/PCBuilder/calculate-power`, `POST /api/v1/PCBuilder/configurations` |
| Order Creation | 0→50 | +2 мин | 7 мин | `GET /api/v1/catalog/products`, `POST /api/v1/orders`, `GET /api/v1/orders` |

---

## 2. Исправленные ошибки в скриптах

### 2.1 Неверные импорты (smoke-test.js, stress-test.js)

```diff
- import http from 'k6';
+ import http from 'k6/http';
```

Модуль `k6` не экспортирует `http` напрямую. Правильный путь — `k6/http`.

### 2.2 Несуществующий эндпоинт `/api/products`

```diff
- const response = http.get(`${BASE_URL}/api/products`);
+ const response = http.get(`${BASE_URL}/api/v1/catalog/products?page=1&limit=20`);
```

Эндпоинт `/api/products` не существует. Каталог товаров доступен через `api/v1/catalog/products`.

### 2.3 Несуществующий эндпоинт поиска `/api/v1/catalog/products/search`

```diff
- const searchResponse = http.get(`${BASE_URL}/api/v1/catalog/products/search?q=${query}`);
+ const searchResponse = http.get(`${BASE_URL}/api/v1/catalog/products?q=${query}&page=1&limit=20`);
```

Отдельного эндпоинта поиска нет. Поиск выполняется через query-параметр `q` на `/api/v1/catalog/products`.

### 2.4 Неверный регистр пути PCBuilder

```diff
- `${BASE_URL}/api/v1/pcbuilder/check-compatibility`
+ `${BASE_URL}/api/v1/PCBuilder/check-compatibility`

- `${BASE_URL}/api/v1/pcbuilder/calculate-power`
+ `${BASE_URL}/api/v1/PCBuilder/calculate-power`

- `${BASE_URL}/api/v1/pcbuilder/configurations`
+ `${BASE_URL}/api/v1/PCBuilder/configurations`
```

Контроллер использует `[Route("api/v1/[controller]")]`, где `[controller]` резолвится в `PCBuilder` (PascalCase).

### 2.5 Неверный регистр пути Auth

```diff
- `${BASE_URL}/api/v1/auth/login`
+ `${BASE_URL}/api/v1/Auth/login`
```

Контроллер `AuthController` использует PascalCase в `[Route("api/v1/[controller]")]`.

---

## 3. Текущий статус

| Проверка | Статус |
|----------|--------|
| k6 установлен | ❌ Нет |
| Скрипты исправлены | ✅ Да |
| Endpoints соответствуют API | ✅ Да |
| Импорты корректны | ✅ Да |
| Тесты запускались | ❌ Нет (k6 не установлен) |

---

## 4. Как запустить тесты

### 4.1 Установка k6

```bash
# Ubuntu/Debian (snap)
sudo snap install k6

# Или через apt (добавить репозиторий)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D68
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### 4.2 Запуск тестов

```bash
# Smoke test (быстрая проверка, 10 VU, 1 мин)
k6 run tests/load/smoke-test.js

# Stress test (нагрузка до 100 VU)
k6 run tests/load/stress-test.js

# Поиск (100 VU с фильтрацией)
k6 run tests/load/search_performance.js

# Полный конфиг (3 сценария параллельно)
k6 run tests/load/k6.config.js

# С внешним URL
BASE_URL=https://api.goldpc.example.com k6 run tests/load/smoke-test.js
```

### 4.3 Экспорт результатов

```bash
# В JSON
k6 run --out json=results.json tests/load/smoke-test.js

# В InfluxDB (для Grafana)
K6_INFLUXDB_ORGANIZATION=myorg K6_INFLUXDB_BUCKET=mybucket \
  k6 run --out influxdb=http://localhost:8086/k6 tests/load/smoke-test.js
```

---

## 5. Пороги производительности (Thresholds)

| Метрика | Smoke | Stress | Search | Full Config |
|---------|-------|--------|--------|-------------|
| `http_req_duration p(95)` | < 200ms | < 500ms | < 500ms | < 500ms |
| `http_req_failed rate` | < 1% | < 1% | < 1% | < 1% |
| `error_rate` (кастомная) | — | < 1% | — | — |
| `search_duration p(95)` | — | — | < 400ms | — |
| `response_time p(95)` | — | — | — | < 500ms |

### Интерпретация

| Результат | Значение |
|-----------|----------|
| Все thresholds пройдены | ✅ Система готова к нагрузке |
| `p(95) > 500ms` | ⚠️ Требуется оптимизация производительности |
| `error_rate > 1%` | ❌ Система не справляется с нагрузкой |
| Timeout'ы на пике | ❌ Проблемы с БД или внешними сервисами |

---

## 6. Рекомендации по оптимизации

### 6.1 Кэширование каталога

Тесты каталога обращаются к `GET /api/v1/catalog/products` на каждый запрос. Рекомендации:

- **Redis-кэш** для часто запрашиваемых категорий (TTL 5-10 мин)
- **HTTP Cache-Headers** (`Cache-Control: public, max-age=300`) для статичных данных
- **CDN** для изображений товаров (если не реализовано)

### 6.2 Индексация БД

Для тестов поиска с параметрами `search`, `category`, `priceMin`, `priceMax`:

```sql
-- Индексы для фильтрации
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_name_search ON products USING gin(to_tsvector('russian', name));
```

### 6.3 Connection Pooling

При 100 VU каждый запрос — отдельное HTTP-соединение. Рекомендации:

- **PgBouncer** или аналогичный connection pooler для PostgreSQL
- **Пул соединений** в `CatalogDbContext` (min 10, max 100)

### 6.4 Rate Limiting

Для защиты от spike-нагрузки:

- Внедрить rate limiting на уровне API Gateway (например, 100 req/s per IP)
- Кэширование ответов каталога (самый частый endpoint)

### 6.5 Мониторинг

После запуска k6 тестов собирать параллельно:

- **CPU/Memory** на серверах CatalogService и OrdersService
- **Active connections** в PostgreSQL
- **Response time** по эндпоинтам (через Application Insights или Prometheus)

---

## 7. Тестируемые эндпоинты

| Эндпоинт | Метод | Сервис | Тестируется в |
|----------|-------|--------|---------------|
| `/api/v1/catalog/products` | GET | CatalogService | Все тесты |
| `/api/v1/catalog/categories` | GET | CatalogService | k6.config.js |
| `/api/v1/PCBuilder/check-compatibility` | POST | PCBuilderService | k6.config.js |
| `/api/v1/PCBuilder/calculate-power` | POST | PCBuilderService | k6.config.js |
| `/api/v1/PCBuilder/configurations` | POST | PCBuilderService | k6.config.js |
| `/api/v1/orders` | POST | OrdersService | k6.config.js |
| `/api/v1/orders` | GET | OrdersService | k6.config.js |
| `/api/v1/Auth/login` | POST | AuthService | k6.config.js (mock) |

---

## 8. Следующие шаги

1. **Установить k6** (`sudo snap install k6`)
2. **Запустить smoke test** — убедиться что система отвечает
3. **Запустить stress test** — найти предел производительности
4. **Настроить InfluxDB + Grafana** — для визуализации метрик в реальном времени
5. **Автоматизировать** — добавить k6 в CI/CD (GitHub Actions)
