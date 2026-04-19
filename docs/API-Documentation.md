# GoldPC - API документация

## Обзор

GoldPC - это микросервисная платформа для магазина компьютерных компонентов и сборки ПК.

**Полная OpenAPI спецификация:** [`contracts/openapi/v1/openapi.yaml`](../contracts/openapi/v1/openapi.yaml)

---

## Микросервисы

| Сервис | Порт (Docker) | Swagger | Статус |
|--------|---------------|---------|--------|
| **CatalogService** | 9081 | http://localhost:9081/swagger | ✅ Активен |
| **AuthService** | 9082 | http://localhost:9082/swagger | ✅ Активен |
| **PCBuilderService** | - | - | ⚠️ Не в docker-compose |
| **OrdersService** | - | - | ⚠️ Не в docker-compose |
| **ServicesService** | - | - | ⚠️ Не в docker-compose |
| **WarrantyService** | - | - | ⚠️ Не в docker-compose |
| **ReportingService** | - | - | ⚠️ Не в docker-compose |

> **Примечание:** Сервисы, помеченные как "Не в docker-compose", существуют в коде (`src/`), но не включены в базовую конфигурацию `docker/docker-compose.yml`.

---

### 1. CatalogService (Порт: 9081)

Сервис каталога товаров, категорий и производителей.

**Swagger:** http://localhost:9081/swagger

#### Endpoints:

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/catalog/products` | Список товаров | Нет |
| GET | `/api/v1/catalog/products/{id}` | Товар по ID | Нет |
| GET | `/api/v1/catalog/categories` | Список категорий | Нет |
| GET | `/api/v1/catalog/manufacturers` | Список производителей | Нет |
| GET | `/api/v1/catalog/search` | Поиск товаров | Нет |
| GET | `/api/v1/catalog/facets` | Фасетные фильтры | Нет |
| GET | `/api/v1/catalog/telemetry/events` | Телескопия событий | Да |

#### Админ endpoints:

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/v1/admin/products` | Все товары | Да | Admin/Manager |
| POST | `/api/v1/admin/products` | Создать товар | Да | Admin |
| PUT | `/api/v1/admin/products/{id}` | Обновить товар | Да | Admin/Manager |
| DELETE | `/api/v1/admin/products/{id}` | Удалить товар | Да | Admin |
| POST | `/api/v1/admin/data/seed` | Импортировать каталог | Да | Admin |

---

### 2. AuthService (Порт: 9082)

Сервис аутентификации и авторизации.

**Swagger:** http://localhost:9082/swagger

#### Endpoints:

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/register` | Регистрация нового пользователя | Нет |
| POST | `/api/v1/auth/login` | Вход в систему | Нет |
| POST | `/api/v1/auth/refresh` | Обновление токена | Нет |
| POST | `/api/v1/auth/logout` | Выход из системы | Да |
| GET | `/api/v1/auth/profile` | Получение профиля | Да |
| PUT | `/api/v1/auth/profile` | Обновление профиля | Да |
| POST | `/api/v1/auth/change-password` | Смена пароля | Да |
| GET | `/api/v1/auth/address` | Адреса пользователя | Да |
| POST | `/api/v1/auth/address` | Добавить адрес | Да |
| GET | `/api/v1/wishlist` | Список желаемого | Да |
| POST | `/api/v1/wishlist/{productId}` | Добавить в избранное | Да |
| DELETE | `/api/v1/wishlist/{productId}` | Удалить из избранного | Да |

#### Ролевая модель:

| Роль | Описание |
|------|----------|
| **Client** | Обычный пользователь (оформление заказов) |
| **Manager** | Менеджер магазина (управление заказами и каталогом) |
| **Master** | Мастер по ремонту (выполнение услуг) |
| **Admin** | Администратор (полный доступ) |
| **Accountant** | Бухгалтер (финансовые отчёты) |

---

### 3. PCBuilderService

Сервис конструктора ПК с проверкой совместимости.

#### Endpoints:

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/pcbuilder/categories` | Категории компонентов | Нет |
| GET | `/api/v1/pcbuilder/components/{categoryId}` | Компоненты категории | Нет |
| POST | `/api/v1/pcbuilder/check-compatibility` | Проверка совместимости | Нет |
| GET | `/api/v1/pcbuilder/configurations` | Сохранённые конфигурации | Да |
| POST | `/api/v1/pcbuilder/configurations` | Создать конфигурацию | Да |
| PUT | `/api/v1/pcbuilder/configurations/{id}` | Обновить конфигурацию | Да |
| DELETE | `/api/v1/pcbuilder/configurations/{id}` | Удалить конфигурацию | Да |
| GET | `/api/v1/pcbuilder/recommendations/{componentId}` | Рекомендации | Нет |

#### Проверка совместимости:

API проверяет следующие зависимости:
- **Сокет:** Процессор ↔ Материнская плата
- **Память:** Тип RAM (DDR4/DDR5) ↔ Материнская плата
- **CPU Cooler:** ТDP кулера ↔ TDP процессора
- **PSU:** Мощность БП ↔ Суммарное потребление компонентов
- **Case:** Форм-фактор корпуса ↔ Материнская плата
- **GPU:** Длина видеокарты ↔ Корпус

---

### 4. OrdersService

Сервис заказов и интеграция с платежной системой.

#### Endpoints:

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/v1/orders/{id}` | Получение заказа по ID | Да | Client/Manager/Admin |
| GET | `/api/v1/orders/number/{orderNumber}` | Получение заказа по номеру | Да | Client/Manager/Admin |
| GET | `/api/v1/orders/my` | Мои заказы | Да | Client |
| GET | `/api/v1/orders` | Все заказы | Да | Manager/Admin/Accountant |
| POST | `/api/v1/orders` | Создание заказа | Да | Client |
| PUT | `/api/v1/orders/{id}/status` | Изменение статуса | Да | Manager/Admin |
| POST | `/api/v1/orders/{id}/cancel` | Отмена заказа | Да | Client |
| POST | `/api/v1/orders/{id}/pay` | Оплата заказа | Да | Client |
| GET | `/api/v1/orders/cart` | Корзина | Да | Client |
| POST | `/api/v1/orders/cart/items` | Добавить в корзину | Да | Client |
| DELETE | `/api/v1/orders/cart/items/{productId}` | Удалить из корзины | Да | Client |

#### Статусы заказа:

| Статус | Описание |
|--------|----------|
| **New** | Новый |
| **Processing** | В обработке |
| **Paid** | Оплачен |
| **InProgress** | В работе |
| **Ready** | Готов |
| **Completed** | Завершен |
| **Cancelled** | Отменён |

---

### 5. ServicesService

Сервис услуг (ремонт, диагностика, сборка).

#### Endpoints:

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/v1/services/types` | Типы услуг | Нет | - |
| GET | `/api/v1/services/{id}` | Заявка по ID | Да | Client/Master/Admin |
| GET | `/api/v1/services/my` | Мои заявки | Да | Client |
| GET | `/api/v1/services/master` | Заявки мастера | Да | Master |
| GET | `/api/v1/services` | Все заявки | Да | Manager/Admin |
| POST | `/api/v1/services` | Создание заявки | Да | Client |
| POST | `/api/v1/services/{id}/assign/{masterId}` | Назначить мастера | Да | Manager/Admin |
| PUT | `/api/v1/services/{id}/complete` | Завершить работу | Да | Master |
| POST | `/api/v1/services/{id}/cancel` | Отменить заявку | Да | Client |

#### Статусы заявки:

| Статус | Описание |
|--------|----------|
| **New** | Новая |
| **InProgress** | В работе |
| **Completed** | Завершена |
| **Cancelled** | Отменена |

---

### 6. WarrantyService

Сервис гарантийных случаев.

#### Endpoints:

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/v1/warranty/{id}` | Заявка по ID | Да | Client/Master/Admin |
| GET | `/api/v1/warranty/my` | Мои заявки | Да | Client |
| GET | `/api/v1/warranty` | Все заявки | Да | Manager/Admin/Master |
| POST | `/api/v1/warranty` | Создание заявки | Да | Client |
| PUT | `/api/v1/warranty/{id}/status` | Изменение статуса | Да | Manager/Admin/Master |
| POST | `/api/v1/warranty/{id}/resolve` | Решение по заявке | Да | Manager/Admin/Master |

#### Статусы гарантии:

| Статус | Описание |
|--------|----------|
| **New** | Новая |
| **InProgress** | В обработке |
| **Approved** | Одобрена |
| **Rejected** | Отклонена |
| **Resolved** | Решена |

---

## Общие форматы данных

### ApiResponse

```json
{
  "success": true,
  "message": "string",
  "data": {}
}
```

### PagedResult

```json
{
  "items": [],
  "totalCount": 100,
  "pageNumber": 1,
  "pageSize": 10,
  "totalPages": 10
}
```

### JWT Token Format

```
Authorization: Bearer {access_token}
```

---

## Коды ошибок

| Code | Description |
|------|-------------|
| 400 | Неверные данные запроса |
| 401 | Не авторизован |
| 403 | Доступ запрещён |
| 404 | Ресурс не найден |
| 409 | Конфликт (ресурс существует) |
| 422 | Ошибка валидации |
| 429 | Превышен лимит запросов |
| 500 | Внутренняя ошибка сервера |

---

## База данных

Используемые базы данных PostgreSQL:

| База данных | Порт | Сервисы |
|-------------|------|---------|
| `goldpc` | 5434 | AuthService, OrdersService, ServicesService, WarrantyService |
| `goldpc_catalog` | 5434 | CatalogService |

**Redis** (порт 6379): кэш и сессии.

---

## Запуск сервисов

### Через Docker Compose (рекомендуется)

```bash
# Из корня репозитория
docker compose -f docker/docker-compose.yml up -d

# Проверка статуса
docker compose -f docker/docker-compose.yml ps

# Просмотр логов
docker compose -f docker/docker-compose.yml logs -f
```

### Development mode

```bash
# Запуск отдельного сервиса
cd src
dotnet run --project CatalogService
dotnet run --project AuthService

# Запуск всех сервисов (требуется настроенная БД)
dotnet run --project CatalogService &
dotnet run --project AuthService &
dotnet run --project PCBuilderService &
dotnet run --project OrdersService &
dotnet run --project ServicesService &
dotnet run --project WarrantyService &
```

---

## Swagger UI

Доступ к Swagger документации:

| Сервис | URL |
|--------|-----|
| **CatalogService** | http://localhost:9081/swagger |
| **AuthService** | http://localhost:9082/swagger |

---

## Message Broker (RabbitMQ)

Для асинхронного взаимодействия между сервисами используется RabbitMQ.

**Management UI:** http://localhost:15672 (guest/guest)

### События:

| Event | Описание | Очередь |
|-------|----------|---------|
| `order.created` | Заказ создан | orders.new |
| `order.status_changed` | Статус заказа изменён | orders.updated |
| `order.cancelled` | Заказ отменён | orders.cancelled |
| `service_request.created` | Новая заявка на услугу | services.new |
| `service_request.assigned` | Заявка назначена мастеру | services.assigned |
| `warranty.created` | Новая гарантия | warranty.new |
| `inventory.low_stock` | Низкий остаток товара | inventory.alerts |
