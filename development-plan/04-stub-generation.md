# Этап 4: Генерация умных заглушек

## 🧩 Smart Stubs + Chaos Engineering

**Версия документа:** 1.0  
**Длительность этапа:** 1 неделя  
**Ответственный:** TIER-1 Архитектор, TIER-2 Разработчик

---

## Цель этапа

Создать умные заглушки (Smart Stubs) для всех API-контрактов на основе OpenAPI спецификаций, настроить генерацию тестовых данных (Faker), реализовать Chaos Engineering для тестирования отказоустойчивости, обеспечить версионирование заглушек и их интеграцию в тестовые среды.

---

## Входные данные

| Данные | Источник |
|--------|----------|
| OpenAPI спецификации | [02-contracts-and-architecture.md](./02-contracts-and-architecture.md) |
| Pact контракты | Этап 2 |
| Среда разработки | [03-environment-setup.md](./03-environment-setup.md) |
| Технологический стек | [Инструменты_для_разработки.md](./appendices/Инструменты_для_разработки.md) |

---

## Подробное описание действий

### 4.1 Генерация заглушек на основе контрактов (День 1-2)

#### Действия:

1. **Инструменты генерации заглушек**

| Инструмент | Назначение | Формат | Применение |
|------------|------------|--------|------------|
| **OpenAPI Generator** | Генерация клиентских SDK и заглушек | OpenAPI 3.x | Backend клиенты |
| **Swagger Codegen** | Генерация серверных заглушек | OpenAPI 2.x/3.x | Mock серверы |
| **Prism** | Mock сервер с валидацией | OpenAPI 3.x | Фронтенд разработка |
| **WireMock** | Гибкие HTTP заглушки | JSON/Standalone | Интеграционные тесты |
| **JSON Server** | Быстрые REST заглушки | JSON | Прототипирование |

2. **Генерация с помощью OpenAPI Generator**

```bash
# Установка
npm install @openapitools/openapi-generator-cli -g

# Генерация TypeScript клиента для Frontend
openapi-generator-cli generate \
  -i docs/api/openapi/catalog.yaml \
  -g typescript-axios \
  -o src/frontend/src/api/generated/catalog \
  --additional-properties=npmName=@goldpc/api-catalog

# Генерация C# клиента для Backend
openapi-generator-cli generate \
  -i docs/api/openapi/payment.yaml \
  -g csharp-netcore \
  -o src/backend/GoldPC.Clients.Payment \
  --additional-properties=targetFramework=net8.0

# Генерация серверной заглушки
openapi-generator-cli generate \
  -i docs/api/openapi/orders.yaml \
  -g aspnetcore \
  -o stubs/orders-mock-server \
  --additional-properties=aspnetCoreVersion=8.0
```

3. **Настройка Prism Mock Server**

```bash
# Установка
npm install @stoplight/prism-cli -g

# Запуск mock сервера с валидацией
prism mock docs/api/openapi/catalog.yaml \
  --host 0.0.0.0 \
  --port 4010 \
  --validate-request \
  --validate-response

# Docker запуск
docker run -it --rm \
  -v $(pwd)/docs/api/openapi:/specs \
  -p 4010:4010 \
  stoplight/prism:latest \
  mock -h 0.0.0.0 /specs/catalog.yaml
```

```yaml
# docker-compose.stubs.yml
version: '3.8'
services:
  catalog-mock:
    image: stoplight/prism:latest
    command: mock -h 0.0.0.0 /specs/catalog.yaml
    volumes:
      - ./docs/api/openapi:/specs
    ports:
      - "4010:4010"

  orders-mock:
    image: stoplight/prism:latest
    command: mock -h 0.0.0.0 /specs/orders.yaml
    volumes:
      - ./docs/api/openapi:/specs
    ports:
      - "4011:4010"

  wiremock:
    image: wiremock/wiremock:latest
    ports:
      - "8080:8080"
    volumes:
      - ./stubs/wiremock:/home/wiremock
```

4. **WireMock для сложных сценариев**

```java
// stubs/wiremock/mappings/order-created.json
{
  "request": {
    "method": "POST",
    "urlPath": "/api/v1/orders",
    "headers": {
      "Content-Type": {
        "equalTo": "application/json"
      }
    }
  },
  "response": {
    "status": 201,
    "jsonBody": {
      "id": "{{randomValue type='UUID'}}",
      "orderNumber": "ORD-{{randomNumber}}",
      "status": "New",
      "createdAt": "{{now}}"
    },
    "headers": {
      "Content-Type": "application/json"
    },
    "transformers": ["response-template"]
  }
}

// stubs/wiremock/mappings/payment-failure.json
{
  "request": {
    "method": "POST",
    "urlPath": "/api/v1/payments",
    "bodyPatterns": [
      {
        "matchesJsonPath": "$.amount",
        "equalTo": "999999"
      }
    ]
  },
  "response": {
    "status": 400,
    "jsonBody": {
      "error": "PAYMENT_FAILED",
      "message": "Превышен лимит транзакции"
    }
  }
}
```

```csharp
// Интеграция WireMock в тесты
public class WireMockFixture : IDisposable
{
    public WireMockServer Server { get; }
    public string Url => Server.Urls[0];

    public WireMockFixture()
    {
        Server = WireMockServer.Start();
        SetupDefaultStubs();
    }

    private void SetupDefaultStubs()
    {
        Server.Given(Request.Create()
            .WithPath("/api/v1/products")
            .UsingGet())
        .RespondWith(Response.Create()
            .WithStatusCode(200)
            .WithHeader("Content-Type", "application/json")
            .WithBodyAsJson(new[]
            {
                new { id = Guid.NewGuid(), name = "Product 1", price = 100 },
                new { id = Guid.NewGuid(), name = "Product 2", price = 200 }
            }));
    }

    public void Dispose()
    {
        Server?.Stop();
        Server?.Dispose();
    }
}
```

5. **JSON Server для быстрого прототипирования**

```bash
# Установка
npm install json-server -g

# Запуск
json-server --watch stubs/db.json --port 3001 --routes stubs/routes.json
```

```json
// stubs/db.json
{
  "products": [
    { "id": 1, "name": "AMD Ryzen 9 7950X", "price": 59999, "stock": 10 },
    { "id": 2, "name": "Intel Core i9-14900K", "price": 54999, "stock": 5 }
  ],
  "categories": [
    { "id": "cpu", "name": "Процессоры" },
    { "id": "gpu", "name": "Видеокарты" }
  ],
  "orders": []
}

// stubs/routes.json
{
  "/api/v1/products": "/products",
  "/api/v1/products/:id": "/products/:id",
  "/api/v1/categories": "/categories"
}
```

#### Ответственный:
- 🥇 TIER-1 Архитектор

#### Инструменты:
- OpenAPI Generator
- Prism Mock Server
- WireMock
- JSON Server

---

### 4.2 Генерация Faker данных (День 2-3)

#### Действия:

1. **Создание генераторов данных**

```csharp
// src/backend/GoldPC.Tests/Fakers/ProductFaker.cs
using Bogus;

public class ProductFaker : Faker<Product>
{
    public ProductFaker()
    {
        RuleFor(p => p.Id, f => f.Random.Guid());
        RuleFor(p => p.Name, f => f.Commerce.ProductName());
        RuleFor(p => p.Sku, f => f.Commerce.Ean13());
        RuleFor(p => p.Price, f => decimal.Parse(f.Commerce.Price(100, 100000)));
        RuleFor(p => p.Stock, f => f.Random.Int(0, 100));
        RuleFor(p => p.Category, f => f.PickRandom<ProductCategory>());
        RuleFor(p => p.Specifications, f => GenerateSpecs(f));
        RuleFor(p => p.Manufacturer, f => f.Company.CompanyName());
        RuleFor(p => p.WarrantyMonths, f => f.Random.Int(12, 36));
        RuleFor(p => p.CreatedAt, f => f.Date.Past(1));
    }

    private Dictionary<string, object> GenerateSpecs(Faker f)
    {
        return new Dictionary<string, object>
        {
            ["socket"] = f.PickRandom("AM5", "LGA1700", "AM4", "LGA1200"),
            ["frequency"] = f.Random.Int(2000, 5000) + " MHz",
            ["tdp"] = f.Random.Int(65, 250) + " W"
        };
    }
}

// Использование
var productFaker = new ProductFaker();
var products = productFaker.Generate(100);
```

2. **Генераторы для всех сущностей**

```csharp
// src/backend/GoldPC.Tests/Fakers/UserFaker.cs
public class UserFaker : Faker<User>
{
    public UserFaker()
    {
        RuleFor(u => u.Id, f => f.Random.Guid());
        RuleFor(u => u.Email, f => f.Internet.Email());
        RuleFor(u => u.FirstName, f => f.Name.FirstName());
        RuleFor(u => u.LastName, f => f.Name.LastName());
        RuleFor(u => u.Phone, f => $"+375{f.Random.Int(29, 44)}{f.Random.Int(1000000, 9999999)}");
        RuleFor(u => u.Role, f => f.PickRandom<UserRole>());
        RuleFor(u => u.CreatedAt, f => f.Date.Past(2));
    }
}

// src/backend/GoldPC.Tests/Fakers/OrderFaker.cs
public class OrderFaker : Faker<Order>
{
    public OrderFaker(List<Product> products, List<User> users)
    {
        RuleFor(o => o.Id, f => f.Random.Guid());
        RuleFor(o => o.OrderNumber, f => $"ORD-{f.Random.Int(10000, 99999)}");
        RuleFor(o => o.UserId, f => f.PickRandom(users).Id);
        RuleFor(o => o.Status, f => f.PickRandom<OrderStatus>());
        RuleFor(o => o.Items, f => GenerateItems(f, products));
        RuleFor(o => o.TotalAmount, (f, o) => o.Items.Sum(i => i.Price * i.Quantity));
        RuleFor(o => o.DeliveryMethod, f => f.PickRandom<DeliveryMethod>());
        RuleFor(o => o.PaymentMethod, f => f.PickRandom<PaymentMethod>());
        RuleFor(o => o.CreatedAt, f => f.Date.Past(1));
    }

    private List<OrderItem> GenerateItems(Faker f, List<Product> products)
    {
        return f.PickRandom(products, f.Random.Int(1, 5))
            .Select(p => new OrderItem
            {
                ProductId = p.Id,
                Quantity = f.Random.Int(1, 3),
                Price = p.Price
            })
            .ToList();
    }
}
```

3. **Frontend генераторы данных**

```typescript
// src/frontend/src/mocks/data/products.ts
import { faker } from '@faker-js/faker';

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  specifications: Record<string, string>;
  manufacturer: string;
  warrantyMonths: number;
}

export const generateProduct = (): Product => ({
  id: faker.string.uuid(),
  name: faker.commerce.productName(),
  price: parseFloat(faker.commerce.price({ min: 100, max: 100000 })),
  stock: faker.number.int({ min: 0, max: 100 }),
  category: faker.helpers.arrayElement(['cpu', 'gpu', 'ram', 'motherboard', 'psu', 'case', 'storage']),
  specifications: {
    socket: faker.helpers.arrayElement(['AM5', 'LGA1700', 'AM4']),
    frequency: `${faker.number.int({ min: 2000, max: 5000 })} MHz`,
  },
  manufacturer: faker.company.name(),
  warrantyMonths: faker.number.int({ min: 12, max: 36 }),
});

export const generateProducts = (count: number): Product[] => 
  Array.from({ length: count }, generateProduct);
```

#### Ответственный:
- 🥈 TIER-2 Разработчик

#### Инструменты:
- Bogus (C#)
- @faker-js/faker (TypeScript)

---

### 4.2 Contract-based Mocks (День 2-4)

#### Действия:

1. **Настройка MSW (Mock Service Worker) для Frontend**

```typescript
// src/frontend/src/mocks/handlers/catalog.ts
import { http, HttpResponse, delay } from 'msw';
import { generateProduct, generateProducts } from '../data/products';

export const catalogHandlers = [
  // GET /api/v1/catalog/products
  http.get('/api/v1/catalog/products', async ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const category = url.searchParams.get('category');

    await delay(200); // Имитация сети

    const allProducts = generateProducts(100);
    const filtered = category 
      ? allProducts.filter(p => p.category === category)
      : allProducts;
    
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);

    return HttpResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit)
      }
    });
  }),

  // GET /api/v1/catalog/products/:id
  http.get('/api/v1/catalog/products/:id', async ({ params }) => {
    await delay(100);
    
    return HttpResponse.json(generateProduct());
  }),

  // GET /api/v1/catalog/categories
  http.get('/api/v1/catalog/categories', async () => {
    await delay(50);
    
    return HttpResponse.json([
      { id: 'cpu', name: 'Процессоры', count: 45 },
      { id: 'gpu', name: 'Видеокарты', count: 32 },
      { id: 'ram', name: 'Оперативная память', count: 67 },
      { id: 'motherboard', name: 'Материнские платы', count: 28 },
      { id: 'psu', name: 'Блоки питания', count: 19 },
      { id: 'case', name: 'Корпуса', count: 15 },
      { id: 'storage', name: 'Накопители', count: 54 },
    ]);
  }),
];
```

2. **Обработчики для конструктора ПК**

```typescript
// src/frontend/src/mocks/handlers/pcBuilder.ts
export const pcBuilderHandlers = [
  // POST /api/v1/pc-builder/validate
  http.post('/api/v1/pc-builder/validate', async ({ request }) => {
    const config = await request.json();
    await delay(300);

    const errors: string[] = [];
    const warnings: string[] = [];

    // Проверка совместимости (логика заглушки)
    if (config.cpuSocket !== config.motherboardSocket) {
      errors.push('Сокет процессора не совместим с материнской платой');
    }

    if (config.totalPower > config.psuPower * 0.8) {
      warnings.push('Рекомендуется блок питания с запасом мощности');
    }

    return HttpResponse.json({
      compatible: errors.length === 0,
      errors,
      warnings,
      totalPower: config.totalPower,
      recommendedPSU: Math.ceil(config.totalPower * 1.2)
    });
  }),

  // GET /api/v1/pc-builder/recommendations
  http.get('/api/v1/pc-builder/recommendations', async ({ request }) => {
    const url = new URL(request.url);
    const purpose = url.searchParams.get('purpose') || 'gaming';
    const budget = parseInt(url.searchParams.get('budget') || '100000');

    await delay(200);

    return HttpResponse.json({
      cpu: generateProduct(),
      gpu: generateProduct(),
      ram: generateProduct(),
      motherboard: generateProduct(),
      psu: generateProduct(),
      case: generateProduct(),
      total: faker.number.int({ min: budget * 0.8, max: budget })
    });
  }),
];
```

3. **Backend Mocks для внешних сервисов**

```csharp
// src/backend/GoldPC.Infrastructure/Mocks/PaymentServiceMock.cs
public class PaymentServiceMock : IPaymentService
{
    private readonly ILogger<PaymentServiceMock> _logger;
    private readonly Random _random = new();

    public async Task<PaymentResult> ProcessPaymentAsync(PaymentRequest request)
    {
        // Имитация задержки
        await Task.Delay(_random.Next(500, 2000));

        // Симуляция различных сценариев
        var scenario = _random.Next(100);
        
        if (scenario < 5) // 5% неудач
        {
            _logger.LogWarning("Mock: Payment failed for order {OrderId}", request.OrderId);
            return new PaymentResult
            {
                Success = false,
                ErrorCode = "INSUFFICIENT_FUNDS",
                ErrorMessage = "Недостаточно средств"
            };
        }

        if (scenario < 10) // 5% timeout
        {
            _logger.LogWarning("Mock: Payment timeout for order {OrderId}", request.OrderId);
            await Task.Delay(30000); // Timeout
            throw new TimeoutException("Payment gateway timeout");
        }

        _logger.LogInformation("Mock: Payment successful for order {OrderId}", request.OrderId);
        return new PaymentResult
        {
            Success = true,
            TransactionId = $"TRX-{Guid.NewGuid():N}",
            ProcessedAt = DateTime.UtcNow
        };
    }

    public async Task<RefundResult> RefundAsync(RefundRequest request)
    {
        await Task.Delay(_random.Next(200, 800));
        
        return new RefundResult
        {
            Success = true,
            RefundId = $"REF-{Guid.NewGuid():N}"
        };
    }
}
```

4. **SMS/Email Mocks**

```csharp
// src/backend/GoldPC.Infrastructure/Mocks/NotificationServiceMock.cs
public class NotificationServiceMock : INotificationService
{
    private readonly ILogger<NotificationServiceMock> _logger;
    private readonly ConcurrentBag<NotificationRecord> _sentNotifications = new();

    public Task SendSmsAsync(string phone, string message)
    {
        _logger.LogInformation("Mock SMS to {Phone}: {Message}", phone, message);
        
        _sentNotifications.Add(new NotificationRecord
        {
            Type = NotificationType.Sms,
            Recipient = phone,
            Message = message,
            SentAt = DateTime.UtcNow
        });

        return Task.CompletedTask;
    }

    public Task SendEmailAsync(string email, string subject, string body)
    {
        _logger.LogInformation("Mock Email to {Email}: {Subject}", email, subject);
        
        _sentNotifications.Add(new NotificationRecord
        {
            Type = NotificationType.Email,
            Recipient = email,
            Subject = subject,
            Message = body,
            SentAt = DateTime.UtcNow
        });

        return Task.CompletedTask;
    }

    public IEnumerable<NotificationRecord> GetSentNotifications()
    {
        return _sentNotifications.ToList();
    }
}
```

#### Ответственный:
- 🥈 TIER-2 Разработчик

---

### 4.3 Chaos Engineering (День 4-5)

#### Действия:

1. **Chaos Monkey для Backend**

```csharp
// src/backend/GoldPC.Infrastructure/Chaos/ChaosMiddleware.cs
public class ChaosMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ChaosOptions _options;
    private readonly Random _random = new();

    public ChaosMiddleware(RequestDelegate next, IOptions<ChaosOptions> options)
    {
        _next = next;
        _options = options.Value;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Пропуск health checks
        if (context.Request.Path.StartsWithSegments("/health"))
        {
            await _next(context);
            return;
        }

        // Случайные ошибки
        if (_options.EnableRandomFailures && _random.NextDouble() < _options.FailureRate)
        {
            throw new ChaosException("Random failure injected by Chaos Middleware");
        }

        // Случайные задержки
        if (_options.EnableLatency && _random.NextDouble() < _options.LatencyRate)
        {
            var delay = _random.Next(_options.MinLatencyMs, _options.MaxLatencyMs);
            await Task.Delay(delay);
        }

        // Симуляция недоступности сервисов
        if (_options.EnableServiceOutage && _random.NextDouble() < _options.OutageRate)
        {
            context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
            await context.Response.WriteAsJsonAsync(new
            {
                Error = "Service temporarily unavailable (Chaos)",
                RetryAfter = 30
            });
            return;
        }

        await _next(context);
    }
}

public class ChaosOptions
{
    public bool EnableRandomFailures { get; set; } = false;
    public double FailureRate { get; set; } = 0.05; // 5%
    
    public bool EnableLatency { get; set; } = false;
    public double LatencyRate { get; set; } = 0.1; // 10%
    public int MinLatencyMs { get; set; } = 100;
    public int MaxLatencyMs { get; set; } = 3000;
    
    public bool EnableServiceOutage { get; set; } = false;
    public double OutageRate { get; set; } = 0.01; // 1%
}

// Регистрация
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddTransient<ChaosMiddleware>();
    // Включить через конфигурацию
}
```

2. **Chaos для Redis**

```csharp
// src/backend/GoldPC.Infrastructure/Chaos/ChaosRedisService.cs
public class ChaosRedisService : ICacheService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly ChaosOptions _options;
    private readonly Random _random = new();

    public async Task<T?> GetAsync<T>(string key)
    {
        if (ShouldFail())
        {
            throw new RedisConnectionException("Chaos: Redis connection failed");
        }

        if (ShouldDelay())
        {
            await Task.Delay(_random.Next(100, 5000));
        }

        return await _redis.GetDatabase().StringGetAsync(key);
    }

    private bool ShouldFail() => 
        _options.EnableRedisFailures && _random.NextDouble() < _options.RedisFailureRate;
    
    private bool ShouldDelay() => 
        _options.EnableRedisLatency && _random.NextDouble() < _options.RedisLatencyRate;
}
```

3. **Frontend Chaos**

```typescript
// src/frontend/src/mocks/chaos.ts
export class ChaosEngine {
  private enabled: boolean;
  private failureRate: number;
  private latencyRate: number;
  private maxLatencyMs: number;

  constructor(config: ChaosConfig = {}) {
    this.enabled = config.enabled ?? false;
    this.failureRate = config.failureRate ?? 0.05;
    this.latencyRate = config.latencyRate ?? 0.1;
    this.maxLatencyMs = config.maxLatencyMs ?? 3000;
  }

  async injectChaos(): Promise<void> {
    if (!this.enabled) return;

    // Случайная задержка
    if (Math.random() < this.latencyRate) {
      const delay = Math.floor(Math.random() * this.maxLatencyMs);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Случайная ошибка
    if (Math.random() < this.failureRate) {
      throw new ChaosError('Chaos: Random failure injected');
    }
  }
}

// Интеграция с MSW
const chaosEngine = new ChaosEngine({ enabled: true });

const withChaos = <T>(handler: () => Promise<T>): Promise<T> => {
  return chaosEngine.injectChaos().then(() => handler());
};
```

#### Ответственный:
- 🥇 TIER-1 Архитектор

---

### 4.4 Stub Registry (День 5-6)

#### Действия:

1. **Реестр заглушек**

```csharp
// src/backend/GoldPC.Infrastructure/Stubs/StubRegistry.cs
public class StubRegistry
{
    private readonly Dictionary<string, StubDefinition> _stubs = new();
    private readonly ILogger<StubRegistry> _logger;

    public void Register(StubDefinition stub)
    {
        _stubs[stub.Name] = stub;
        _logger.LogInformation("Registered stub: {Name} for service {Service}", 
            stub.Name, stub.ServiceName);
    }

    public StubDefinition? Get(string name) => 
        _stubs.TryGetValue(name, out var stub) ? stub : null;

    public IEnumerable<StubDefinition> GetAll() => _stubs.Values;

    public void Configure(string name, Action<StubDefinition> configure)
    {
        if (_stubs.TryGetValue(name, out var stub))
        {
            configure(stub);
        }
    }
}

public record StubDefinition
{
    public string Name { get; init; } = string.Empty;
    public string ServiceName { get; init; } = string.Empty;
    public StubMode Mode { get; set; } = StubMode.Normal;
    public Dictionary<string, object> Responses { get; init; } = new();
    public ChaosConfig? Chaos { get; set; }
}

public enum StubMode
{
    Normal,       // Обычная работа
    Slow,         // Медленные ответы
    Failing,      // Возвращает ошибки
    Unstable      // Случайное поведение
}
```

2. **Управление через API**

```csharp
// src/backend/GoldPC.Api/Controllers/StubsController.cs
[ApiController]
[Route("api/v1/internal/stubs")]
public class StubsController : ControllerBase
{
    private readonly StubRegistry _registry;

    public StubsController(StubRegistry registry)
    {
        _registry = registry;
    }

    [HttpGet]
    public IActionResult GetAll()
    {
        return Ok(_registry.GetAll());
    }

    [HttpGet("{name}")]
    public IActionResult Get(string name)
    {
        var stub = _registry.Get(name);
        if (stub == null) return NotFound();
        return Ok(stub);
    }

    [HttpPatch("{name}")]
    public IActionResult Configure(string name, [FromBody] StubConfiguration config)
    {
        _registry.Configure(name, stub =>
        {
            stub.Mode = config.Mode;
            stub.Chaos = config.Chaos;
        });
        return Ok();
    }
}

public record StubConfiguration
{
    public StubMode Mode { get; init; }
    public ChaosConfig? Chaos { get; init; }
}
```

3. **UI для управления заглушками**

```typescript
// src/frontend/src/components/StubManager.tsx
import React, { useState, useEffect } from 'react';

interface Stub {
  name: string;
  serviceName: string;
  mode: 'Normal' | 'Slow' | 'Failing' | 'Unstable';
  chaos?: {
    failureRate: number;
    latencyRate: number;
  };
}

export const StubManager: React.FC = () => {
  const [stubs, setStubs] = useState<Stub[]>([]);

  useEffect(() => {
    fetch('/api/v1/internal/stubs')
      .then(res => res.json())
      .then(setStubs);
  }, []);

  const updateStub = async (name: string, mode: string) => {
    await fetch(`/api/v1/internal/stubs/${name}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    });
    
    setStubs(stubs.map(s => s.name === name ? { ...s, mode } : s));
  };

  return (
    <div className="stub-manager">
      <h2>Stub Manager</h2>
      <table>
        <thead>
          <tr>
            <th>Service</th>
            <th>Mode</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {stubs.map(stub => (
            <tr key={stub.name}>
              <td>{stub.serviceName}</td>
              <td>{stub.mode}</td>
              <td>
                <select 
                  value={stub.mode} 
                  onChange={e => updateStub(stub.name, e.target.value)}
                >
                  <option value="Normal">Normal</option>
                  <option value="Slow">Slow</option>
                  <option value="Failing">Failing</option>
                  <option value="Unstable">Unstable</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

#### Ответственный:
- 🥈 TIER-2 Разработчик

---

## Выходные артефакты

| Артефакт | Формат | Расположение |
|----------|--------|--------------|
| Faker генераторы | C#, TypeScript | `tests/Fakers/`, `mocks/data/` |
| MSW handlers | TypeScript | `mocks/handlers/` |
| Chaos Middleware | C# | `Infrastructure/Chaos/` |
| Stub Registry | C# | `Infrastructure/Stubs/` |
| Stub Manager UI | React | `components/StubManager.tsx` |

---

## Критерии готовности (Definition of Done)

- [ ] Faker генераторы для всех сущностей
- [ ] MSW handlers покрывают все API-эндпоинты
- [ ] Chaos Middleware настроен
- [ ] Mocks для внешних сервисов (Payment, SMS, Email)
- [ ] Stub Registry реализован
- [ ] UI для управления заглушками работает
- [ ] Документация по использованию готова

---

## Возможные риски и митигация

| Риск | Вероятность | Влияние | Меры митигации |
|------|-------------|---------|----------------|
| Несоответствие mock и реального API | Средняя | Среднее | Contract tests |
| Пропуск mock в production | Низкая | Критическое | Feature flags |
| Сложность поддержки | Средняя | Низкое | Автогенерация из OpenAPI |

---

## Переход к следующему этапу

Для перехода к этапу [05-parallel-development.md](./05-parallel-development.md) необходимо:

1. ✅ Все API имеют рабочие заглушки
2. ✅ Frontend работает с mock API
3. ✅ Chaos Engine протестирован
4. ✅ Stub Manager доступен

---

## Связанные документы

- [README.md](./README.md) — Обзор плана
- [02-contracts-and-architecture.md](./02-contracts-and-architecture.md) — API контракты
- [03-environment-setup.md](./03-environment-setup.md) — Среда разработки

---

*Документ создан в рамках плана разработки GoldPC.*