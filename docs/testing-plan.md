# GoldPC Test Plan

## Обзор

Этот документ описывает многоуровневую стратегию тестирования проекта GoldPC — платформы для сборки персональных компьютеров.

## Уровни тестирования

### 1. Unit Tests (Модульные тесты)

#### Backend (`tests/backend/GoldPC.UnitTests`)

**Стек:**
- xUnit 2.7.0 — тестовый фреймворк
- FluentAssertions 6.12.0 — fluent assertions
- Moq 4.20.70 — моки и стабы
- AutoFixture 4.18.1 — генерация тестовых данных
- Bogus 35.2.0 — генерация фейковых данных

**Структура:**
```
GoldPC.UnitTests/
├── Services/
│   ├── CatalogServiceTests.cs
│   ├── CompatibilityServiceTests.cs
│   └── OrderServiceTests.cs
├── Fakers/
│   ├── OrderFaker.cs
│   ├── ProductFaker.cs
│   └── UserFaker.cs
└── GoldPC.UnitTests.csproj
```

**Принципы FIRST:**
- **Fast** — быстрые тесты без внешних зависимостей
- **Independent** — изолированные тесты с собственными данными
- **Repeatable** — детерминированные результаты
- **Self-validating** — автоматические проверки
- **Timely** — тесты пишутся вместе с кодом

**Покрытие:**
- Сервисы бизнес-логики
- Валидаторы
- Мапперы
- Утилиты

#### Frontend (`tests/frontend`)

**Стек:**
- Vitest — тестовый фреймворк
- @vitejs/plugin-react
- happy-dom — тестовое окружение
- v8 — coverage provider

**Конфигурация:**
```typescript
// vitest.config.ts
{
  environment: 'happy-dom',
  globals: true,
  coverage: {
    thresholds: {
      lines: 70,
      functions: 70,
      branches: 60,
      statements: 70
    }
  }
}
```

**Структура:**
```
tests/frontend/
├── src/
│   ├── components/
│   │   └── ProductCard.test.tsx
│   ├── contract/
│   │   └── catalog-consumer.test.ts
│   └── test/
│       └── setup.ts
├── vitest.config.ts
├── vitest.contract.config.ts
└── package.json
```

---

### 2. Integration Tests (Интеграционные тесты)

#### Backend (`tests/backend/GoldPC.IntegrationTests`)

**Стек:**
- Microsoft.AspNetCore.Mvc.Testing
- Testcontainers (PostgreSQL, Redis)
- FluentAssertions

**Структура:**
```
GoldPC.IntegrationTests/
├── Api/
│   └── ProductsApiTests.cs
├── Fixtures/
│   └── DatabaseFixture.cs
└── CatalogApiTests.cs
```

**Объекты тестирования:**
- API endpoints
- Взаимодействие с базой данных
- Внешние сервисы (через контейнеры)

---

### 3. Contract Tests (Контрактные тесты)

#### Provider Tests (`tests/backend/GoldPC.ContractTests`)

**Стек:**
- PactNet
- xUnit

**Структура:**
```
GoldPC.ContractTests/
├── CatalogProviderTests.cs
├── Providers/
│   └── CatalogApiProviderTests.cs
└── GoldPC.ContractTests.csproj
```

**Цель:**
- Верификация API контрактов
- Совместимость между сервисами

#### Consumer Tests (`tests/frontend/src/contract`)

**Файлы:**
- `catalog-consumer.test.ts`

**Pacts:**
- `pacts/catalog-consumer.test.ts`
- `pacts/frontend-catalog.json` (в `contracts/pacts/`)

---

### 4. E2E Tests (End-to-End тесты)

#### Расположение: `tests/e2e`

**Стек:**
- Playwright — браузерная автоматизация
- Cucumber.js — BDD фреймворк
- Page Object Model паттерн

**Структура:**
```
tests/e2e/
├── features/
│   └── pc-builder.feature      # Gherkin сценарии
├── pages/
│   ├── CartPage.ts             # Page Object: Корзина
│   ├── CatalogPage.ts          # Page Object: Каталог
│   ├── CheckoutPage.ts         # Page Object: Оформление заказа
│   └── LoginPage.ts             # Page Object: Авторизация
├── specs/
│   ├── auth/
│   │   └── login.spec.ts
│   ├── catalog/
│   │   └── catalog.spec.ts
│   └── orders/
│       └── create-order.spec.ts
├── steps/
│   └── pc-builder.steps.ts     # Step definitions
├── playwright.config.ts
└── cucumber.js
```

**Покрываемые сценарии:**
- Аутентификация пользователя
- Просмотр каталога товаров
- Добавление товаров в корзину
- Оформление заказа
- Сборка ПК (PC Builder)

---

### 5. Load/Performance Tests

#### Расположение: `tests/load` и `tests/performance`

Эти директории содержат тесты производительности и нагрузочного тестирования.

---

## Структура тестовой директории

```
tests/
├── ArchitectureTests/           # Архитектурные тесты
├── AuthService.Tests/           # Тесты сервиса авторизации
├── backend/
│   ├── GoldPC.ContractTests/   # Контрактные тесты (Provider)
│   ├── GoldPC.IntegrationTests/ # Интеграционные тесты
│   └── GoldPC.UnitTests/       # Модульные тесты
├── CatalogService.Tests/       # Тесты сервиса каталога
├── e2e/                        # E2E тесты (Playwright + Cucumber)
├── frontend/                   # Frontend тесты (Vitest)
├── load/                       # Нагрузочные тесты
├── OrdersService.Tests/        # Тесты сервиса заказов
├── performance/                # Тесты производительности
├── PCBuilderService.Tests/     # Тесты конструктора ПК
├── ServicesService.Tests/      # Тесты сервисов
├── WarrantyService.Tests/      # Тесты гарантии
└── README.md
```

---

## Запуск тестов

### Backend Unit Tests
```bash
cd tests/backend/GoldPC.UnitTests
dotnet test
```

### Backend Integration Tests
```bash
cd tests/backend/GoldPC.IntegrationTests
dotnet test
```

### Frontend Tests
```bash
cd tests/frontend
npm test
npm run test:coverage
```

### E2E Tests
```bash
cd tests/e2e
npm test
npx playwright test
```

---

## Метрики качества

| Уровень | Целевое покрытие | Инструмент |
|---------|------------------|------------|
| Unit | 70%+ lines | coverlet / v8 |
| Integration | 60%+ API endpoints | Testcontainers |
| E2E | Critical user flows | Playwright |

---

## CI/CD Integration

Тесты интегрированы в пайплайн CI/CD:

1. **Pre-commit:** Линтинг + быстрые unit тесты
2. **PR validation:** Все уровни тестов + контрактные тесты
3. **Pre-deployment:** E2E тесты на staging
4. **Post-deployment:** Smoke tests + мониторинг

---

## Ответственные

- **QA Lead:** Общая координация тестирования
- **Backend Team:** Unit + Integration тесты
- **Frontend Team:** Component + Contract тесты
- **DevOps:** E2E + Performance тесты

---

*Последнее обновление: Март 2026*