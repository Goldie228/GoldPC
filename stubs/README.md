# Smart Stubs для GoldPC

Эта директория содержит конфигурации mock-серверов для интеграционного тестирования.

## Структура

```
stubs/
├── wiremock/
│   ├── mappings/        # Определения заглушек (JSON)
│   └── __files/         # Статические файлы ответов
└── README.md
```

## Запуск

### Через Docker Compose (с профилем stubs)

```bash
# Сначала создайте сеть (если ещё не создана)
docker network create kursovaya_goldpc-network

# Запуск только stub-серверов
docker-compose -f docker/docker-compose.stubs.yml --profile stubs up -d

# Или вместе с основными сервисами
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.stubs.yml --profile stubs up -d
```

### Сервисы

| Сервис | Порт | Описание |
|--------|------|----------|
| Prism Mock | 4010 | OpenAPI-based mock с валидацией |
| WireMock | 8080 | Гибкий HTTP mock сервер |

## Prism Mock Server

Prism использует OpenAPI спецификации из `contracts/openapi/v1/openapi.yaml`.

### Примеры запросов

```bash
# Получить список продуктов
curl http://localhost:4010/api/v1/products

# Получить продукт по ID
curl http://localhost:4010/api/v1/products/550e8400-e29b-41d4-a716-446655440001
```

## WireMock

WireMock использует маппинги из `stubs/wiremock/mappings/`.

### Примеры запросов

```bash
# Получить список продуктов
curl -H "Content-Type: application/json" http://localhost:8080/api/v1/products

# Создать заказ
curl -X POST -H "Content-Type: application/json" \
  -d '{"items": [{"productId": "123", "quantity": 1}]}' \
  http://localhost:8080/api/v1/orders

# Admin API - просмотр всех маппингов
curl http://localhost:8080/__admin/mappings
```

### Добавление новых маппингов

Создайте JSON-файл в `stubs/wiremock/mappings/`:

```json
{
  "request": {
    "method": "GET",
    "urlPath": "/api/v1/your-endpoint"
  },
  "response": {
    "status": 200,
    "jsonBody": {
      "message": "Hello from stub!"
    },
    "headers": {
      "Content-Type": "application/json"
    }
  }
}
```

### Динамические ответы (Response Templates)

WireMock поддерживает шаблоны ответов:

```json
{
  "request": {
    "method": "POST",
    "urlPath": "/api/v1/orders"
  },
  "response": {
    "status": 201,
    "jsonBody": {
      "id": "{{randomValue type='UUID'}}",
      "orderNumber": "ORD-{{randomNumber length=5}}",
      "createdAt": "{{now}}"
    },
    "transformers": ["response-template"]
  }
}
```

## Остановка

```bash
docker-compose -f docker/docker-compose.stubs.yml down