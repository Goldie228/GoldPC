# Этап 10: E2E и нагрузочное тестирование

## 🎭 E2E + НАГРУЗОЧНОЕ ТЕСТИРОВАНИЕ

**Версия документа:** 1.0  
**Длительность этапа:** 2-3 недели  
**Ответственный:** QA, TIER-3 Агент

---

## Цель этапа

Провести end-to-end тестирование всех пользовательских сценариев и нагрузочное тестирование для проверки производительности системы.

---

## Входные данные

| Данные | Источник |
|--------|----------|
| Интегрированная система | [09-code-review-and-integration.md](./09-code-review-and-integration.md) |
| Тестовые данные | [04-stub-generation.md](./04-stub-generation.md) |
| Требования к производительности | ТЗ (НФТ-1.x, НФТ-2.x) |

---

## 10.1 E2E Testing

### Стек инструментов

```
E2E Testing Stack:
├── Playwright (основной инструмент)
│   ├── Chromium
│   ├── Firefox
│   └── WebKit
├── Cucumber (BDD)
├── Allure (отчёты)
└── Docker (изоляция)
```

### Структура E2E тестов

```
tests/e2e/
├── specs/
│   ├── auth/
│   │   ├── login.spec.ts
│   │   ├── register.spec.ts
│   │   └── password-reset.spec.ts
│   ├── catalog/
│   │   ├── browse-products.spec.ts
│   │   ├── search.spec.ts
│   │   └── filters.spec.ts
│   ├── pc-builder/
│   │   ├── create-config.spec.ts
│   │   ├── compatibility-check.spec.ts
│   │   └── save-load.spec.ts
│   ├── orders/
│   │   ├── create-order.spec.ts
│   │   ├── track-order.spec.ts
│   │   └── cancel-order.spec.ts
│   └── admin/
│       ├── user-management.spec.ts
│       └── product-management.spec.ts
├── fixtures/
│   ├── auth.fixture.ts
│   ├── catalog.fixture.ts
│   └── order.fixture.ts
├── pages/
│   ├── LoginPage.ts
│   ├── CatalogPage.ts
│   ├── ProductPage.ts
│   └── CartPage.ts
├── utils/
│   ├── api-helpers.ts
│   ├── wait-helpers.ts
│   └── data-generators.ts
└── playwright.config.ts
```

### Пример E2E теста

```typescript
// tests/e2e/specs/orders/create-order.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { CatalogPage } from '../../pages/CatalogPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';

test.describe('Создание заказа', () => {
  let loginPage: LoginPage;
  let catalogPage: CatalogPage;
  let cartPage: CartPage;
  let checkoutPage: CheckoutPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    catalogPage = new CatalogPage(page);
    cartPage = new CartPage(page);
    checkoutPage = new CheckoutPage(page);
    
    // Логин
    await page.goto('/login');
    await loginPage.login('test@example.com', 'password123');
  });

  test('Успешное создание заказа с самовывозом', async ({ page }) => {
    // Добавление товара в корзину
    await catalogPage.gotoCategory('cpu');
    await catalogPage.selectProduct('AMD Ryzen 9 7950X');
    await catalogPage.addToCart();
    
    // Проверка корзины
    await cartPage.goto();
    await expect(cartPage.items).toHaveCount(1);
    await expect(cartPage.total).toContainText('59 999');
    
    // Оформление заказа
    await cartPage.proceedToCheckout();
    
    // Заполнение данных
    await checkoutPage.selectDeliveryMethod('pickup');
    await checkoutPage.selectPaymentMethod('online');
    
    // Подтверждение
    await checkoutPage.confirmOrder();
    
    // Проверка результата
    await expect(page).toHaveURL(/\/orders\/\d+/);
    await expect(page.locator('.order-status')).toContainText('Новый');
    await expect(page.locator('.order-number')).toBeVisible();
  });

  test('Успешное создание заказа с доставкой', async ({ page }) => {
    await catalogPage.gotoCategory('gpu');
    await catalogPage.selectProduct('RTX 4090');
    await catalogPage.addToCart();
    
    await cartPage.goto();
    await cartPage.proceedToCheckout();
    
    await checkoutPage.selectDeliveryMethod('delivery');
    await checkoutPage.fillDeliveryAddress({
      city: 'Минск',
      street: 'ул. Примерная',
      house: '1',
      apartment: '10'
    });
    await checkoutPage.selectPaymentMethod('on-receipt');
    
    await checkoutPage.confirmOrder();
    
    await expect(page.locator('.delivery-info')).toContainText('Минск');
    await expect(page.locator('.payment-method')).toContainText('При получении');
  });

  test('Ошибка при недостаточном количестве товара', async ({ page }) => {
    // Товар с количеством 1 на складе
    await catalogPage.gotoCategory('ram');
    await catalogPage.selectProduct('DDR5-6000-32GB-limited');
    
    // Попытка добавить 2 штуки
    await catalogPage.setQuantity(2);
    await catalogPage.addToCart();
    
    // Ожидание ошибки
    await expect(page.locator('.error-message')).toContainText(
      'Недостаточно товара на складе'
    );
  });

  test('История заказов отображается корректно', async ({ page }) => {
    await page.goto('/orders');
    
    // Проверка списка заказов
    await expect(page.locator('.orders-list')).toBeVisible();
    
    // Фильтрация по статусу
    await page.selectOption('#status-filter', 'completed');
    await expect(page.locator('.order-item')).toHaveCount(3);
    
    // Детали заказа
    await page.click('.order-item:first-child >> text=Подробнее');
    await expect(page.locator('.order-details')).toBeVisible();
  });
});
```

### Page Object Model

```typescript
// tests/e2e/pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('.error-message');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async expectError(message: string) {
    await expect(this.errorMessage).toContainText(message);
  }
}
```

### BDD с Cucumber

```gherkin
# tests/e2e/features/pc-builder.feature
Feature: Конструктор ПК

  Scenario: Создание совместимой конфигурации
    Given Я на странице конструктора
    When Я выбираю процессор "AMD Ryzen 9 7950X"
    And Я выбираю материнскую плату с сокетом "AM5"
    And Я выбираю оперативную память "DDR5-6000 32GB"
    And Я выбираю видеокарту "RTX 4090"
    And Я выбираю блок питания "850W"
    Then Конфигурация должна быть совместимой
    And Рекомендуемая мощность блока питания должна быть не менее "750W"
    And Общая цена должна отображаться корректно

  Scenario: Обнаружение несовместимости
    Given Я на странице конструктора
    When Я выбираю процессор "AMD Ryzen 9 7950X" с сокетом "AM5"
    And Я выбираю материнскую плату с сокетом "LGA1700"
    Then Должно отобразиться предупреждение о несовместимости
    And Кнопка "Сохранить" должна быть отключена

  Scenario: Сохранение конфигурации
    Given Я авторизован как "user@example.com"
    And Я создал совместимую конфигурацию
    When Я нажимаю "Сохранить конфигурацию"
    And Я ввожу название "Игровой ПК 2024"
    Then Конфигурация должна сохраниться в моём профиле
    And Я должен видеть сообщение "Конфигурация сохранена"
```

```typescript
// tests/e2e/steps/pc-builder.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

Given('Я на странице конструктора', async function () {
  await this.page.goto('/pc-builder');
});

When('Я выбираю процессор {string}', async function (productName: string) {
  await this.page.click(`text=${productName}`);
  await this.page.click('button:has-text("Добавить в конфигурацию")');
});

Then('Конфигурация должна быть совместимой', async function () {
  const compatibilityStatus = await this.page.locator('.compatibility-status').textContent();
  expect(compatibilityStatus).toContain('Совместимо');
});
```

---

## 10.2 Нагрузочное тестирование

### k6 Configuration

```javascript
// tests/load/k6.config.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up
    { duration: '5m', target: 100 },  // Steady
    { duration: '2m', target: 200 },  // Ramp up
    { duration: '5m', target: 200 },  // Steady
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export default function () {
  // Сценарий: Просмотр каталога
  const catalogResponse = http.get(`${BASE_URL}/api/v1/catalog/products?page=1&limit=20`);
  
  check(catalogResponse, {
    'Catalog status is 200': (r) => r.status === 200,
    'Catalog response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(catalogResponse.status !== 200);
  
  sleep(1);
  
  // Сценарий: Поиск товаров
  const searchResponse = http.get(`${BASE_URL}/api/v1/catalog/products/search?q=ryzen`);
  
  check(searchResponse, {
    'Search status is 200': (r) => r.status === 200,
  });
  
  errorRate.add(searchResponse.status !== 200);
  
  sleep(1);
}

// Сценарий создания заказа
export function orderScenario() {
  // Логин
  const loginResponse = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    email: 'loadtest@example.com',
    password: 'testpassword123'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const token = loginResponse.json('accessToken');
  
  // Создание заказа
  const orderResponse = http.post(`${BASE_URL}/api/v1/orders`, JSON.stringify({
    items: [
      { productId: 'product-1', quantity: 1 },
      { productId: 'product-2', quantity: 2 }
    ],
    deliveryMethod: 'pickup',
    paymentMethod: 'online'
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });
  
  check(orderResponse, {
    'Order created': (r) => r.status === 201,
  });
}
```

### Сценарии нагрузочного тестирования

```javascript
// tests/load/scenarios/catalog-load.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    // Плавное увеличение нагрузки
    ramping: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 100 },
        { duration: '10m', target: 100 },
        { duration: '5m', target: 200 },
        { duration: '10m', target: 200 },
        { duration: '5m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
    
    // Постоянная нагрузка
    constant: {
      executor: 'constant-vus',
      vus: 50,
      duration: '30m',
      gracefulStop: '30s',
    },
    
    // Пиковая нагрузка
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '10s', target: 500 },
        { duration: '1m', target: 500 },
        { duration: '10s', target: 100 },
        { duration: '1m', target: 100 },
      ],
    },
  },
};

export default function () {
  const responses = http.batch([
    ['GET', 'http://localhost:5000/api/v1/catalog/products'],
    ['GET', 'http://localhost:5000/api/v1/catalog/categories'],
  ]);

  check(responses[0], {
    'Products loaded': (r) => r.status === 200,
  });

  check(responses[1], {
    'Categories loaded': (r) => r.status === 200,
  });
}
```

### Тестирование базы данных

```javascript
// tests/load/scenarios/db-stress.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 100,
  duration: '10m',
};

// Генерация тестовых заказов
export default function () {
  const token = getAuthToken();
  
  // Создание заказа (INSERT)
  const createResponse = http.post(
    'http://localhost:5000/api/v1/orders',
    JSON.stringify(generateRandomOrder()),
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  check(createResponse, {
    'Order created': (r) => r.status === 201,
  });
  
  // Чтение заказов (SELECT)
  const orderId = createResponse.json('id');
  const readResponse = http.get(
    `http://localhost:5000/api/v1/orders/${orderId}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  
  check(readResponse, {
    'Order read': (r) => r.status === 200,
  });
  
  // Обновление статуса (UPDATE)
  const updateResponse = http.put(
    `http://localhost:5000/api/v1/orders/${orderId}/status`,
    JSON.stringify({ status: 'Processing' }),
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  check(updateResponse, {
    'Order updated': (r) => r.status === 200,
  });
}
```

---

## 10.3 Performance Budgets

### Lighthouse Configuration

```javascript
// tests/performance/lighthouse.config.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/', 'http://localhost:3000/catalog', 'http://localhost:3000/pc-builder'],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        
        // Метрики производительности
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

### Web Vitals Monitoring

```typescript
// src/frontend/src/utils/performance.ts
import { onLCP, onFID, onCLS, onFCP, onTTFB } from 'web-vitals';

interface PerformanceMetrics {
  LCP: number; // Largest Contentful Paint
  FID: number; // First Input Delay
  CLS: number; // Cumulative Layout Shift
  FCP: number; // First Contentful Paint
  TTFB: number; // Time to First Byte
}

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};

  constructor() {
    onLCP(this.reportMetric('LCP'));
    onFID(this.reportMetric('FID'));
    onCLS(this.reportMetric('CLS'));
    onFCP(this.reportMetric('FCP'));
    onTTFB(this.reportMetric('TTFB'));
  }

  private reportMetric(name: keyof PerformanceMetrics) {
    return (metric: { value: number }) => {
      this.metrics[name] = metric.value;
      this.sendToAnalytics(name, metric.value);
    };
  }

  private sendToAnalytics(name: string, value: number) {
    // Отправка в аналитику
    if (navigator.sendBeacon) {
      const data = new FormData();
      data.append('metric', name);
      data.append('value', value.toString());
      data.append('url', window.location.pathname);
      
      navigator.sendBeacon('/api/v1/analytics/performance', data);
    }
  }

  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  checkBudgets(): { passed: boolean; violations: string[] } {
    const budgets = {
      LCP: 2500,
      FID: 100,
      CLS: 0.1,
      FCP: 1800,
      TTFB: 600,
    };

    const violations: string[] = [];

    for (const [metric, budget] of Object.entries(budgets)) {
      const value = this.metrics[metric as keyof PerformanceMetrics];
      if (value !== undefined && value > budget) {
        violations.push(`${metric}: ${value}ms (budget: ${budget}ms)`);
      }
    }

    return {
      passed: violations.length === 0,
      violations,
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

---

## 10.4 Test Environment

### Docker Compose для тестирования

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  # Приложение
  backend:
    build:
      context: .
      dockerfile: Dockerfile
      target: test
    environment:
      - ASPNETCORE_ENVIRONMENT=Testing
      - ConnectionStrings__DefaultConnection=Host=postgres-test;Port=5432;Database=goldpc_test;Username=test;Password=test
    depends_on:
      - postgres-test
      - redis-test
    ports:
      - "5000:8080"

  frontend:
    build:
      context: ./src/frontend
      dockerfile: Dockerfile
      target: test
    ports:
      - "3000:3000"

  # База данных
  postgres-test:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: goldpc_test
    tmpfs:
      - /var/lib/postgresql/data

  redis-test:
    image: redis:7-alpine
    tmpfs:
      - /data

  # Playwright
  playwright:
    image: mcr.microsoft.com/playwright:v1.40.0-jammy
    volumes:
      - ./tests/e2e:/app/tests
      - ./playwright-report:/app/playwright-report
    working_dir: /app
    command: npx playwright test --reporter=html
    depends_on:
      - backend
      - frontend

  # k6
  k6:
    image: grafana/k6:latest
    volumes:
      - ./tests/load:/scripts
    command: run /scripts/k6.config.js
    depends_on:
      - backend
```

---

## 10.5 CI/CD Integration

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Environment
        run: docker-compose -f docker-compose.test.yml up -d
      
      - name: Wait for services
        run: |
          sleep 30
          curl --retry 10 --retry-delay 5 --retry-connrefused http://localhost:5000/health
      
      - name: Run E2E Tests
        run: |
          npm install
          npx playwright install
          npx playwright test --reporter=html
      
      - name: Upload Report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  load-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup k6
        uses: grafana/k6-action@v0.3.0
        with:
          filename: tests/load/k6.config.js
      
      - name: Run Load Tests
        run: k6 run tests/load/k6.config.js --out influxdb=http://localhost:8086/k6
      
      - name: Check Thresholds
        run: |
          # Парсинг результатов
          if grep -q "failed threshold" k6-output.txt; then
            echo "Load test thresholds exceeded"
            exit 1
          fi

  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
      
      - name: Install Lighthouse CI
        run: npm install -g @lhci/cli@0.12.x
      
      - name: Run Lighthouse CI
        run: |
          lhci autorun --upload.target=temporary-public-storage
      
      - name: Check Performance Budget
        run: |
          node scripts/check-lighthouse-budgets.js lighthouse-results.json
```

---

## Метрики производительности

| Метрика | Целевое значение | Критическое |
|---------|------------------|-------------|
| LCP (Largest Contentful Paint) | <2.5s | >4s |
| FID (First Input Delay) | <100ms | >300ms |
| CLS (Cumulative Layout Shift) | <0.1 | >0.25 |
| FCP (First Contentful Paint) | <1.8s | >3s |
| TTFB (Time to First Byte) | <600ms | >1s |
| API Response Time (p95) | <500ms | >1s |
| API Response Time (p99) | <1s | >2s |
| Error Rate | <0.1% | >1% |
| Throughput (RPS) | >100 | - |

---

## Критерии готовности (Definition of Done)

- [ ] Все критические E2E сценарии протестированы
- [ ] Нагрузочное тестирование пройдено
- [ ] Performance budgets соблюдены
- [ ] Lighthouse score ≥90
- [ ] Web Vitals в зелёной зоне
- [ ] Нет критических багов
- [ ] Отчёты сформированы

---

## Возможные риски и митигация

| Риск | Вероятность | Влияние | Меры митигации |
|------|-------------|---------|----------------|
| Флакающие тесты | Средняя | Среднее | Retries, ожидания |
| Окружение не совпадает | Средняя | Высокое | Docker, одинаковые конфигурации |
| Недостаточная нагрузка | Низкая | Среднее | Постепенное увеличение |

---

## Связанные документы

- [README.md](./README.md) — Обзор плана
- [08-testing.md](./08-testing.md) — Unit и Integration тесты
- [11-deployment.md](./11-deployment.md) — Деплой

---

*Документ создан в рамках плана разработки GoldPC.*---

*Документ создан в рамках плана разработки GoldPC.*