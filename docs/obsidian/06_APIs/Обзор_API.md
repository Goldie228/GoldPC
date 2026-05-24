# Обзор API GoldPC

> **Раздел**: 06_APIs
> **Версия**: 1.0 | **Последнее обновление**: 2026-05-24

---

## 🏗️ Архитектура API

```mermaid
graph TB
    subgraph "Клиенты"
        B[Браузер]
        M[Mobile App]
    end

    subgraph "API Gateway"
        N[Nginx Reverse Proxy<br/>:80/:443]
        BFF[GoldPC.Api BFF<br/>YARP :5008]
        SW[Swagger UI<br/>/swagger]
    end

    subgraph "Backend APIs"
        REST["REST API (JSON)"]
        GRPC["gRPC (HTTP/2 h2c)"]
        WS["WebSocket (SignalR)"]
        WH["Webhook (Stripe)"]
    end

    subgraph "Protocols"
        JWT["Bearer JWT Auth"]
    end

    B --> N
    N --> BFF
    BFF --> REST
    N -->|/api/v1/catalog| CS
    N -->|/api/v1/auth| AS
    BFF -->|/hubs/notification| WS
    
    REST --> JWT
    GRPC -.->|CatalogService :5006| GRPC_CLIENT
```

---

## 🌐 Типы API

| Тип | Протокол | Назначение | Сервисы |
|---|---|---|---|
| **REST** | HTTP/HTTPS, JSON | CRUD операции | Все сервисы |
| **gRPC** | HTTP/2 h2c | Межсервисное взаимодействие | CatalogService |
| **WebSocket** | SignalR | Уведомления в реальном времени | GoldPC.Api |
| **Webhook** | HTTPS POST | Stripe платежи | OrdersService |

---

## 🔐 Аутентификация

**Bearer JWT** для REST API:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Типы токенов

| Тип | Срок | Назначение |
|---|---|---|
| **Access Token** | 15 минут (настраивается) | Доступ к API |
| **Refresh Token** | 7 дней | Ротация токенов |

### Режимы

| Окружение | Механизм | Описание |
|---|---|---|
| **Development** | Симметричный HMAC-SHA256 | `JwtSettings:Secret` в appsettings |
| **Production** | OIDC Keycloak | `auth.goldpc.by` |

### Public vs Protected endpoints

- `/api/v1/catalog/**` — публичные (кроме админки)
- `/api/v1/auth/**` — смешанные (register/login публичные)
- `/api/v1/admin/**` — только Admin
- `/api/v1/orders/**` — Client+ (только свои заказы)
- `/api/v1/warranty/**` — Client+

---

## 📡 gRPC

Определён в `catalog.proto`, работает на `HTTP/2 h2c без TLS` на порту `:5006`:

```protobuf
service CatalogGrpc {
  rpc GetProductById (GetProductRequest) returns (ProductResponse);
  rpc GetProductsByIds (GetProductsRequest) returns (ProductsResponse);
  rpc ReserveStock (ReserveStockRequest) returns (StockResponse);
  rpc ReleaseStock (ReleaseStockRequest) returns (StockResponse);
}
```

---

## 🔌 WebSocket (SignalR)

**NotificationHub** — `/hubs/notification`:
- Уведомления о статусе заказа
- Уведомления о статусе заявки в СЦ
- Обновления гарантийного статуса
- Push-уведомления для менеджеров

Подключение требует JWT токен:

```javascript
const connection = new signalR.HubConnectionBuilder()
  .withUrl("/hubs/notification", { accessTokenFactory: () => token })
  .build();
```

---

## 💳 Webhooks

**Stripe Webhook**: `POST /api/v1/webhooks/stripe`

Обрабатывает события:
- `payment_intent.succeeded` — подтверждение оплаты
- `payment_intent.payment_failed` — ошибка оплаты

Верификация: `Stripe-Signature` header с секретом webhook.

---

## 📚 Swagger / OpenAPI

GoldPC.Api хостит Swagger UI:

```
http://localhost:5008/swagger
http://localhost:5008/swagger/v1/swagger.json
```

**Настройка**:

```csharp
builder.Services.AddSwaggerGen(c => {
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "GoldPC API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme {
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer"
    });
});
```

---

## 🔢 Версионирование API

Используется **URL-версионирование**: `/api/v1/{controller}/...`

- Текущая версия: **v1**
- При обратно-несовместимых изменениях → **v2**

---

## 📊 Статистика API

| Метрика | Значение |
|---|---|
| REST эндпоинтов | 50+ |
| gRPC методов | 4 |
| SignalR хабы | 1 (NotificationHub) |
| Swagger UI | goldpc-api/swagger |
| Rate limit | 50 запросов/сек (Nginx) |
| Max body size | 10MB |

---

## 🔗 Связанные страницы

- [[06_APIs/REST_эндпоинты]] — полная таблица REST эндпоинтов
- [[06_APIs/gRPC_контракты]] — gRPC протокол
- [[08_Security/JWT_аутентификация]] — JWT детали
- [[09_Auth/Обзор_аутентификации]] — auth flow
