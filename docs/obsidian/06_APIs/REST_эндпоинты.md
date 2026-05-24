# REST API эндпоинты

> **Раздел**: 06_APIs
> **Версия**: 1.0 | **Последнее обновление**: 2026-05-24
> **Base URL**: `/api/v1`

---

## 🔐 AuthService — `/auth`

| Метод | Эндпоинт | Тело запроса | Ответ | Доступ |
|---|---|---|---|---|
| `POST` | `/auth/register` | `{ email, password, firstName, lastName, phone }` | `{ accessToken, refreshToken, user }` | Public |
| `POST` | `/auth/login` | `{ email, password }` | `{ accessToken, refreshToken, user }` | Public |
| `POST` | `/auth/refresh` | `{ refreshToken }` | `{ accessToken, refreshToken }` | Public |
| `POST` | `/auth/logout` | `{ refreshToken }` | `204` | Authenticated |
| `GET` | `/auth/profile` | — | `{ id, email, name, phone, roles }` | Authenticated |
| `PUT` | `/auth/profile` | `{ firstName, lastName, phone }` | `{ user }` | Authenticated |
| `PUT` | `/auth/password` | `{ currentPassword, newPassword }` | `204` | Authenticated |
| `POST` | `/auth/forgot-password` | `{ email }` | `200` (всегда) | Public |
| `POST` | `/auth/reset-password` | `{ token, newPassword }` | `204` | Public |
| `GET` | `/auth/verify-email` | `?token=` | `{ message }` | Public |
| `POST` | `/auth/resend-verification` | `{ email }` | `204` | Public |
| `GET` | `/auth/2fa/status` | — | `{ isEnabled, isVerified }` | Authenticated |
| `POST` | `/auth/2fa/setup` | — | `{ secretKey, qrCodeUrl }` | Authenticated |
| `POST` | `/auth/2fa/verify` | `{ code }` | `{ backupCodes }` | Authenticated |
| `POST` | `/auth/2fa/disable` | `{ password }` | `204` | Authenticated |
| `POST` | `/auth/2fa/recovery` | `{ recoveryCode }` | `{ accessToken }` | Public |
| `GET` | `/auth/addresses` | — | `[addresses]` | Authenticated |
| `POST` | `/auth/addresses` | `{ street, city, postalCode }` | `{ address }` | Authenticated |
| `PUT` | `/auth/addresses/{id}` | `{ street, city, postalCode }` | `{ address }` | Authenticated |
| `DELETE` | `/auth/addresses/{id}` | — | `204` | Authenticated |
| `GET` | `/auth/wishlist` | — | `[productIds]` | Authenticated |
| `POST` | `/auth/wishlist` | `{ productId }` | `201` | Authenticated |
| `DELETE` | `/auth/wishlist/{productId}` | — | `204` | Authenticated |
| `GET` | `/auth/notifications/preferences` | — | `{ preferences }` | Authenticated |
| `PUT` | `/auth/notifications/preferences` | `{ orderUpdates, promotions }` | `204` | Authenticated |

**Валидация** (FluentValidation):
- Email: формат email
- Password: мин. 8 символов, заглавная, строчная, цифра, спецсимвол
- Имя/фамилия: непустые, макс. 100 символов
- Телефон: формат +375XXXXXXXXX

---

## 🛒 CatalogService — `/catalog`

| Метод | Эндпоинт | Параметры | Ответ | Доступ |
|---|---|---|---|---|
| `GET` | `/catalog/products` | `?categoryId, manufacturerId, minPrice, maxPrice, sortBy, page, pageSize, specs[]` | `{ items, totalCount, totalPages }` | Public |
| `GET` | `/catalog/products/{id}` | — | `{ product }` | Public |
| `GET` | `/catalog/products/{slug}` | — | `{ product }` | Public |
| `GET` | `/catalog/products/featured` | — | `[products]` | Public |
| `GET` | `/catalog/categories` | — | `[categories]` | Public |
| `GET` | `/catalog/categories/{id}` | — | `{ category }` | Public |
| `GET` | `/catalog/manufacturers` | — | `[manufacturers]` | Public |
| `GET` | `/catalog/products/{id}/reviews` | `?page, pageSize` | `{ reviews, totalCount }` | Public |
| `POST` | `/catalog/products/{id}/reviews` | `{ rating, comment }` | `{ review }` | Authenticated |
| `GET` | `/catalog/products/{id}/specifications` | — | `[specs]` | Public |
| `GET` | `/catalog/filters/{categoryId}` | — | `{ filters }` | Public |
| `GET` | `/catalog/facets` | `?categoryId, filters` | `{ facetCounts }` | Public |
| `GET` | `/catalog/search` | `?q, categoryId, page, pageSize` | `{ items, totalCount }` | Public |

### Фильтрация (Faceted Search)

```json
GET /api/v1/catalog/facets?categoryId=gpu&filters[vram][]=8GB&filters[vram][]=16GB

Response: {
  "products": [...],
  "facets": {
    "vram": [{ "value": "8GB", "count": 12 }, { "value": "16GB", "count": 8 }],
    "manufacturer": [{ "value": "NVIDIA", "count": 15 }, { "value": "AMD", "count": 10 }]
  }
}
```

### Пагинация

```json
GET /api/v1/catalog/products?page=1&pageSize=20&sortBy=price_asc

Response: {
  "items": [...],
  "totalCount": 150,
  "page": 1,
  "pageSize": 20,
  "totalPages": 8
}
```

---

## 🔧 Admin — `/admin`

| Метод | Эндпоинт | Описание | Доступ |
|---|---|---|---|
| `GET` | `/admin/products` | Все товары (с черновиками) | Admin, Manager |
| `POST` | `/admin/products` | Создать товар | Admin, Manager |
| `PUT` | `/admin/products/{id}` | Обновить товар | Admin, Manager |
| `DELETE` | `/admin/products/{id}` | Удалить товар | Admin |
| `POST` | `/admin/products/{id}/images` | Загрузить изображение | Admin, Manager |
| `DELETE` | `/admin/products/{id}/images/{imageId}` | Удалить изображение | Admin, Manager |
| `POST` | `/admin/migrations/specifications` | Запустить миграцию спецификаций | Admin |

---

## 📦 OrdersService — `/orders`

| Метод | Эндпоинт | Описание | Доступ |
|---|---|---|---|
| `POST` | `/orders` | Создать заказ | Authenticated |
| `GET` | `/orders` | Список заказов пользователя | Authenticated |
| `GET` | `/orders/{id}` | Детали заказа | Authenticated |
| `PUT` | `/orders/{id}/status` | Обновить статус | Admin, Manager |
| `POST` | `/orders/{id}/cancel` | Отменить заказ | Authenticated (владелец) |
| `POST` | `/orders/validate-promo` | Проверить промокод | Authenticated |
| `POST` | `/webhooks/stripe` | Webhook от Stripe | Public (Stripe) |

### Статусы заказа

| Статус | Значение |
|---|---|
| `New` | Новый заказ |
| `Confirmed` | Подтверждён |
| `Processing` | В обработке |
| `Shipped` | Отправлен |
| `Delivered` | Доставлен |
| `Completed` | Завершён |
| `Cancelled` | Отменён |

---

## 🛠️ ServicesService — `/services`

| Метод | Эндпоинт | Описание | Доступ |
|---|---|---|---|
| `GET` | `/services/types` | Типы услуг | Public |
| `POST` | `/services/requests` | Создать заявку | Authenticated |
| `GET` | `/services/requests` | Мои заявки | Authenticated |
| `GET` | `/services/requests/{id}` | Детали заявки | Authenticated |
| `PUT` | `/services/requests/{id}/status` | Обновить статус | Master, Admin |
| `PUT` | `/services/requests/{id}/assign` | Назначить мастера | Admin |
| `POST` | `/services/requests/{id}/parts` | Добавить запчасти | Master, Admin |
| `POST` | `/services/requests/{id}/report` | Отчёт о работе | Master |

---

## 📋 WarrantyService — `/warranty`

| Метод | Эндпоинт | Описание | Доступ |
|---|---|---|---|
| `GET` | `/warranty/cards` | Мои гарантийные карты | Authenticated |
| `GET` | `/warranty/cards/{id}` | Детали карты | Authenticated |
| `GET` | `/warranty/check/{productId}` | Проверка гарантии | Public |
| `POST` | `/warranty/claims` | Создать гарантийную претензию | Authenticated |
| `GET` | `/warranty/claims` | Мои претензии | Authenticated |
| `GET` | `/warranty/claims/{id}` | Детали претензии | Authenticated |
| `PUT` | `/warranty/claims/{id}/status` | Обновить статус | Master, Admin |

---

## 🔧 PCBuilderService — `/pcbuilder`

| Метод | Эндпоинт | Описание | Доступ |
|---|---|---|---|
| `GET` | `/pcbuilder/configurations` | Мои конфигурации | Authenticated |
| `POST` | `/pcbuilder/configurations` | Создать конфигурацию | Authenticated |
| `GET` | `/pcbuilder/configurations/{id}` | Детали | Authenticated |
| `PUT` | `/pcbuilder/configurations/{id}` | Обновить | Authenticated |
| `DELETE` | `/pcbuilder/configurations/{id}` | Удалить | Authenticated |
| `GET` | `/pcbuilder/configurations/shared/{token}` | Публичная конфигурация | Public |
| `POST` | `/pcbuilder/compatibility/check` | Проверить совместимость | Authenticated |
| `POST` | `/pcbuilder/compatibility/fps` | Рассчитать FPS | Authenticated |

### Проверка совместимости

```json
POST /api/v1/pcbuilder/compatibility/check
{
  "processorId": "uuid",
  "motherboardId": "uuid",
  "ramId": "uuid",
  "gpuId": "uuid",
  "psuId": "uuid",
  "caseId": "uuid",
  "coolerId": "uuid"
}

Response: {
  "isCompatible": true,
  "issues": [],
  "warnings": [{ "type": "psu_margin", "message": "Запас по БП менее 20%" }]
}
```

---

## 📊 ReportingService — `/reports`

| Метод | Эндпоинт | Описание | Доступ |
|---|---|---|---|
| `GET` | `/reports/sales` | Отчёт по продажам | Accountant, Admin |
| `GET` | `/reports/service-efficiency` | Эффективность мастеров | Admin |
| `GET` | `/reports/inventory` | Анализ остатков | Manager, Admin |
| `GET` | `/reports/audit` | Аудит изменений | Admin |

---

## 🔗 Связанные страницы

- [[06_APIs/Обзор_API]] — общая архитектура API
- [[06_APIs/gRPC_контракты]] — gRPC протокол
- [[08_Security/JWT_аутентификация]] — JWT flow
- [[09_Auth/Обзор_аутентификации]] — auth flow
