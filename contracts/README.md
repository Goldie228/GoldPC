# GoldPC API Contracts

Репозиторий API-контрактов для системы компьютерного магазина GoldPC с сервисным центром.

## Структура

```
contracts/
├── openapi/
│   └── v1/
│       ├── openapi.yaml              # Главная спецификация REST API
│       └── components/
│           ├── schemas/              # Схемы данных
│           │   ├── common.yaml       # Общие типы и enums
│           │   ├── user.yaml         # Пользователи
│           │   ├── product.yaml      # Товары
│           │   ├── order.yaml        # Заказы
│           │   ├── service.yaml      # Услуги
│           │   ├── warranty.yaml     # Гарантия
│           │   └── pcbuilder.yaml    # Конструктор ПК
│           ├── parameters/           # Параметры запросов
│           └── responses/            # Стандартные ответы
├── asyncapi/
│   └── v1/
│       └── asyncapi.yaml             # Спецификация событий
├── pacts/                            # Pact контракты
│   ├── frontend-catalog.json
│   └── frontend-orders.json
├── adr/                              # Architecture Decision Records
│   └── ADR-001-api-contracts.md
└── .spectral.yaml                    # Правила линтинга
```

## Спецификации

### OpenAPI (REST API)

Полная спецификация REST API версии 1.0.

**Endpoints:**

| Тег | Описание | Endpoints |
|-----|----------|-----------|
| Auth | Аутентификация | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` |
| Users | Пользователи | `/users/me` |
| Catalog | Каталог товаров | `/catalog/products`, `/catalog/categories`, `/catalog/manufacturers` |
| PCBuilder | Конструктор ПК | `/pcbuilder/configurations`, `/pcbuilder/check-compatibility` |
| Orders | Заказы | `/orders`, `/orders/cart`, `/orders/{id}` |
| Services | Сервисный центр | `/services`, `/services/types` |
| Warranty | Гарантия | `/warranties`, `/warranties/check` |
| Admin | Администрирование | `/admin/users`, `/admin/products` |

### AsyncAPI (Events)

Спецификация событийного взаимодействия:

- **Order Events**: `order.created`, `order.status_changed`, `order.cancelled`
- **Service Events**: `service_request.created`, `service_request.assigned`, `service_request.completed`
- **Warranty Events**: `warranty.created`, `warranty.expiring`, `warranty.annulled`
- **Notifications**: `notifications.user`, `notifications.broadcast`
- **Inventory Events**: `inventory.low_stock`, `inventory.updated`

## Использование

### Валидация спецификаций

```bash
# Установка Spectral
npm install -g @stoplight/spectral-cli

# Валидация OpenAPI
spectral lint openapi/v1/openapi.yaml

# Валидация с правилами проекта
spectral lint openapi/v1/openapi.yaml -r .spectral.yaml
```

### Генерация документации

```bash
# Swagger UI через Docker
docker run -p 8080:8080 \
  -e SWAGGER_JSON=/openapi.yaml \
  -v $(pwd)/openapi/v1/openapi.yaml:/openapi.yaml \
  swaggerapi/swagger-ui

# Открыть http://localhost:8080
```

### Генерация клиентского кода

```bash
# Установка OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# TypeScript Axios клиент
openapi-generator-cli generate \
  -i openapi/v1/openapi.yaml \
  -g typescript-axios \
  -o ./src/api/client

# C# клиент
openapi-generator-cli generate \
  -i openapi/v1/openapi.yaml \
  -g csharp-netcore \
  -o ./src/GoldPC.Client

# Python клиент
openapi-generator-cli generate \
  -i openapi/v1/openapi.yaml \
  -g python \
  -o ./src/goldpc_client
```

### Контрактное тестирование

```bash
# Установка Pact
npm install @pact-foundation/pact

# Запуск consumer тестов
npm run test:pact

# Публикация в Pact Broker
npm run pact:publish

# Provider verification
npm run pact:verify
```

## Разработка

### Добавление нового endpoint

1. Определить схему запроса/ответа в `components/schemas/`
2. Добавить параметры в `components/parameters/` (если нужно)
3. Добавить endpoint в `openapi.yaml`
4. Запустить валидацию: `spectral lint openapi/v1/openapi.yaml`
5. Создать PR с изменениями

### Правила именования

| Элемент | Правило | Пример |
|---------|---------|--------|
| Пути | kebab-case | `/pc-builder/configurations` |
| operationId | camelCase | `getProductById` |
| Schemas | PascalCase | `ProductListResponse` |
| Properties | camelCase | `productName`, `createdAt` |
| Enums | PascalCase | `OrderStatus`, `ServiceType` |

### Версионирование

- **URL Path**: `/api/v1/resource`
- **Non-breaking changes**: Добавление optional полей, новых endpoints
- **Breaking changes**: Новая мажорная версия (v2)

## CI/CD интеграция

```yaml
# .github/workflows/api-contracts.yml
name: API Contracts

on:
  push:
    paths:
      - 'contracts/**'

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Spectral
        run: npm install -g @stoplight/spectral-cli
      - name: Lint OpenAPI
        run: spectral lint contracts/openapi/v1/openapi.yaml -r contracts/.spectral.yaml

  generate-client:
    needs: lint
    runs-on: ubuntu-latest
    steps:
      - name: Generate TypeScript client
        uses: openapi-generators/openapitools-generator-action@v1
        with:
          generator: typescript-axios
          openapi-spec: contracts/openapi/v1/openapi.yaml
```

## Документация

- [ADR-001: Стратегия API-контрактов](adr/ADR-001-api-contracts.md)
- [ТЗ GoldPC](../development-plan/appendices/ТЗ_GoldPC.md)

## Контакты

- Email: api@goldpc.by
- Сайт: https://goldpc.by