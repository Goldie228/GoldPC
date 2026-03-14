# GoldPC - API документация

## Обзор

GoldPC - это микросервисная платформа для магазина компьютерных компонентов и сборки ПК.

## Микросервисы

### 1. AuthService (Порт: 5001)
Сервис аутентификации и авторизации.

#### Endpoints:

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/register` | Регистation нового пользователя | Нет |
| POST | `/api/v1/auth/login` | Вход в систему | Нет |
| POST | `/api/v1/auth/refresh` | Обновление токена | Да |
| POST | `/api/v1/auth/logout` | Выход из системы | Да |
| GET | `/api/v1/auth/profile` | Получение профиля | Да |
| PUT | `/api/v1/auth/profile` | Обновление профиля | Да |
| POST | `/api/v1/auth/change-password` | Смена пароля | Да |

#### Ролевая модель:
- **User** - обычный пользователь
- **Admin** - администратор
- **Manager** - менеджер магазина
- **Master** - мастер по ремонту
- **Accountant** - бухгалтер

### 2. OrdersService (Порт: 5002)
Сервис заказов и интеграция с платежной системой.

#### Endpoints:

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/v1/orders/{id}` | Получение заказа по ID | Да | User/Manager/Admin |
| GET | `/api/v1/orders/number/{orderNumber}` | Получение заказа по номеру | Да | User/Manager/Admin |
| GET | `/api/v1/orders/my` | Мои заказы | Да | User |
| GET | `/api/v1/orders` | Все заказы | Да | Manager/Admin/Accountant |
| POST | `/api/v1/orders` | Создание заказа | Да | User |
| PUT | `/api/v1/orders/{id}/status` | Изменение статуса | Да | Manager/Admin/Master |
| POST | `/api/v1/orders/{id}/cancel` | Отмена заказа | Да | User |
| POST | `/api/v1/orders/{id}/pay` | Оплата заказа | Да | User |

#### Статусы заказа:
1. **New** - Новый
2. **Processing** - В обработке
3. **Paid** - Оплачен
4. **InProgress** - В работе
5. **Ready** - Готов
6. **Completed** - Завершен
7. **Cancelled** - Отменён

### 3. ServicesService (Порт: 5003)
Сервис услуг (ремонт,диагностика/сборка).

#### Endpoints:

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/v1/services/types` | Типы услуг | Нет | - |
| GET | `/api/v1/services/{id}` | Заявка по ID | Да | User/Master/Admin |
| GET | `/api/v1/services/my` | Мои заявки | Да | User |
| GET | `/api/v1/services/master` | Заявки мастера | Да | Master |
| GET | `/api/v1/services` | Все заявки | Да | Manager/Admin |
| POST | `/api/v1/services` | Создание заявки | Да | User |
| POST | `/api/v1/services/{id}/assign/{masterId}` | Назначить мастера | Да | Manager/Admin |
| PUT | `/api/v1/services/{id}/complete` | Завершить работу | Да | Master |
| POST | `/api/v1/services/{id}/cancel` | Отменить заявку | Да | User |

#### Статусы заявки:
1. **New** - Новая
2. **InProgress** - В работе
3. **Completed** - Завершена
4. **Cancelled** - Отменена

### 4. WarrantyService (Порт: 5004)
Сервис гарантийных случаев.

#### Endpoints:

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/v1/warranty/{id}` | Заявка по ID | Да | User/Master/Admin |
| GET | `/api/v1/warranty/my` | Мои заявки | Да | User |
| GET | `/api/v1/warranty` | Все заявки | Да | Manager/Admin/Master |
| POST | `/api/v1/warranty` | Создание заявки | Да | User |
| PUT | `/api/v1/warranty/{id}/status` | Изменение статуса | Да | Manager/Admin/Master |
| POST | `/api/v1/warranty/{id}/resolve` | Решение по заявке | Да | Manager/Admin/Master |

#### Статусы гарантии:
1. **New** - Новая
2. **InProgress** - В обработке
3. **Approved** - Одобрена
4. **Rejected** - Отклонена
5. **Resolved** - Решена

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
  "pageSize": 10
}
```

### JWT Token Format
```
Authorization: Bearer {access_token}
```

## Коды ошибок

| Code | Description |
|------|-------------|
| 400 | Неверные данные запроса |
| 401 | Не авторизован |
| 403 | Доступ запрещён |
| 404 | Ресурс не найден |
| 500 | Внутренняя ошибка сервера |

## База данных

Каждый микросервис использует отдельную базу данных PostgreSQL:
- `goldpc_auth` - пользователи и токены
- `goldpc_orders` - заказы и позиции
- `goldpc_services` - заявки на услуги
- `goldpc_warranty` - гарантийные случаи

## Запуск сервисов

```bash
# Development mode
cd 7/kursovaya/src
dotnet run --project AuthService
dotnet run --project OrdersService
dotnet run --project ServicesService
dotnet run --project WarrantyService
```

## Swagger UI

- Auth: http://localhost:5001/swagger
- Orders: http://localhost:5002/swagger
- Services: http://localhost:5003/swagger
- Warranty: http://localhost:5004/swagger