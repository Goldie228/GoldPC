# API — GoldPC

Документация API системы компьютерного магазина с сервисным центром.

## Базовая информация

| Параметр | Значение |
|----------|-----------|
| **Base URL** | `http://localhost:5001` (Catalog), `http://localhost:5002` (Orders), `http://localhost:5003` (Auth), `http://localhost:5004` (PC Builder) |
| **Версия** | v1 |
| **Формат** | JSON |
| **Аутентификация** | JWT Bearer token (`Authorization: Bearer <token>`) |

## Структура API

### AuthService (порт 5003)
Аутентификация и управление пользователями.

| Метод | Endpoint | Описание | Требует Auth |
|-------|----------|-----------|--------------|
| POST | `/api/v1/auth/register` | Регистрация пользователя | ❌ |
| POST | `/api/v1/auth/login` | Вход в систему | ❌ |
| POST | `/api/v1/auth/refresh` | Обновление токена | ❌ |
| POST | `/api/v1/auth/logout` | Выход из системы | ✅ |
| GET | `/api/v1/users/me` | Профиль текущего пользователя | ✅ |
| PUT | `/api/v1/users/me` | Обновление профиля | ✅ |
| GET | `/api/v1/users` | Список пользователей (Admin) | ✅ Admin |
| GET | `/api/v1/users/{id}/addresses` | Адреса пользователя | ✅ |
| POST | `/api/v1/users/{id}/addresses` | Добавление адреса | ✅ |

### CatalogService (порт 5001)
Каталог товаров, категории, производители.

| Метод | Endpoint | Описание | Требует Auth |
|-------|----------|-----------|--------------|
| GET | `/api/v1/catalog/products` | Список товаров (с фильтрацией и пагинацией) | ❌ |
| GET | `/api/v1/catalog/products/{productId}` | Детали товара | ❌ |
| POST | `/api/v1/catalog/products` | Создание товара (Manager+) | ✅ Manager |
| PUT | `/api/v1/catalog/products/{id}` | Обновление товара (Manager+) | ✅ Manager |
| DELETE | `/api/v1/catalog/products/{id}` | Удаление товара (Manager+) | ✅ Manager |
| GET | `/api/v1/catalog/categories` | Дерево категорий | ❌ |
| GET | `/api/v1/catalog/manufacturers` | Список производителей | ❌ |
| GET | `/api/v1/catalog/search` | Полнотекстовый поиск | ❌ |
| GET | `/api/v1/catalog/categories/{slug}/filter-attributes` | Атрибуты фильтров категории | ❌ |
| GET | `/api/v1/catalog/categories/{slug}/filter-facets` | Фасеты фильтров категории | ❌ |

### OrdersService (порт 5002)
Заказы, корзина, оплата.

| Метод | Endpoint | Описание | Требует Auth |
|-------|----------|-----------|--------------|
| GET | `/api/v1/orders` | Список заказов пользователя | ✅ |
| GET | `/api/v1/orders/{id}` | Детали заказа | ✅ |
| POST | `/api/v1/orders` | Создание заказа | ✅ |
| PUT | `/api/v1/orders/{id}/status` | Изменение статуса (Manager+) | ✅ Manager |
| GET | `/api/v1/cart` | Текущая корзина | ✅ |
| POST | `/api/v1/cart/items` | Добавление в корзину | ✅ |
| DELETE | `/api/v1/cart/items/{id}` | Удаление из корзины | ✅ |
| POST | `/api/v1/checkout` | Оформление заказа | ✅ |
| POST | `/api/v1/promo/validate` | Проверка промокода | ✅ |

### PCBuilderService (порт 5004)
Конструктор ПК, проверка совместимости.

| Метод | Endpoint | Описание | Требует Auth |
|-------|----------|-----------|--------------|
| POST | `/api/v1/pcbuilder/check-compatibility` | Проверка совместимости компонентов | ❌ |
| POST | `/api/v1/pcbuilder/calculate` | Расчёт стоимости сборки | ❌ |
| GET | `/api/v1/pcbuilder/recommend` | Рекомендации компонентов | ❌ |
| POST | `/api/v1/pcbuilder/configurations` | Сохранение конфигурации | ✅ |
| GET | `/api/v1/pcbuilder/configurations` | Список конфигураций пользователя | ✅ |
| GET | `/api/v1/pcbuilder/configurations/{id}` | Детали конфигурации | ✅ |
| GET | `/api/v1/pcbuilder/share/{token}` | Просмотр публичной сборки | ❌ |

### ServicesService (порт 5005)
Сервисный центр, заявки на ремонт.

| Метод | Endpoint | Описание | Требует Auth |
|-------|----------|-----------|--------------|
| GET | `/api/v1/services` | Список услуг | ❌ |
| GET | `/api/v1/services/types` | Типы услуг | ❌ |
| GET | `/api/v1/requests` | Список заявок | ✅ |
| POST | `/api/v1/requests` | Создание заявки | ✅ |
| GET | `/api/v1/requests/{id}` | Детали заявки | ✅ |
| PUT | `/api/v1/requests/{id}/status` | Изменение статуса | ✅ Master |
| PUT | `/api/v1/requests/{id}/assign` | Назначение мастера | ✅ Admin |

### WarrantyService (порт 5006)
Гарантийные талоны.

| Метод | Endpoint | Описание | Требует Auth |
|-------|----------|-----------|--------------|
| GET | `/api/v1/warranties` | Список гарантий пользователя | ✅ |
| GET | `/api/v1/warranties/{id}` | Детали гарантии | ✅ |
| GET | `/api/v1/warranties/check/{number}` | Проверка по номеру | ❌ |
| POST | `/api/v1/warranties` | Создание гарантии | ✅ Manager |
| PUT | `/api/v1/warranties/{id}/annul` | Аннулирование гарантии | ✅ Admin |

## Формат ответов

### Успешный ответ
```json
{
  "success": true,
  "data": { /* данные */ },
  "message": "Операция выполнена успешно"
}
```

### Ответ с ошибкой
```json
{
  "success": false,
  "errors": ["Описание ошибки"],
  "message": "Произошла ошибка"
}
```

### Пагинация
```json
{
  "items": [ /* массив данных */ ],
  "totalCount": 100,
  "page": 1,
  "pageSize": 20,
  "totalPages": 5
}
```

## Статусы заказов

```
New → Processing → Paid → Ready → Completed
                     ↓
                  Cancelled
```

## Статусы сервисных заявок

```
New → InProgress → WaitingForParts → Completed → Closed
                              ↓
                           Cancelled
```

## Роли пользователей

| Роль | Права доступа |
|------|---------------|
| `Client` | Просмотр каталога, оформление заказов, конструктор ПК |
| `Manager` | Управление заказами и каталогом |
| `Master` | Сервисные заявки и ремонт |
| `Admin` | Полный доступ к системе |
| `Accountant` | Финансовые отчёты |

## Swagger UI

Каждый сервис предоставляет Swagger UI для тестирования API:

- AuthService: `http://localhost:5003/swagger`
- CatalogService: `http://localhost:5001/swagger`
- OrdersService: `http://localhost:5002/swagger`
- PCBuilderService: `http://localhost:5004/swagger`
- ServicesService: `http://localhost:5005/swagger`
- WarrantyService: `http://localhost:5006/swagger`

---

*Документация обновлена: 2026-04-30*
