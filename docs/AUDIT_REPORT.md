# Аудит документации GoldPC

**Дата аудита:** 20 апреля 2026  
**Аудитор:** Автоматизированный анализ + ручная проверка  
**Статус:** ⚠️ Требуется обновление

---

## 📊 Резюме

Документация проекта **существенно устарела** и содержит критические расхождения с фактической реализацией. Ниже приведён детальный анализ по категориям.

---

## 🔴 Критические проблемы

### 1. Несоответствие портов микросервисов

**Файл:** `docs/API-Documentation.md`

| Сервис | В документации | В docker-compose.yml | Статус |
|--------|----------------|----------------------|--------|
| AuthService | 5001 | 9082 | ❌ Неверно |
| CatalogService | (отсутствует) | 9081 | ❌ Отсутствует |
| OrdersService | 5002 | Не запущен | ⚠️ Не в compose |
| ServicesService | 5003 | Не запущен | ⚠️ Не в compose |
| WarrantyService | 5004 | Не запущен | ⚠️ Не в compose |
| PCBuilderService | (отсутствует) | Не запущен | ⚠️ Не в compose |

**Реальность:** В `docker/docker-compose.yml` запущены только:
- `catalog.api` → порт 9081
- `auth.api` → порт 9082
- `frontend` → порт 3002

### 2. Несоответствие структуры микросервисов

**Файл:** `docs/API-Documentation.md`

Документация описывает 4 сервиса:
1. AuthService (Порт: 5001)
2. OrdersService (Порт: 5002)
3. ServicesService (Порт: 5003)
4. WarrantyService (Порт: 5004)

**Реальная структура проекта:**
```
src/
├── AuthService/          ✅ Запущен в docker-compose
├── CatalogService/       ✅ Запущен в docker-compose
├── OrdersService/        ⚠️ Код есть, не в docker-compose
├── PCBuilderService/     ⚠️ Код есть, не в docker-compose
├── ServicesService/      ⚠️ Код есть, не в docker-compose
├── WarrantyService/      ⚠️ Код есть, не в docker-compose
├── ReportingService/     ⚠️ Код есть, не в docker-compose
└── Shared/
```

**Проблема:** Документация не упоминает CatalogService и PCBuilderService, которые являются ключевыми сервисами проекта.

### 3. Устаревшая информация о базах данных

**Файл:** `docs/API-Documentation.md`

> Каждый микросервис использует отдельную базу данных PostgreSQL:
> - `goldpc_auth` - пользователи и токены
> - `goldpc_orders` - заказы и позиции
> - `goldpc_services` - заявки на услуги
> - `goldpc_warranty` - гарантийные случаи

**Реальность** (из `docker/postgres/init-databases.sh`):
```bash
# Создаётся одна общая БД goldpc с разными схемами
createdb -U postgres goldpc
# CatalogService использует goldpc_catalog
```

В `docker-compose.yml`:
- `goldpc` - основная БД для AuthService
- `goldpc_catalog` - для CatalogService

### 4. Несоответствие API endpoints

**Файл:** `docs/API-Documentation.md` vs Реальный код

| Документация | Реализация | Статус |
|--------------|------------|--------|
| `/api/v1/auth/register` | `AuthService/Controllers/AuthController.cs` - нужно проверить | ⚠️ |
| `/api/v1/orders` | `OrdersService/` - код существует | ⚠️ |
| `/api/v1/catalog/products` | `CatalogService/Controllers/ProductsController.cs` с `[Route("api/v1/catalog")]` | ✅ |

**Реальные контроллеры:**

**AuthService:**
- `AuthController.cs` - `[Route("api/v1/[controller]")]`
- `AddressController.cs` - `[Route("api/v1/auth/address")]`
- `WishlistController.cs` - `[Route("api/v1/wishlist")]`

**CatalogService:**
- `ProductsController.cs` - `[Route("api/v1/catalog")]` и `[Route("api/v1/admin")]`
- `TelemetryController.cs` - `[Route("api/v1/catalog/telemetry")]`

---

## 🟡 Средние проблемы

### 5. README.md - устаревшие порты

**Файл:** `README.md`

```markdown
| Сервис | URL |
|--------|-----|
| **Frontend** | http://localhost:3000 |
| **Catalog API** | http://localhost:5001/swagger |
| **PC Builder API** | http://localhost:5002/swagger |
| **Auth API** | http://localhost:5003/swagger |
| **Adminer (DB UI)** | http://localhost:8080 |
```

**Реальные порты из docker-compose.yml:**
| Сервис | Реальный URL |
|--------|--------------|
| **Frontend** | http://localhost:3002 |
| **Catalog API** | http://localhost:9081 |
| **Auth API** | http://localhost:9082 |
| **Adminer** | http://localhost:9090 |

### 6. deployment-guide.md - описывает несуществующую инфраструктуру

**Файл:** `docs/deployment-guide.md`

Документ описывает:
- Blue-Green deployment с двумя окружениями
- Load Balancer (Nginx)
- CDN для статических assets
- Vault для управления секретами
- PostgreSQL с репликацией

**Реальность:**
- PostgreSQL репликация ✅ есть в docker-compose (`postgres-replica`)
- Blue-Green deployment ❌ не реализован
- Vault ❌ не используется
- CDN ❌ не настроен

### 7. Отсутствующая документация по PC Builder

**Проблема:** PC Builder — ключевая фича проекта, но:
- Нет в `docs/API-Documentation.md`
- Нет в docker-compose.yml (не запущен)
- Есть код в `src/PCBuilderService/`
- Есть спецификация в `contracts/openapi/v1/components/schemas/pcbuilder.yaml`

---

## 🟢 Что актуально

### 8. OpenAPI спецификация

**Файл:** `contracts/openapi/v1/openapi.yaml`

✅ Спецификация существует и содержит:
- Полное описание Auth endpoints
- Схемы для всех доменов (user, product, order, service, warranty, pcbuilder)
- Корректное версионирование (`/api/v1/`)

**Структура schemas:**
```
contracts/openapi/v1/components/schemas/
├── common.yaml       (11KB) - общие типы
├── user.yaml         (8KB) - пользователи
├── product.yaml      (20KB) - товары
├── order.yaml        (12KB) - заказы
├── service.yaml      (12KB) - услуги
├── warranty.yaml     (9KB) - гарантия
└── pcbuilder.yaml    (13KB) - конструктор ПК
```

### 9. Architecture docs

**Файл:** `docs/architecture/README.md`

✅ Содержит актуальную информацию:
- C4 diagrams (Context, Container)
- Технологический стек (.NET 8, React 18, PostgreSQL 16, Redis 7)
- Ролевая модель (Client, Manager, Master, Admin, Accountant)

---

## 📋 Рекомендации по исправлению

### Приоритет 1: Критично (исправить немедленно)

1. **Обновить `docs/API-Documentation.md`:**
   - Добавить CatalogService с endpoints `/api/v1/catalog/*`
   - Добавить PCBuilderService
   - Исправить порты всех сервисов
   - Обновить информацию о базах данных

2. **Обновить `README.md`:**
   - Исправить таблицу портов сервисов
   - Добавить PCBuilderService, OrdersService, ServicesService, WarrantyService в docker-compose или убрать из документации

3. **Добавить недостающие сервисы в docker-compose.yml:**
   ```yaml
   # Добавить сервисы:
   - pcbuilder.api
   - orders.api
   - services.api
   - warranty.api
   ```

### Приоритет 2: Важно (исправить в ближайшее время)

4. **Обновить `docs/deployment-guide.md`:**
   - Убрать описание Blue-Green deployment (не реализован)
   - Убрать описание Vault (не используется)
   - Описать реальную структуру деплоя

5. **Создать `docs/PC-BUILDER-API.md`:**
   - Детальное описание API конструктора ПК
   - Примеры запросов на проверку совместимости
   - Описание бизнес-логики совместимости компонентов

### Приоритет 3: Желательно

6. **Синхронизировать OpenAPI spec с кодом:**
   - Проверить, что все endpoints в `contracts/openapi/v1/openapi.yaml` существуют в коде
   - Добавить генерацию OpenAPI из кода в CI/CD

7. **Добавить документацию по RabbitMQ:**
   - В docker-compose есть RabbitMQ, но нет документации по его использованию
   - Описать event-driven архитектуру (если используется)

---

## 🔍 Детали проверки

### Проверенные файлы:

| Файл | Статус | Примечание |
|------|--------|------------|
| `README.md` | ⚠️ Устарел | Неправильные порты |
| `docs/API-Documentation.md` | ❌ Критично устарел | Неполный список сервисов, wrong ports |
| `docs/deployment-guide.md` | ⚠️ Частично устарел | Описывает нереализованные фичи |
| `docs/architecture/README.md` | ✅ Актуально | Корректная информация |
| `contracts/openapi/v1/openapi.yaml` | ✅ Актуально | Полная спецификация |
| `docker/docker-compose.yml` | - | Реальная конфигурация |

### Проверенные сервисы:

| Сервис | Код | Docker | Документация |
|--------|-----|--------|--------------|
| AuthService | ✅ | ✅ | ⚠️ Wrong port |
| CatalogService | ✅ | ✅ | ❌ Отсутствует |
| PCBuilderService | ✅ | ❌ | ❌ Отсутствует |
| OrdersService | ✅ | ❌ | ⚠️ Wrong port |
| ServicesService | ✅ | ❌ | ⚠️ Wrong port |
| WarrantyService | ✅ | ❌ | ⚠️ Wrong port |
| ReportingService | ✅ | ❌ | ❌ Отсутствует |

---

## 📝 Чеклист для исправления

- [ ] Исправить порты в `README.md`
- [ ] Добавить CatalogService в `docs/API-Documentation.md`
- [ ] Добавить PCBuilderService в `docs/API-Documentation.md`
- [ ] Исправить порты всех сервисов в `docs/API-Documentation.md`
- [ ] Обновить информацию о БД в `docs/API-Documentation.md`
- [ ] Добавить недостающие сервисы в docker-compose.yml ИЛИ убрать из документации
- [ ] Обновить `docs/deployment-guide.md` (убрать Blue-Green, Vault, CDN)
- [ ] Создать `docs/PC-BUILDER-API.md`
- [ ] Добавить документацию по RabbitMQ
- [ ] Синхронизировать OpenAPI spec с кодом

---

## 🎯 Итоговая оценка

| Категория | Оценка | Комментарий |
|-----------|--------|-------------|
| **Полнота** | 5/10 | Отсутствуют ключевые сервисы |
| **Точность** | 3/10 | Много неверных портов и URLs |
| **Актуальность** | 4/10 | Описывает нереализованные фичи |
| **Полезность** | 5/10 | Трудно использовать для onboarding |

**Общая оценка:** ⚠️ **4.25/10** — Требуется серьёзное обновление

---

## 📅 История изменений документации

Последние коммиты, затрагивающие документацию:
```
80b2b4e just another fix
87dbe1e add Practice 14: UML use case diagram for GoldPC
37ce12c fix(pc-builder): consolidate all audit findings
399b282 chore: update .gitignore with MCP/db files, misc project docs updates
b7e207b feat(pc-builder): complete compatibility filtering
```

Последнее существенное обновление документации: ~март 2026 (по git log)

---

*Отчёт сгенерирован автоматически с ручной верификацией*
