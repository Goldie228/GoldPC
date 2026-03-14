# GoldPC Testing Infrastructure

## 📁 Структура тестов

```
tests/
├── backend/
│   ├── GoldPC.UnitTests/           # Модульные тесты бэкенда
│   │   ├── Fakers/                 # Генераторы тестовых данных (Bogus)
│   │   │   ├── ProductFaker.cs
│   │   │   ├── UserFaker.cs
│   │   │   └── OrderFaker.cs
│   │   └── Services/               # Тесты сервисов
│   │       ├── CatalogServiceTests.cs
│   │       └── OrderServiceTests.cs
│   ├── GoldPC.IntegrationTests/    # Интеграционные тесты
│   │   ├── Fixtures/               # Testcontainers, WebApplicationFactory
│   │   └── Api/                    # API endpoint тесты
│   └── GoldPC.ContractTests/       # Контрактные тесты (Pact Provider)
│       └── Providers/
├── frontend/
│   ├── src/
│   │   ├── test/                   # Конфигурация тестов
│   │   ├── contract/               # Pact Consumer тесты
│   │   └── components/             # Тесты React компонентов
│   ├── package.json
│   └── vitest.config.ts
├── e2e/                           # E2E тесты (Playwright)
│   ├── specs/
│   │   ├── auth/                   # Тесты авторизации
│   │   └── orders/                 # Тесты заказов
│   ├── pages/                      # Page Object Model
│   │   ├── LoginPage.ts
│   │   └── CatalogPage.ts
│   └── playwright.config.ts
├── load/                          # Нагрузочные тесты (k6)
│   └── k6.config.js
├── pacts/                         # Pact контракты
└── README.md
```

## 🚀 Быстрый старт

### Backend тесты
```bash
# Все тесты бэкенда
dotnet test

# Только Unit тесты
dotnet test --filter "FullyQualifiedName~UnitTests"

# Только интеграционные тесты
dotnet test --filter "FullyQualifiedName~IntegrationTests"

# Только контрактные тесты
dotnet test --filter "FullyQualifiedName~ContractTests"

# С покрытием кода
dotnet test --collect:"XPlat Code Coverage"

# Генерация отчёта о покрытии
reportgenerator -reports:"./coverage/*/coverage.cobertura.xml" -targetdir:"./coverage/report" -reporttypes:Html
```

### Frontend тесты
```bash
cd tests/frontend

# Установка зависимостей
npm install

# Unit тесты
npm test

# С покрытием
npm run test:coverage

# Контрактные тесты (Pact Consumer)
npm run test:contract

# UI режим Vitest
npm run test:ui
```

### E2E тесты
```bash
cd tests/e2e

# Установка Playwright
npm install @playwright/test
npx playwright install

# Все тесты
npx playwright test

# Конкретный браузер
npx playwright test --project=chromium

# UI режим
npx playwright test --ui

# С отладкой
npx playwright test --debug

# Генерация отчёта
npx playwright show-report
```

### Нагрузочные тесты
```bash
cd tests/load

# Локальный запуск
k6 run k6.config.js

# С кастомным URL
BASE_URL=https://staging.goldpc.com k6 run k6.config.js

# С выводом в InfluxDB
k6 run --out influxdb=http://localhost:8086/k6 k6.config.js
```

## 📊 Покрытие кода

| Компонент | Минимум | Инструмент |
|-----------|---------|------------|
| Backend Services | 80% | coverlet + ReportGenerator |
| Frontend Components | 70% | Vitest coverage v8 |
| Critical Paths | 90% | E2E tests |
| API Contracts | 100% | Pact verification |

### Генерация отчётов

**Backend:**
```bash
# Установка ReportGenerator
dotnet tool install -g dotnet-reportgenerator-globaltool

# Генерация отчёта
reportgenerator -reports:"coverage/*/coverage.cobertura.xml" -targetdir:"coverage/report"
```

**Frontend:**
```bash
npm run test:coverage
# Откроется HTML отчёт в coverage/index.html
```

## 🔧 Инструменты

### Backend (.NET 8)
- **xUnit** — тестовый фреймворк
- **FluentAssertions** — fluent assertions
- **Moq** — mocking библиотека
- **AutoFixture** — генерация тестовых данных
- **Bogus** — генерация реалистичных данных
- **Testcontainers** — Docker-контейнеры для тестов
- **PactNet** — контрактные тесты

### Frontend (React + TypeScript)
- **Vitest** — тестовый раннер
- **React Testing Library** — тестирование компонентов
- **MSW** — Mock Service Worker для API
- **@faker-js/faker** — генерация данных
- **Pact JS** — контрактные тесты

### E2E (Playwright)
- **Playwright** — E2E тесты
- **Page Object Model** — паттерн для страниц

### Нагрузочные (k6)
- **k6** — нагрузочное тестирование
- **InfluxDB + Grafana** — визуализация метрик

## 📋 Типы тестов

### 1. Модульные тесты (Unit Tests)
- Изолированная проверка компонентов
- Использование моков для зависимостей
- Быстрое выполнение

### 2. Интеграционные тесты
- Проверка взаимодействия с БД (PostgreSQL)
- Проверка кэширования (Redis)
- API endpoint тесты

### 3. Контрактные тесты (Pact)
- Consumer-driven contracts
- Проверка соответствия API спецификации
- Автоматическая публикация в Pact Broker

### 4. E2E тесты
- Критические пользовательские сценарии
- Регистрация и авторизация
- Создание заказа
- Просмотр каталога

### 5. Нагрузочные тесты
- Проверка производительности
- Пороги: p95 < 500ms, p99 < 1000ms
- Тестирование под нагрузкой 100-200 VU

## 🔄 CI/CD интеграция

Тесты автоматически запускаются в GitHub Actions:

```yaml
# .github/workflows/tests.yml

jobs:
  backend-unit-tests:    # При каждом коммите
  frontend-unit-tests:   # При каждом коммите
  contract-tests:        # При каждом PR
  integration-tests:     # При каждом PR
  e2e-tests:            # После прохождения unit тестов
  load-tests:           # Только для main ветки
```

## 📈 Метрики и отчёты

### Code Coverage
- Загрузка в Codecov
- Badge в README
- Проверка порогов в CI

### Playwright Report
- HTML отчёт с трейсами
- Скриншоты при падениях
- Видео тестов

### k6 Metrics
- Response time (p95, p99)
- Error rate
- Throughput (RPS)

## 🔗 Связанные документы

- [08-testing.md](../development-plan/08-testing.md) — Стратегия тестирования
- [10-e2e-and-load-testing.md](../development-plan/10-e2e-and-load-testing.md) — E2E и нагрузочные тесты
- [04-stub-generation.md](../development-plan/04-stub-generation.md) — Заглушки и моки

## ✅ Критерии готовности

- [ ] Все модульные тесты проходят
- [ ] Покрытие кода ≥70%
- [ ] Контрактные тесты проходят
- [ ] E2E тесты для критических сценариев
- [ ] Нет пропущенных (skipped) тестов
- [ ] CI pipeline настроен

---

*Создано согласно плану разработки GoldPC.*
