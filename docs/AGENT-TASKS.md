# GoldPC Agent Tasks

Ready-to-run prompts for coding agents. Each task is independent and can be executed in parallel.

---

## TASK 1: Fix Master Panel API Method Mismatches (P0-001)

**Goal:** Make master panel pages functional by fixing all API method name mismatches.

**Files:**
- `src/frontend/src/api/services.ts`
- `src/frontend/src/pages/master/TicketsPage.tsx`
- `src/frontend/src/pages/master/WorkHistoryPage.tsx`
- `src/frontend/src/pages/master/TicketDetailPage.tsx`
- `src/frontend/src/pages/master/AvailableTicketsPage.tsx`

**Changes:**
1. In `services.ts`, add these aliases to the `servicesApi` object:
   - `getMasterServices = getMasterRequests`
   - `updateTicketStatus = updateRequestStatus`
   - `completeTicket = completeRequest`
   - `getServiceById = getServiceRequestById`
2. In all 3 master pages (TicketsPage:80, WorkHistoryPage:69, AvailableTicketsPage:72), change `data?.total` to `data?.totalCount`

**Restrictions:** Only add aliases, do not rename existing methods. Do not touch other files.

**Testing:** Run `npx tsc --noEmit` from `src/frontend/`. Verify no type errors.

---

## TASK 2: Fix useServiceTickets API Mismatches (P0-002)

**Goal:** Make service request page functional.

**Files:**
- `src/frontend/src/api/services.ts`
- `src/frontend/src/hooks/useServiceTickets.ts`

**Changes:**
1. In `services.ts`, add aliases:
   - `createService = createServiceRequest`
   - `getMyServices = async (page, pageSize) => getMyServiceRequests(page, pageSize)`
2. In `useServiceTickets.ts:54`, add `status?: string` parameter to `getMyServices` and pass it to the API call.

**Restrictions:** Only add aliases and fix the one function signature.

**Testing:** Run `npx tsc --noEmit` from `src/frontend/`.

---

## TASK 3: Fix Login Redirect (P0-011)

**Goal:** After login, redirect to the page user came from instead of always `/`.

**Files:**
- `src/frontend/src/hooks/useAuth.ts`
- `src/frontend/src/components/auth/` (find LoginModal or AuthGuard)

**Changes:**
1. In `useAuth.ts`, read `location.state?.from` after login and navigate there.
2. In AuthGuard (or wherever redirect to login happens), pass `state: { from: location }`.

**Restrictions:** Keep `/` as fallback when no `from` is set.

**Testing:** `npx tsc --noEmit` from `src/frontend/`.

---

## TASK 4: Fix CORS Hardcoded Origins (P0-003)

**Goal:** Make CORS configurable instead of hardcoded localhost.

**Files:**
- `src/backend/GoldPC.Api/Program.cs`
- `src/backend/GoldPC.Api/appsettings.json`

**Changes:**
1. In `Program.cs:185`, replace hardcoded origins with `builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? new[] { "http://localhost:3000" }`
2. Add to `appsettings.json`: `"Cors": { "AllowedOrigins": ["http://localhost:3000", "http://localhost:5173"] }`

**Restrictions:** Keep localhost defaults as fallback.

**Testing:** `dotnet build src/backend/GoldPC.Api/`

---

## TASK 5: Fix OrderItem.TotalPrice EF Core Mapping (P0-007)

**Goal:** Prevent runtime exception when creating orders.

**Files:**
- `src/OrdersService/Data/OrdersDbContext.cs`

**Changes:**
Add `entity.Ignore(e => e.TotalPrice);` inside the OrderItem configuration in `OnModelCreating` (after line ~82).

**Restrictions:** Do not change the entity class.

**Testing:** `dotnet build src/OrdersService/`

---

## TASK 6: Fix Docker Health Checks (P0-006)

**Goal:** Make Docker health checks actually detect unhealthy services.

**Files:**
- `docker/docker-compose.yml`

**Changes:**
1. Line ~123: `curl -f http://localhost:8080/health || exit 0` → `exit 1`
2. Line ~159: `curl -f http://localhost:8080/ || exit 0` → `curl -f http://localhost:8080/health || exit 1`

**Testing:** `docker compose config` validates.

---

## TASK 7: Remove Hardcoded Passwords from Docker (P0-010)

**Goal:** All passwords from .env, no hardcoded values.

**Files:**
- `docker/docker-compose.yml`
- `docker/docker-compose.prod.yml`
- `docker/.env.example` (create)

**Changes:**
1. Replace all hardcoded passwords with `${VARIABLE}` references
2. Create `.env.example` with all required variables (no values)
3. In prod compose, remove all default values
4. Add `requirepass` to Redis

**Restrictions:** Keep dev defaults working for local development.

**Testing:** `docker compose config` validates.

---

## TASK 8: Implement ReportingService FDW (P0-008)

**Goal:** Make reporting service functional.

**Files:**
- `src/ReportingService/Data/ReportingDbContext.cs`

**Changes:**
Implement `InitializeFdwAsync` with:
1. `CREATE EXTENSION IF NOT EXISTS postgres_fdw`
2. `CREATE SERVER` for each target DB
3. `CREATE USER MAPPING`
4. `IMPORT FOREIGN SCHEMA` or manual `CREATE FOREIGN TABLE`

Use connection strings from configuration. Handle existing objects with `IF NOT EXISTS`.

**Restrictions:** Do not modify view definitions. Keep `HasNoKey().ToView()` mappings.

**Testing:** `dotnet build src/ReportingService/`

---

## TASK 9: Add AuthService GET /users Endpoint (P0-004)

**Goal:** Admin panel can list users from real auth database.

**Files:**
- `src/AuthService/Controllers/AdminController.cs`

**Changes:**
Add `[HttpGet("users")]` endpoint with pagination, search, and role filter. Query auth DB, return paginated `UserDto` list.

**Restrictions:** Must use `[Authorize(Roles = "Admin")]`.

**Testing:** `dotnet build src/AuthService/`

---

## TASK 10: Add Popularity Sort to Catalog (P1-001)

**Goal:** Catalog "popular" sort works correctly.

**Files:**
- `src/CatalogService/Repositories/ProductRepository.cs`
- `src/frontend/src/pages/catalog-page/CatalogPage.tsx`

**Changes:**
Backend: Add 'popularity' sort mode (by viewCount or createdat desc fallback).
Frontend: Map 'popular' to new sort mode.

**Testing:** `dotnet build src/CatalogService/` and `npx tsc --noEmit`.

---

## TASK 11: Fix Catalog Facet Refetch (P1-002)

**Goal:** Filter facets don't reset when selecting specs.

**Files:**
- `src/frontend/src/components/filter-sidebar/FilterSidebar.tsx`

**Changes:**
Remove `selectedSpecifications` from the useEffect dependency array (~line 351). Only re-fetch when category changes.

**Testing:** `npx tsc --noEmit`.

---

## TASK 12: Fix PromoCode Race Condition (P1-003)

**Goal:** Atomic promo code usage increment.

**Files:**
- `src/OrdersService/Services/PromoCodeService.cs`

**Changes:**
Replace read-then-write with atomic SQL UPDATE checking max_uses.

**Testing:** `dotnet build src/OrdersService/`.

---

## TASK 13: Add Redis Authentication (P1-004)

**Goal:** Redis requires password.

**Files:**
- `docker/docker-compose.yml`

**Changes:**
Add `--requirepass ${REDIS_PASSWORD:-redis_dev_password}` to Redis command. Pass password to consumers.

**Testing:** `docker compose config`.

---

## TASK 14: Fix Nginx Upstream Names (P1-005)

**Goal:** Nginx upstream matches Docker service names.

**Files:**
- `docker/frontend/nginx.prod.conf`

**Changes:**
Update upstream blocks to match `docker-compose.prod.yml` service names.

**Testing:** Visual inspection.

---

## TASK 15: Fix Prometheus Targets (P1-006)

**Goal:** Prometheus scrapes real services.

**Files:**
- `prometheus/prometheus.yml`

**Changes:**
Remove non-existent services. Fix ports.

**Testing:** YAML valid.

---

## TASK 16: Add OrderDto JsonStringEnumConverter (P1-007)

**Goal:** Order status serialized as string, not integer.

**Files:**
- `src/SharedKernel/DTOs/OrderDto.cs`

**Changes:**
Add `[JsonConverter(typeof(JsonStringEnumConverter))]` to Status property.

**Testing:** `dotnet build src/SharedKernel/`.

---

## TASK 17: Add PCBuilder Socket Fallback (P1-008)

**Goal:** Motherboards show as compatible when rules table is empty.

**Files:**
- `src/PCBuilderService/Services/CompatibilityService.cs`

**Changes:**
Add socket-based fallback in `GetCompatibleMotherboardsAsync` when no rules exist.

**Testing:** `dotnet build src/PCBuilderService/`.

---

## TASK 18: Add Authorize to Reviews (P1-009)

**Goal:** Only authenticated users can submit reviews.

**Files:**
- `src/CatalogService/Controllers/ProductsController.cs`

**Changes:**
Add `[Authorize]` to AddReview POST. Extract userId from JWT.

**Testing:** `dotnet build src/CatalogService/`.

---

## TASK 19: Remove Insecure Defaults from Prod (P1-010)

**Goal:** No default secrets in production compose.

**Files:**
- `docker/docker-compose.prod.yml`

**Changes:**
Remove defaults for JWT_KEY and GRAFANA_PASSWORD.

**Testing:** Config validates.

---

## TASK 20: Add Missing Database Indexes (P1-011)

**Goal:** Improve query performance.

**Files:**
- `src/OrdersService/Data/OrdersDbContext.cs`
- `src/ServicesService/Data/ServicesDbContext.cs`

**Changes:**
OrdersService: Add HasIndex on Order.UserId, Order.Status, OrderItem.OrderId, OrderHistory.OrderId.
ServicesService: Add HasIndex on TicketMessage.ServiceRequestId, ServicePart.ServiceRequestId, WorkReport.ServiceRequestId.

**Testing:** `dotnet build` both services.

---

## TASK 21: Add ProductSpecificationValues Seed (P1-013)

**Goal:** Products have filterable specs.

**Files:**
- `src/CatalogService/Data/CatalogDbContext.cs`

**Changes:**
Create `SeedProductSpecificationValues` method linking products to canonical spec values.

**Testing:** `dotnet build src/CatalogService/`.

---

## TASK 22: Fix Dockerfile Port/Env (P1-014)

**Goal:** Dockerfile defaults match compose.

**Files:**
- `docker/Dockerfile.CatalogService`
- `docker/Dockerfile.ServicesService`

**Changes:**
CatalogService: EXPOSE and ASPNETCORE_URLS to 8080.
ServicesService: Default ASPNETCORE_ENVIRONMENT to Production.

**Testing:** `docker build` succeeds.

---

## TASK 23: Fix Checkout Plural (P2-001)

**Goal:** Correct Russian plural for "товар".

**Files:**
- `src/frontend/src/pages/checkout-page/CheckoutPage.tsx`

**Changes:**
Add Russian plural function and use it at lines 754 and 788.

---

## TASK 24: Frontend Dockerfile npm ci (P2-002)

**Files:** `docker/frontend/Dockerfile`
**Changes:** `npm install` → `npm ci`

---

## TASK 25: Dev Frontend Port Fix (P2-003)

**Files:** `docker/docker-compose.yml`
**Changes:** `3002:3000` → `3000:3000`

---

## TASK 26: Fix Storage Capacity Display (P1-012)

**Goal:** No "3 ТБGB" double-unit display.

**Files:** SQL migration or `src/scripts/fix-filter-data-issues.sql`

**Changes:** Normalize: value_text='3', unit='TB' separately.

---

## TASK 27: Fix useOrders to TanStack Query (P2-006)

**Files:** `src/frontend/src/hooks/useOrders.ts`
**Changes:** Migrate from useState/useCallback to useQuery/useMutation.

---

## TASK 28: Fix Multi-Select Spec Filter (P2-011)

**Files:** `src/frontend/src/components/filter-sidebar/FilterSidebar.tsx`
**Changes:** Fix spec filter to accumulate values correctly on multi-select.

---

## TASK 29: Add UseServiceTickets Status Filter (P0-012)

**Files:** `src/frontend/src/hooks/useServiceTickets.ts`
**Changes:** Add `status` parameter to getMyServices and pass it through.

---

## TASK 30: Add PC Builder Backend Persistence (P0-009)

**Files:**
- `src/PCBuilderService/Controllers/` (new controller)
- `src/frontend/src/features/pc-builder/logic/persistence.ts`

**Changes:**
Backend: CRUD endpoints for PC configurations.
Frontend: Replace localStorage-only with API calls (keep localStorage as cache).
