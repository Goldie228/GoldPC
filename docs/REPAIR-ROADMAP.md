# GoldPC Repair Roadmap

## Executive Summary

**Текущее состояние:** Приложение содержит множество критических ошибок, делающих целые модули неработоспособными. Панель мастера полностью сломана (4 несуществующие API-методы), сервисный центр не может создавать заявки, корзина не сохраняет сборки ПК, а бэкенд не синхронизирует данные пользователя с AuthService.

**Количество найденных проблем:** 52  
**Распределение:** P0 (Critical): 12 | P1 (High): 18 | P2 (Medium): 14 | P3 (Low): 8

**Основные зоны риска:**
1. Frontend API layer — несуществующие методы вызываются из 10+ мест
2. Backend синхронизация — AdminService работает с локальным JSON, не с AuthService
3. Инфраструктура — захардкоженные пароли, нерабочие health checks
4. База данных — нет seed данных для спецификаций продуктов, race conditions

---

## Priority List

---

### P0-001

**Title:** Master Panel — 4 несуществующих API-метода, страницы полностью сломаны

**Category:** Frontend

**User Impact:** Панель мастера недоступна — все 3 страницы (Tickets, WorkHistory, TicketDetail) падают с TypeError при загрузке

**Current Behavior:** `TypeError: servicesApi.getMasterServices is not a function`, `TypeError: servicesApi.updateTicketStatus is not a function`, `TypeError: servicesApi.completeTicket is not a function`

**Expected Behavior:** Страницы загружаются, список заявок отображается, статусы обновляются

**Root Cause:** Фронтенд вызывает методы, которых нет в `servicesApi`:
- `getMasterServices()` → реальный метод: `getMasterRequests()`
- `updateTicketStatus()` → реальный метод: `updateRequestStatus()`
- `completeTicket()` → реальный метод: `completeRequest()`
- `getServiceById()` → реальный метод: `getServiceRequestById()`

**Evidence:**
- `src/frontend/src/pages/master/TicketsPage.tsx:75` — `servicesApi.getMasterServices(...)`
- `src/frontend/src/pages/master/WorkHistoryPage.tsx:64` — `servicesApi.getMasterServices(...)`
- `src/frontend/src/pages/master/TicketsPage.tsx:351` — `servicesApi.updateTicketStatus(...)`
- `src/frontend/src/pages/master/TicketDetailPage.tsx:108` — `servicesApi.updateTicketStatus(...)`
- `src/frontend/src/pages/master/TicketDetailPage.tsx:118` — `servicesApi.completeTicket(...)`
- `src/frontend/src/api/services.ts:243` — реальный метод: `getMasterRequests`
- `src/frontend/src/api/services.ts:219` — реальный метод: `updateRequestStatus`
- `src/frontend/src/api/services.ts:231` — реальный метод: `completeRequest`
- `src/frontend/src/api/services.ts:130` — реальный метод: `getServiceRequestById`

**Recommended Fix:** В файле `src/frontend/src/api/services.ts` добавить алиасы для несовпадающих имен:
```typescript
getMasterServices: servicesApi.getMasterRequests,
updateTicketStatus: servicesApi.updateRequestStatus,
completeTicket: servicesApi.completeRequest,
getServiceById: servicesApi.getServiceRequestById,
```
Или переименовать вызовы в компонентах.

**Validation Steps:**
1. Открыть `/master/tickets` — список заявок загружается без ошибок
2. Открыть `/master/history` — история загружается
3. Открыть `/master/tickets/:id` — детали загружаются
4. Нажать кнопку смены статуса — статус обновляется

**Agent Task Prompt:**
"Fix the Master Panel API method name mismatches.

Files:
- src/frontend/src/api/services.ts
- src/frontend/src/pages/master/TicketsPage.tsx
- src/frontend/src/pages/master/WorkHistoryPage.tsx
- src/frontend/src/pages/master/TicketDetailPage.tsx

Changes:
In services.ts, add these aliases to the servicesApi object:
- getMasterServices = getMasterRequests
- updateTicketStatus = updateRequestStatus  
- completeTicket = completeRequest
- getServiceById = getServiceRequestById

Also fix the `total` vs `totalCount` property access in all 3 master pages (TicketsPage:80, WorkHistoryPage:69, AvailableTicketsPage:72): change `data?.total` to `data?.totalCount`.

Restrictions: Do not rename the existing methods, only add aliases. Do not touch other files.

Validation: Run `npx tsc --noEmit` from src/frontend/ to verify no type errors."

---

### P0-002

**Title:** useServiceTickets — `createService` и `getMyServices` вызывают несуществующие методы

**Category:** Frontend

**User Impact:** Страница подачи заявки в сервисный центр падает с TypeError при отправке

**Current Behavior:** `TypeError: servicesApi.createService is not a function` при отправке заявки; `TypeError: servicesApi.getMyServices is not a function` при загрузке моих заявок

**Expected Behavior:** Заявка создаётся, мои заявки загружаются

**Root Cause:** `useServiceTickets.ts:44` вызывает `servicesApi.createService()`, а реальный метод — `servicesApi.createServiceRequest()`. Строка 58 вызывает `servicesApi.getMyServices()`, а реальный метод — `servicesApi.getMyServiceRequests()`.

**Evidence:**
- `src/frontend/src/hooks/useServiceTickets.ts:44` — `servicesApi.createService(data)`
- `src/frontend/src/hooks/useServiceTickets.ts:58` — `servicesApi.getMyServices(page, pageSize)`
- `src/frontend/src/api/services.ts:145` — реальный: `createServiceRequest`
- `src/frontend/src/api/services.ts:136` — реальный: `getMyServiceRequests`

**Recommended Fix:** В `services.ts` добавить алиасы:
```typescript
createService: servicesApi.createServiceRequest,
getMyServices: async (page, pageSize) => servicesApi.getMyServiceRequests(page, pageSize),
```

**Validation Steps:**
1. Открыть `/service-request` — страница загружается
2. Отправить заявку — создаётся без ошибок
3. Открыть `/account/services` — мои заявки загружаются

**Agent Task Prompt:**
"Fix useServiceTickets API method mismatches.

Files:
- src/frontend/src/api/services.ts
- src/frontend/src/hooks/useServiceTickets.ts

Changes:
In services.ts, add aliases:
- createService = createServiceRequest
- getMyServices = async (page, pageSize) => getMyServiceRequests(page, pageSize)

Also fix getMyServices return type to match: { items: ServiceRequestDto[]; totalCount: number } (the hook's interface says `total` but the API returns `totalCount`).

Restrictions: Only add aliases, do not rename existing methods.

Validation: Run `npx tsc --noEmit` from src/frontend/."

---

### P0-003

**Title:** CORS захардкожен на localhost — ломает любое деплое

**Category:** Backend

**User Impact:** Все XHR/fetch запросы блокируются браузером при деплое на не-localhost origins

**Current Behavior:** CORS policy разрешает только `http://localhost:3000` и `http://localhost:5173`

**Expected Behavior:** CORS читает разрешённые origins из конфигурации/окружения

**Root Cause:** `src/backend/GoldPC.Api/Program.cs:185-188` — захардкожены origins

**Evidence:**
- `src/backend/GoldPC.Api/Program.cs:185` — `policy.WithOrigins("http://localhost:3000", "http://localhost:5173")`

**Recommended Fix:** Читать origins из `appsettings.json` или переменных окружения:
```csharp
var allowedOrigins = Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
    ?? new[] { "http://localhost:3000" };
policy.WithOrigins(allowedOrigins)
```

**Validation Steps:**
1. Задеплоить с CORS origins из env-переменной
2. Проверить что фронтенд на другом домене получает ответы

**Agent Task Prompt:**
"Fix hardcoded CORS origins in the API gateway.

Files:
- src/backend/GoldPC.Api/Program.cs
- src/backend/GoldPC.Api/appsettings.json

Changes:
In Program.cs line ~185, replace hardcoded origins with configuration:
```csharp
var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:3000", "http://localhost:5173" };
policy.WithOrigins(origins)
```

Add to appsettings.json:
```json
"Cors": {
  "AllowedOrigins": ["http://localhost:3000", "http://localhost:5173"]
}
```

Restrictions: Keep localhost defaults as fallback. Do not use AllowAnyOrigin.

Validation: `dotnet build src/backend/GoldPC.Api/` passes."

---

### P0-004

**Title:** AuthService AdminController — нет GET /users, возвращает 405

**Category:** Backend

**User Impact:** Админская панель управления пользователями не может получить список пользователей

**Current Behavior:** `GET /api/v1/auth/admin/users` → 405 Method Not Allowed

**Expected Behavior:** Возвращает пагинированный список пользователей

**Root Cause:** `src/AuthService/Controllers/AdminController.cs` не имеет `[HttpGet("users")]` — только `[HttpPost("users")]` для создания. Gateway `AdminUsersController` читает из локального JSON, не из AuthService DB.

**Evidence:**
- `src/AuthService/Controllers/AdminController.cs:79-220` — нет GET endpoint для списка
- `src/backend/GoldPC.Api/Controllers/AdminUsersController.cs:43` — GET есть, но читает JSON файл

**Recommended Fix:** Добавить в AuthService AdminController:
```csharp
[HttpGet("users")]
[Authorize(Roles = "Admin")]
public async Task<IActionResult> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null)
{
    // Query auth DB with pagination
}
```

**Validation Steps:**
1. `GET /api/v1/auth/admin/users` возвращает список пользователей
2. Админ панель отображает пользователей из реальной БД

**Agent Task Prompt:**
"Add GET /users endpoint to AuthService AdminController.

Files:
- src/AuthService/Controllers/AdminController.cs
- src/AuthService/Services/ (check for existing user query service)

Changes:
Add [HttpGet("users")] endpoint that queries the auth database with pagination, search, and role filter. Return paginated UserDto list.

Restrictions: Must use [Authorize(Roles = "Admin")]. Must support pagination (page, pageSize params).

Validation: Build with `dotnet build src/AuthService/` passes."

---

### P0-005

**Title:** AdminService — правки пользователей не синхронизируются с AuthService

**Category:** Backend

**User Impact:** Изменение роли или данных пользователя в админке не влияет на авторизацию

**Current Behavior:** `UpdateUserAsync` и `UpdateUserRoleAsync` пишут только в локальный JSON файл

**Expected Behavior:** Изменения дублируются в AuthService DB

**Root Cause:** `src/backend/GoldPC.Api/Services/AdminService.cs:322,346` — HACK комментарии, синхронизация не реализована

**Evidence:**
- `src/backend/GoldPC.Api/Services/AdminService.cs:322` — `// HACK(TV-XXX): sync update to AuthService`
- `src/backend/GoldPC.Api/Services/AdminService.cs:346` — `// HACK(TV-XXX): sync role change to AuthService`

**Recommended Fix:** Реализовать `IAuthServiceClient.UpdateUserAsync` и `UpdateUserRoleAsync`, вызывать их из AdminService.

**Validation Steps:**
1. Изменить роль пользователя в админке
2. Проверить что JWT токен отражает новую роль

**Agent Task Prompt:**
"Implement AuthService sync in AdminService.

Files:
- src/backend/GoldPC.Api/Services/AdminService.cs
- src/backend/GoldPC.Api/Services/IAuthServiceClient.cs (create if missing)

Changes:
Implement UpdateUserAsync and UpdateUserRoleAsync in IAuthServiceClient that forward requests to AuthService. Call them from AdminService.UpdateUserAsync and UpdateUserRoleAsync, replacing the HACK comments.

Restrictions: Keep JSON file as fallback/cache. Do not remove existing local persistence.

Validation: `dotnet build src/backend/GoldPC.Api/` passes."

---

### P0-006

**Title:** CatalogService health check всегда возвращает success (не может умереть)

**Category:** Infrastructure

**User Impact:** Docker не может обнаружить неработоспособный CatalogService

**Current Behavior:** `curl -f http://localhost:8080/health || exit 0` — `exit 0` означает всегда success

**Expected Behavior:** Health check падает если сервис не отвечает

**Root Cause:** `docker/docker-compose.yml:123` — `|| exit 0` вместо `|| exit 1`

**Evidence:**
- `docker/docker-compose.yml:123` — `curl -f http://localhost:8080/health || exit 0`

**Recommended Fix:** Заменить `|| exit 0` на `|| exit 1` для CatalogService и AuthService health checks.

**Validation Steps:**
1. Остановить CatalogService контейнер
2. Проверить что Docker помечает его как unhealthy

**Agent Task Prompt:**
"Fix Docker health checks that never fail.

Files:
- docker/docker-compose.yml

Changes:
- Line ~123: Change `curl -f http://localhost:8080/health || exit 0` to `curl -f http://localhost:8080/health || exit 1`
- Line ~159: Change AuthService health check from `curl -f http://localhost:8080/ || exit 0` to `curl -f http://localhost:8080/health || exit 1`

Restrictions: Only change the exit codes and the AuthService health check URL.

Validation: `docker compose config` validates without errors."

---

### P0-007

**Title:** OrderItem.TotalPrice — EF Core mapping exception при создании заказов

**Category:** Database

**User Impact:** Создание заказа падает с runtime exception

**Current Behavior:** `Property 'TotalPrice' is a part of entity type 'OrderItem' but has no mapping to a database column`

**Expected Behavior:** Заказы создаются без ошибок

**Root Cause:** `src/OrdersService/Entities/OrderItem.cs:38` — `TotalPrice` computed C# property, но EF Core не игнорирует его и не маппит на колонку

**Evidence:**
- `src/OrdersService/Entities/OrderItem.cs:38` — `public decimal TotalPrice => UnitPrice * Quantity;`
- `src/OrdersService/Data/OrdersDbContext.cs:72-82` — нет `entity.Ignore(e => e.TotalPrice)`

**Recommended Fix:** Добавить в `OnModelCreating`:
```csharp
entity.Ignore(e => e.TotalPrice);
```

**Validation Steps:**
1. Создать заказ через API
2. Проверить что order_items записываются в БД

**Agent Task Prompt:**
"Fix OrderItem.TotalPrice EF Core mapping.

Files:
- src/OrdersService/Data/OrdersDbContext.cs

Changes:
Add `entity.Ignore(e => e.TotalPrice);` inside the OrderItem configuration in OnModelCreating (after line ~82).

Restrictions: Do not change the entity class itself.

Validation: `dotnet build src/OrdersService/` passes."

---

### P0-008

**Title:** ReportingService FDW initialization пуста — сервис не работает

**Category:** Backend / Database

**User Impact:** Финансовые отчёты (404) и любой отчёт accountant'а недоступны

**Current Behavior:** ReportingService не может подключиться к другим БД, FDW не настроен

**Expected Behavior:** FDW настроен, отчёты генерируются

**Root Cause:** `src/ReportingService/Data/ReportingDbContext.cs:41-49` — `InitializeFdwAsync` пустой, нет миграций

**Evidence:**
- `src/ReportingService/Data/ReportingDbContext.cs:41-49` — пустой метод
- `src/ReportingService/Migrations/` — нет файлов миграций

**Recommended Fix:** Реализовать `InitializeFdwAsync` с CREATE SERVER, CREATE FOREIGN TABLE, IMPORT FOREIGN SCHEMA для каждой микросервисной БД.

**Validation Steps:**
1. ReportingService стартует без ошибок
2. `GET /api/v1/reports/financial-summary` возвращает данные

**Agent Task Prompt:**
"Implement ReportingService FDW initialization.

Files:
- src/ReportingService/Data/ReportingDbContext.cs

Changes:
Implement InitializeFdwAsync with actual SQL:
1. CREATE EXTENSION IF NOT EXISTS postgres_fdw
2. CREATE SERVER for each target DB (CatalogDB, OrdersDB, ServicesDB)
3. CREATE USER MAPPING for each server
4. CREATE FOREIGN TABLEs or IMPORT FOREIGN SCHEMA

Use connection strings from configuration. Handle the case where FDW objects already exist (IF NOT EXISTS).

Restrictions: Do not modify the view definitions. Keep the existing HasNoKey().ToView() mappings.

Validation: `dotnet build src/ReportingService/` passes."

---

### P0-009

**Title:** PC Builder — нет backend персистенции, сборки теряются

**Category:** Frontend / Backend

**User Impact:** Сборки ПК сохраняются только в localStorage, теряются при смене устройства/очистке кеша

**Current Behavior:** `persistence.ts` читает/пишет только localStorage

**Expected Behavior:** Сборки сохраняются на сервере, привязаны к пользователю

**Root Cause:** `src/frontend/src/features/pc-builder/logic/persistence.ts` — только localStorage, нет API вызовов

**Evidence:**
- `src/frontend/src/features/pc-builder/logic/persistence.ts` — полный файл (99 строк) — нет API вызовов
- `src/frontend/src/pages/account/AccountSavedBuilds.tsx` — ожидает backend данные

**Recommended Fix:** Добавить API endpoints в PCBuilderService для CRUD сборок, подключить persistence.ts к API.

**Validation Steps:**
1. Сохранить сборку → она появляется в /account/saved-builds
2. Загрузить сборку на другом устройстве → данные на месте

**Agent Task Prompt:**
"Add backend persistence for PC Builder configurations.

Files:
- src/PCBuilderService/Controllers/ (add PCConfigurationsController)
- src/PCBuilderService/Services/ (add PCConfigurationService)
- src/frontend/src/features/pc-builder/logic/persistence.ts
- src/frontend/src/api/ (add pc-builder API calls)

Changes:
Backend: Add CRUD endpoints for PC configurations under /api/v1/pc-builder/configurations
Frontend: Replace localStorage-only persistence with API calls (keep localStorage as offline fallback)

Restrictions: Must be authenticated endpoint. Keep existing localStorage logic as cache.

Validation: Build both frontend and backend. `dotnet build src/PCBuilderService/` and `npx tsc --noEmit` from src/frontend/."

---

### P0-010

**Title:** Хардкод паролей в Docker Compose — критические проблемы безопасности

**Category:** Infrastructure / Security

**User Impact:** Пароли БД, RabbitMQ, Grafana захардкожены —任何人 может получить доступ

**Current Behavior:** POSTGRES_PASSWORD=admin, RabbitMQ guest/guest, Grafana admin/admin

**Expected Behavior:** Все пароли из .env файла, без дефолтов в проде

**Root Cause:** `docker/docker-compose.yml:18,72-73` и `docker/docker-compose.prod.yml:136,366`

**Evidence:**
- `docker/docker-compose.yml:18` — `POSTGRES_PASSWORD: admin`
- `docker/docker-compose.yml:72-73` — `RABBITMQ_DEFAULT_USER: guest`
- `docker/docker-compose.prod.yml:136` — JWT secret с дефолтом
- `docker/docker-compose.prod.yml:366` — `GF_SECURITY_ADMIN_PASSWORD: admin`

**Recommended Fix:** Все пароли обязательны в .env, дефолты только для dev, в prod — ошибки при запуске без.env

**Validation Steps:**
1. Запустить без .env → получить ошибку
2. Запустить с .env → всё работает

**Agent Task Prompt:**
"Remove hardcoded passwords from Docker Compose.

Files:
- docker/docker-compose.yml
- docker/docker-compose.prod.yml
- docker/.env.example (create if missing)

Changes:
1. Replace all hardcoded passwords with ${VARIABLE} references
2. Create .env.example with all required variables (no values)
3. In prod compose, remove all default values — services should fail if env vars missing
4. Add `requirepass` to Redis configuration

Restrictions: Keep dev defaults working for local development.

Validation: `docker compose config` validates; `docker compose up` without .env shows clear error messages."

---

### P0-011

**Title:** Auth redirect после логина всегда на `/` — теряется целевая страница

**Category:** Frontend / UX

**User Impact:** Пользователь, нажавший на защищённую ссылку, после логина попадает на главную вместо целевой страницы

**Current Behavior:** `setTimeout(() => { void navigate('/'); }, 0)` — всегда на главную

**Expected Behavior:** Редирект на страницу, с которой пришёл

**Root Cause:** `src/frontend/src/hooks/useAuth.ts:79` — нет сохранения `state.from`

**Evidence:**
- `src/frontend/src/hooks/useAuth.ts:79` — `void navigate('/')`

**Recommended Fix:** Использовать `useLocation` для чтения `state.from` и навигировать туда после логина.

**Validation Steps:**
1. Перейти на /account/orders (неавторизованный)
2. Войти в систему
3. Оказаться на /account/orders, не на /

**Agent Task Prompt:**
"Fix login redirect to preserve original destination.

Files:
- src/frontend/src/hooks/useAuth.ts
- src/frontend/src/components/auth/ (check LoginModal or similar)

Changes:
In useAuth.ts login function, after successful login:
1. Read `from` from location state (passed by AuthGuard)
2. Navigate to `from || '/'`

Also ensure AuthGuard passes `state: { from: location }` when redirecting to login.

Restrictions: Keep the existing redirect as fallback when no `from` is set.

Validation: `npx tsc --noEmit` from src/frontend/."

---

### P0-012

**Title:** UseServiceTickets — `getMyServices` не передаёт параметр `status`

**Category:** Frontend

**User Impact:** Фильтрация заявок по статусу молча игнорируется

**Current Behavior:** Параметр `status` объявлен в интерфейсе, но не передаётся в API вызов

**Expected Behavior:** Фильтр по статусу работает

**Root Cause:** `src/frontend/src/hooks/useServiceTickets.ts:54` — функция принимает `(page, pageSize)` без `status`, хотя интерфейс (строка 13) объявляет `status?: string`

**Evidence:**
- `src/frontend/src/hooks/useServiceTickets.ts:13` — интерфейс: `getMyServices: (page?, pageSize?, status?: string)`
- `src/frontend/src/hooks/useServiceTickets.ts:54` — реализация: `getMyServices(page = 1, pageSize = 10)` — нет status
- `src/frontend/src/hooks/useServiceTickets.ts:58` — `servicesApi.getMyServices(page, pageSize)` — status не передаётся

**Recommended Fix:** Добавить параметр `status` в функцию и передавать его в API вызов.

**Validation Steps:**
1. Отфильтровать заявки по статусу "В работе"
2. Показываются только заявки с этим статусом

**Agent Task Prompt:**
"Fix status filter in useServiceTickets.

Files:
- src/frontend/src/hooks/useServiceTickets.ts

Changes:
Add `status?: string` parameter to getMyServices implementation (line 54) and pass it to the API call.

Restrictions: Only change this one function.

Validation: `npx tsc --noEmit` from src/frontend/."

---

## P1 — High Priority

---

### P1-001

**Title:** Catalog — сортировка "по популярности" работает как "по цене (desc)"

**Category:** Frontend / Backend

**Current Behavior:** `sortBy: 'popular'` попадает в default case → `price desc`

**Root Cause:** `src/frontend/src/pages/catalog-page/CatalogPage.tsx:242-244` default case; `src/CatalogService/Repositories/ProductRepository.cs:219-234` нет режима popularity

**Agent Task Prompt:** "Add popularity sort mode to catalog. Backend: Add 'popularity' sort mode in ApplySorting. Frontend: Map 'popular' to the new sort mode. Validation: `dotnet build src/CatalogService/` and `npx tsc --noEmit`."

---

### P1-002

**Title:** Catalog facets перезапрашиваются при каждом выборе spec фильтра

**Category:** Frontend / UX

**Evidence:** `src/frontend/src/components/filter-sidebar/FilterSidebar.tsx:351-356`

**Agent Task Prompt:** "Remove `selectedSpecifications` from the useEffect dependency array that fetches filter facets. Only re-fetch when category changes. Validation: `npx tsc --noEmit`."

---

### P1-003

**Title:** PromoCode UsedCount — race condition

**Category:** Backend / Database

**Evidence:** `src/OrdersService/Services/PromoCodeService.cs:96-97`

**Agent Task Prompt:** "Replace read-then-write with atomic SQL UPDATE. Validation: `dotnet build src/OrdersService/`."

---

### P1-004

**Title:** Redis без аутентификации

**Category:** Infrastructure / Security

**Evidence:** `docker/docker-compose.yml:83-97`

**Agent Task Prompt:** "Add `--requirepass` to Redis. Pass password to consumers via env var."

---

### P1-005

**Title:** nginx upstream имена не совпадают с Docker Compose

**Category:** Infrastructure

**Evidence:** `docker/frontend/nginx.prod.conf:39-41`

**Agent Task Prompt:** "Update nginx upstream to match docker-compose.prod.yml service names."

---

### P1-006

**Title:** Prometheus скрапит несуществующие сервисы

**Category:** Infrastructure

**Evidence:** `prometheus/prometheus.yml`

**Agent Task Prompt:** "Remove non-existent services from Prometheus config. Fix ports."

---

### P1-007

**Title:** OrderDto.Status — enum как integer

**Category:** Backend

**Evidence:** `src/SharedKernel/DTOs/OrderDto.cs:27`

**Agent Task Prompt:** "Add `[JsonConverter(typeof(JsonStringEnumConverter))]` to OrderDto.Status."

---

### P1-008

**Title:** PCBuilder — все материнские платы кажутся несовместимыми при пустых правилах

**Category:** Backend

**Evidence:** `src/PCBuilderService/Services/CompatibilityService.cs:113-120`

**Agent Task Prompt:** "Add socket-based fallback when CompatibilityRules table is empty."

---

### P1-009

**Title:** Catalog reviews — нет авторизации

**Category:** Backend / Security

**Evidence:** `src/CatalogService/Controllers/ProductsController.cs:100-116`

**Agent Task Prompt:** "Add [Authorize] to AddReview POST endpoint. Extract userId from JWT."

---

### P1-010

**Title:** JWT secret и Grafana — дефолты в prod

**Category:** Infrastructure / Security

**Evidence:** `docker/docker-compose.prod.yml:136,366`

**Agent Task Prompt:** "Remove default values for JWT_KEY and GRAFANA_PASSWORD in prod compose."

---

### P1-011

**Title:** OrdersService и ServicesService — нет индексов

**Category:** Database

**Agent Task Prompt:** "Add missing indexes: Order.UserId, Order.Status, OrderItem.OrderId, TicketMessage.ServiceRequestId."

---

### P1-012

**Title:** Storage capacity — "3 ТБGB"

**Category:** Database

**Agent Task Prompt:** "Normalize storage capacity: value_text='3' + unit='TB', not '3 TB' + 'GB'."

---

### P1-013

**Title:** Catalog seed — нет ProductSpecificationValue

**Category:** Database

**Agent Task Prompt:** "Add SeedProductSpecificationValues to CatalogDbContext."

---

### P1-014

**Title:** Dockerfile port/env misconfigs

**Category:** Infrastructure

**Agent Task Prompt:** "Fix CatalogService Dockerfile port to 8080; ServicesService default env to Production."

---

## P2 — Medium Priority

---

### P2-001 — Checkout "товар(ов)" не склоняется (i18n)
### P2-002 — Frontend Dockerfile: npm install → npm ci
### P2-003 — Dev frontend port 3002 → 3000
### P2-004 — docker-compose.test.yml version deprecated
### P2-005 — Token refresh race condition
### P2-006 — useOrders: useState → TanStack Query
### P2-007 — ReportingServiceClient trailing slash
### P2-008 — Admin getUsers ApiResponse unwrap
### P2-009 — Duplicate Dockerfiles
### P2-010 — Availability filter Stock <= 0
### P2-011 — Spec filter multiselect broken
### P2-012 — Sort dropdown not working
### P2-013 — Checkout delivery date picker
### P2-014 — Public catalog category slug mapping

---

## P3 — Low Priority

---

### P3-001 — PDF export prop dead code
### P3-002 — SQL fixes not in migrations
### P3-003 — actualCost/estimatedCost missing on DTO
### P3-004 — RAM type detection
### P3-005 — .dockerignore blocks *.md
### P3-006 — prod-switch Makefile no-op
### P3-007 — Rating filter circles alignment
### P3-008 — "Ещё N товаров" plural form
