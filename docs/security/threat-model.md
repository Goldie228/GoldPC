# Threat Model — GoldPC

**Версия документа:** 1.0  
**Дата создания:** 15.03.2026  
**Автор:** Security Analyst  
**Статус:** Утверждён

---

## Содержание

1. [Обзор системы](#1-обзор-системы)
2. [Идентификация активов](#2-идентификация-активов)
3. [STRIDE анализ AuthService](#3-stride-анализ-authservice)
4. [STRIDE анализ OrdersService](#4-stride-анализация-ordersservice)
5. [Матрица угроз](#5-матрица-угроз)
6. [Реализованные меры защиты](#6-реализованные-меры-защиты)
7. [Предлагаемые меры защиты](#7-предлагаемые-меры-защиты)
8. [Рекомендации по безопасности](#8-рекомендации-по-безопасности)

---

## 1. Обзор системы

### 1.1 Описание системы

GoldPC — веб-приложение для компьютерного магазина с сервисным центром. Система состоит из нескольких микросервисов, из которых анализируются:

- **AuthService** — сервис аутентификации и авторизации
- **OrdersService** — сервис управления заказами

### 1.2 Архитектура анализируемых компонентов

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                          │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     AuthService (Port 5001)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │AuthController│  │ AuthService │  │      JwtService         │  │
│  │  /register   │  │ BCrypt (12) │  │ Access: 15 min          │  │
│  │  /login      │  │ Lockout     │  │ Refresh: 7 days         │  │
│  │  /refresh    │  │ Audit Log   │  │ HMAC-SHA256             │  │
│  │  /logout     │  │             │  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                         │                                        │
│                         ▼                                        │
│              ┌─────────────────────┐                            │
│              │   PostgreSQL DB     │                            │
│              │  Users, RefreshTokens│                            │
│              └─────────────────────┘                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     OrdersService (Port 5002)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │OrdersController│ │ OrdersService│  │    PaymentService      │  │
│  │  GET /orders   │  │ Status FSM   │  │   External Payment API │  │
│  │  POST /orders  │  │ History Log  │  │                        │  │
│  │  PUT /status   │  │ Validation   │  │                        │  │
│  │  POST /cancel  │  │              │  │                        │  │
│  └──────────────┘  └──────────────┘  └────────────────────────┘  │
│                         │                                        │
│                         ▼                                        │
│              ┌─────────────────────┐                            │
│              │   PostgreSQL DB     │                            │
│              │ Orders, OrderItems, │                            │
│              │   OrderHistory      │                            │
│              └─────────────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Потоки данных

| Поток | Описание | Протокол |
|-------|----------|----------|
| Client → AuthService | Регистрация, вход, обновление токена | HTTPS/JSON |
| AuthService → Client | JWT токены, профиль пользователя | HTTPS/JSON |
| Client → OrdersService | Создание, просмотр, отмена заказов | HTTPS/JSON + JWT |
| OrdersService → Payment API | Инициация оплаты | HTTPS/JSON |

---

## 2. Идентификация активов

### 2.1 Критические активы

| Актив | Тип | Ценность | Владелец | Воздействие при компрометации |
|-------|-----|----------|----------|-------------------------------|
| **Пароли пользователей** | Credentials | Критическая | Security | Полный захват аккаунта |
| **JWT Access Tokens** | Credentials | Высокая | Security | Подмена личности, 15 мин доступа |
| **Refresh Tokens** | Credentials | Высокая | Security | Долгосрочный доступ (7 дней) |
| **Персональные данные (PII)** | PII | Высокая | GDPR | Финансовые/репутационные потери |
| **История заказов** | Business | Высокая | Business | Утечка коммерческой информации |
| **Финансовые транзакции** | Financial | Критическая | Finance | Прямые финансовые потери |

### 2.2 Активы AuthService

| Актив | Расположение | Формат | Защита |
|-------|--------------|--------|--------|
| Email пользователей | PostgreSQL | Plaintext | RBAC, TLS |
| Хэш паролей | PostgreSQL | BCrypt (workFactor: 12) | Одностороннее хэширование |
| Refresh токены | PostgreSQL | Base64 (64 байта) | Revocation list |
| JWT Secret Key | Environment Variable | String (256+ бит) | Вне кода, ротация |

### 2.3 Активы OrdersService

| Актив | Расположение | Формат | Защита |
|-------|--------------|--------|--------|
| Данные заказов | PostgreSQL | Structured | RBAC, audit log |
| История изменений статусов | PostgreSQL | Structured | Immutable log |
| Информация о доставке | PostgreSQL | Structured | RBAC |
| Суммы заказов | PostgreSQL | Decimal | Валидация |

---

## 3. STRIDE анализ AuthService

### 3.1 Spoofing (Спуфинг / Подмена личности)

**Определение:** Несанкционированный доступ к системе под видом легитимного пользователя.

#### Угроза S-1: Кража JWT Access Token

| Атрибут | Значение |
|---------|----------|
| **Описание** | Злоумышленник перехватывает JWT токен через XSS, MITM или логирование |
| **Вектор атаки** | XSS на frontend, отсутствие HSTS, небезопасные cookies |
| **Вероятность** | Средняя |
| **Влияние** | Высокое — полный доступ к аккаунту на 15 минут |
| **Риск** | **Высокий** |

**Реализованные меры:**
- ✅ Короткий срок жизни токена (15 минут)
- ✅ Валидация подписи токена (HMAC-SHA256)
- ✅ Валидация issuer, audience, lifetime
- ✅ ClockSkew = 0 (нет допуска по времени)

**Предлагаемые меры:**
- 🔄 Добавить `httpOnly`, `secure`, `sameSite` атрибуты для cookies
- 🔄 Реализовать привязку токена к IP/Device Fingerprint
- 🔄 Добавить HTTP Header `Authorization: Bearer` вместо URL parameter
- 🔄 Внедрить CSP (Content Security Policy) на frontend

---

#### Угроза S-2: Кража Refresh Token

| Атрибут | Значение |
|---------|----------|
| **Описание** | Злоумышленник получает refresh token и использует его для генерации новых access токенов |
| **Вектор атаки** | XSS, компрометация localStorage, перехват в сети |
| **Вероятность** | Средняя |
| **Влияние** | Критическое — доступ на 7 дней |
| **Риск** | **Критический** |

**Реализованные меры:**
- ✅ Refresh token генерируется криптографически стойко (RandomNumberGenerator, 64 байта)
- ✅ Хранение хэша токена в БД (опционально)
- ✅ Revocation при logout
- ✅ Привязка к IP-адресу создания (CreatedByIp)
- ✅ Single-use — токен инвалидидируется при обновлении

**Предлагаемые меры:**
- 🔄 Проверка IP-адреса при refresh (опционально)
- 🔄 Ограничение количества активных refresh токенов на пользователя
- 🔄 Детектирование аномальной активности (несколько refresh с разных IP)

---

#### Угроза S-3: Перебор учётных данных (Credential Stuffing / Brute Force)

| Атрибут | Значение |
|---------|----------|
| **Описание** | Злоумышленник пытается подобрать пароль или использует утекшие базы |
| **Вектор атаки** | Автоматизированные запросы к `/api/v1/auth/login` |
| **Вероятность** | Высокая |
| **Влияние** | Критическое — захват аккаунта |
| **Риск** | **Высокий** |

**Реализованные меры:**
- ✅ BCrypt с workFactor = 12 (защита от rainbow tables)
- ✅ Account Lockout: 5 неудачных попыток → блокировка 15 минут
- ✅ Сброс счётчика при успешном входе
- ✅ Логирование неудачных попыток

**Предлагаемые меры:**
- 🔄 Rate limiting на уровне API Gateway (100 req/min)
- 🔄 CAPTCHA после 3 неудачных попыток
- 🔄 Alerting при множественных неудачных попытках
- 🔄 Проверка пароля на утечки (haveibeenpwned API)

---

### 3.2 Tampering (Несанкционированное изменение данных)

**Определение:** Несанкционированная модификация данных.

#### Угроза T-1: Модификация JWT Token Payload

| Атрибут | Значение |
|---------|----------|
| **Описание** | Злоумышленник изменяет claims в JWT (role, userId, email) |
| **Вектор атаки** | Попытка создать поддельный токен или изменить существующий |
| **Вероятность** | Низкая |
| **Влияние** | Критическое — повышение привилегий |
| **Риск** | **Средний** |

**Реализованные меры:**
- ✅ Подпись токена HMAC-SHA256
- ✅ Валидация подписи при каждом запросе (`ValidateIssuerSigningKey = true`)
- ✅ Использование уникального JTI для каждого токена

**Предлагаемые меры:**
- 🔄 Рассмотреть RS256 (асимметричная подпись) для распределённых систем
- 🔄 Добавить claim с fingerprint браузера

---

#### Угроза T-2: SQL Injection

| Атрибут | Значение |
|---------|----------|
| **Описание** | Внедрение SQL-кода через входные параметры |
| **Вектор атаки** | Поля email, phone, firstName, lastName в формах |
| **Вероятность** | Низкая |
| **Влияние** | Критическое — полная компрометация БД |
| **Риск** | **Низкий** |

**Реализованные меры:**
- ✅ Entity Framework Core с параметризованными запросами
- ✅ LINQ для построения запросов
- ✅ Отсутствие сырых SQL-запросов в коде

**Предлагаемые меры:**
- 🔄 Валидация входных данных на уровне DTO (FluentValidation)
- 🦁 Регулярный security code review

---

### 3.3 Repudiation (Отказ от авторства)

**Определение:** Невозможность доказать, кто выполнил действие.

#### Угроза R-1: Отсутствие логов критических операций

| Атрибут | Значение |
|---------|----------|
| **Описание** | Пользователь отрицает совершение действий (регистрация, изменение пароля) |
| **Вектор атаки** | Юридические споры, мошенничество |
| **Вероятность** | Средняя |
| **Влияние** | Среднее — невозможность расследования |
| **Риск** | **Средний** |

**Реализованные меры:**
- ✅ Логирование регистрации пользователя (`_logger.LogInformation`)
- ✅ Логирование входа в систему
- ✅ Логирование неудачных попыток входа
- ✅ Запись IP-адреса при создании refresh token
- ✅ Запись причины отзыва токена (RevokedReason)

**Предлагаемые меры:**
- 🔄 Централизованный audit log с защитой от модификации
- 🔄 Запись User-Agent и Device Fingerprint
- 🔄 Хранение логов в защищённом хранилище (SIEM)
- 🔄 Подпись логов для гарантии целостности

---

### 3.4 Information Disclosure (Утечка информации)

**Определение:** Несанкционированный доступ к конфиденциальной информации.

#### Угроза I-1: Утечка PII через API Response

| Атрибут | Значение |
|---------|----------|
| **Описание** | Профиль пользователя содержит чувствительные данные |
| **Вектор атаки** | Перехват ответа API, XSS, MITM |
| **Вероятность** | Средняя |
| **Влияние** | Высокое — нарушение GDPR |
| **Риск** | **Высокий** |

**Реализованные меры:**
- ✅ PasswordHash не возвращается в API (используется DTO)
- ✅ Использование DTO для исключения чувствительных полей
- ✅ HTTPS для всех соединений

**Предлагаемые меры:**
- 🔄 Шифрование PII в БД (AES-256-GCM)
- 🔄 Маскирование email/phone в ответах для других пользователей
- 🔄 Audit log для доступа к PII
- 🔄 Data minimization — возврат только необходимых полей

---

#### Угроза I-2: Информационная утечка через сообщения об ошибках

| Атрибут | Значение |
|---------|----------|
| **Описание** | Детальные сообщения об ошибках раскрывают внутреннюю структуру |
| **Вектор атаки** | Специально сформированные запросы |
| **Вероятность** | Средняя |
| **Влияние** | Среднее — reconnaissance для дальнейших атак |
| **Риск** | **Средний** |

**Реализованные меры:**
- ✅ Обобщённые сообщения об ошибках ("Неверные учётные данные")
- ✅ Не раскрывается, существует ли email в системе

**Предлагаемые меры:**
- 🔄 Глобальный exception handler с sanitised responses
- 🔄 Отдельные логи для debugging без отправки клиенту
- 🔄 Удаление stack trace в production

---

#### Угроза I-3: Раскрытие JWT Secret Key

| Атрибут | Значение |
|---------|----------|
| **Описание** | Злоумышленник получает секретный ключ для подписи JWT |
| **Вектор атаки** | Компрометация конфигурации, логи, код |
| **Вероятность** | Низкая |
| **Влияние** | Критическое — подделка любых токенов |
| **Риск** | **Критический** |

**Реализованные меры:**
- ✅ SecretKey загружается из конфигурации (не хардкод)
- ✅ `InvalidOperationException` если ключ не настроен

**Предлагаемые меры:**
- 🔄 Использование Vault (HashiCorp Vault / Azure Key Vault)
- 🔄 Регулярная ротация ключа
- 🔄 Минимум 256 бит для ключа
- 🔄 Разные ключи для разных окружений

---

### 3.5 Denial of Service (Отказ в обслуживании)

**Определение:** Сделать систему недоступной для легитимных пользователей.

#### Угроза D-1: Флуд запросами на аутентификацию

| Атрибут | Значение |
|---------|----------|
| **Описание** | Массовые запросы на `/login` для исчерпания ресурсов |
| **Вектор атаки** | DDoS, ботнет |
| **Вероятность** | Средняя |
| **Влияние** | Высокое — сервис недоступен |
| **Риск** | **Высокий** |

**Реализованные меры:**
- ✅ BCrypt workFactor=12 создаёт нагрузку на CPU атакующего
- ✅ Account lockout ограничивает попытки

**Предлагаемые меры:**
- 🔄 Rate limiting на уровне API Gateway (100 req/min per IP)
- 🔄 Throttling для BCrypt (очередь запросов)
- 🔄 CDN/DDoS protection (Cloudflare)
- 🔄 Circuit breaker pattern

---

### 3.6 Elevation of Privilege (Повышение привилегий)

**Определение:** Получение прав, превышающих изначальные.

#### Угроза E-1: Подмена роли в JWT

| Атрибут | Значение |
|---------|----------|
| **Описание** | Клиент меняет роль с Client на Admin в токене |
| **Вектор атаки** | Модификация JWT payload |
| **Вероятность** | Низкая |
| **Влияние** | Критическое — полный контроль над системой |
| **Риск** | **Низкий** (благодаря подписи) |

**Реализованные меры:**
- ✅ Подпись JWT содержит role claim
- ✅ Валидация подписи при каждом запросе
- ✅ Роль берётся из БД при генерации токена

**Предлагаемые меры:**
- 🔄 Проверка роли в БД для критических операций (не только в JWT)
- 🔄 Separate admin tokens с более коротким сроком жизни

---

#### Угроза E-2: IDOR (Insecure Direct Object Reference) в AuthService

| Атрибут | Значение |
|---------|----------|
| **Описание** | Пользователь пытается получить доступ к чужому профилю |
| **Вектор атаки** | Изменение ID в запросе к `/profile` или при обновлении |
| **Вероятность** | Средняя |
| **Влияние** | Высокое — утечка PII |
| **Риск** | **Низкий** |

**Реализованные меры:**
- ✅ User ID берётся из JWT claims, а не из параметров запроса
- ✅ `/profile` не принимает ID — всегда возвращает данные текущего пользователя

**Анализ кода:**
```csharp
// AuthController.cs - безопасное получение ID
var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
    ?? User.FindFirst("sub")?.Value;
```

---

## 4. STRIDE анализ OrdersService

### 4.1 Spoofing (Спуфинг / Подмена личности)

#### Угроза S-4: Использование чужого JWT Token

| Атрибут | Значение |
|---------|----------|
| **Описание** | Злоумышленник использует украденный JWT для доступа к заказам жертвы |
| **Вектор атаки** | XSS, MITM, компрометация localStorage |
| **Вероятность** | Средняя |
| **Влияние** | Высокое — доступ к чужим заказам |
| **Риск** | **Высокий** |

**Реализованные меры:**
- ✅ Валидация JWT при каждом запросе
- ✅ Проверка срока действия токена

**Предлагаемые меры:**
- 🔄 Token binding к устройству
- 🔄 Short-lived tokens
- 🔄 Refresh token rotation

---

### 4.2 Tampering (Несанкционированное изменение данных)

#### Угроза T-3: Несанкционированное изменение статуса заказа

| Атрибут | Значение |
|---------|----------|
| **Описание** | Пользователь меняет статус заказа (например, на "Paid") без оплаты |
| **Вектор атаки** | Прямой вызов PUT `/api/v1/orders/{id}/status` |
| **Вероятность** | Средняя |
| **Влияние** | Высокое — финансовые потери |
| **Риск** | **Высокий** |

**Реализованные меры:**
- ✅ Authorize(Roles = "Manager,Admin,Master") на эндпоинте UpdateStatus
- ✅ State Machine валидация переходов статусов
- ✅ Запись в историю изменений (OrderHistory)
- ✅ Логирование изменений

**Анализ кода (OrdersService.cs):**
```csharp
private static bool IsValidStatusTransition(OrderStatus from, OrderStatus to)
{
    return from switch
    {
        OrderStatus.New => to == OrderStatus.Processing || to == OrderStatus.Cancelled,
        OrderStatus.Processing => to == OrderStatus.Paid || to == OrderStatus.Cancelled,
        OrderStatus.Paid => to == OrderStatus.InProgress || to == OrderStatus.Cancelled,
        // ...
    };
}
```

**Предлагаемые меры:**
- 🔄 Двойное подтверждение для критических статусов (Paid → Shipped)
- 🔄 Webhook от платёжной системы для автоматического статуса "Paid"
- 🔄 Approval workflow для больших заказов

---

#### Угроза T-4: Модификация суммы заказа

| Атрибут | Значение |
|---------|----------|
| **Описание** | Клиент отправляет модифицированную цену товара при создании заказа |
| **Вектор атаки** | Изменение UnitPrice в теле запроса |
| **Вероятность** | Высокая |
| **Влияние** | Критическое — финансовые потери |
| **Риск** | **Критический** |

**Реализованные меры:**
- ⚠️ Валидация отрицательных цен и количеств (client-side trusted)
- ⚠️ Цены принимаются от клиента в CreateOrderRequest

**Уязвимость:**
```csharp
// OrdersService.cs - цена приходит от клиента!
var total = request.Items.Sum(i => i.Quantity * i.UnitPrice);
```

**Предлагаемые меры:**
- 🔴 **КРИТИЧНО:** Получать цены из CatalogService по ProductId
- 🔴 Валидация цен на сервере против каталога
- 🔴 Checksum/signature для позиций заказа

---

#### Угроза T-5: Mass Assignment

| Атрибут | Значение |
|---------|----------|
| **Описание** | Злоумышленник включает дополнительные поля в запрос |
| **Вектор атаки** | Добавление полей IsPaid=true, Total=0 в JSON |
| **Вероятность** | Средняя |
| **Влияние** | Высокое — обход бизнес-логики |
| **Риск** | **Средний** |

**Реализованные меры:**
- ✅ Использование DTO (CreateOrderRequest) вместо entity
- ✅ Явное маппинг полей

**Предлагаемые меры:**
- 🔄 [BindNever] атрибут для защищённых полей
- 🔄 Input validation с whitelist подходом

---

### 4.3 Repudiation (Отказ от авторства)

#### Угроза R-2: Отсутствие аудита заказов

| Атрибут | Значение |
|---------|----------|
| **Описание** | Пользователь отрицает создание заказа или изменение статуса |
| **Вектор атаки** | Юридические споры, мошенничество |
| **Вероятность** | Средняя |
| **Влияние** | Среднее — невозможность разрешения споров |
| **Риск** | **Средний** |

**Реализованные меры:**
- ✅ OrderHistory с полями: PreviousStatus, NewStatus, ChangedBy, ChangedAt, Comment
- ✅ История создаётся при каждом изменении статуса
- ✅ История создания заказа ("Заказ создан")
- ✅ ChangedBy записывает ID пользователя

**Анализ кода:**
```csharp
// OrdersService.cs - запись в историю
var history = new OrderHistory
{
    Id = Guid.NewGuid(),
    OrderId = order.Id,
    PreviousStatus = previousStatus,
    NewStatus = newStatus,
    Comment = comment,
    ChangedBy = changedBy,  // ID того, кто изменил
    ChangedAt = DateTime.UtcNow
};
```

**Предлагаемые меры:**
- 🔄 Неизменяемость таблицы OrderHistory (append-only)
- 🔄 Цифровая подпись записей истории
- 🔄 Синхронизация с внешним audit service

---

### 4.4 Information Disclosure (Утечка информации)

#### Угроза I-4: Утечка данных заказов (IDOR)

| Атрибут | Значение |
|---------|----------|
| **Описание** | Пользователь получает доступ к чужим заказам перебором ID |
| **Вектор атаки** | GET `/api/v1/orders/{id}` с чужим ID |
| **Вероятность** | Высокая |
| **Влияние** | Высокое — утечка PII и коммерческой информации |
| **Риск** | **Высокий** |

**Реализованные меры:**
- ✅ Проверка HasAccess() — сравнение order.UserId с currentUserId
- ✅ Доступ для Manager/Admin/Master
- ✅ Forbid() при отсутствии доступа

**Анализ кода:**
```csharp
// OrdersController.cs - проверка доступа
private bool HasAccess(Guid orderUserId)
{
    var currentUserId = GetCurrentUserId();
    var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
    
    return currentUserId == orderUserId || 
           roles.Contains("Manager") || 
           roles.Contains("Admin") ||
           roles.Contains("Master");
}
```

**Предлагаемые меры:**
- 🔄 Использование GUID вместо sequential ID для заказов
- 🔄 Логирование попыток доступа к чужим заказам

---

#### Угроза I-5: Утечка через перечисление заказов

| Атрибут | Значение |
|---------|----------|
| **Описание** | GET `/api/v1/orders` без фильтрации по пользователю |
| **Вектор атаки** | Вызов getAll без авторизации менеджера |
| **Вероятность** | Низкая |
| **Влияние** | Высокое — утечка всех заказов |
| **Риск** | **Низкий** |

**Реализованные меры:**
- ✅ `[Authorize(Roles = "Manager,Admin,Accountant")]` на GetAll
- ✅ `/my` endpoint для пользователя возвращает только свои заказы

---

### 4.5 Denial of Service (Отказ в обслуживании)

#### Угроза D-2: Исчерпание ресурсов БД

| Атрибут | Значение |
|---------|----------|
| **Описание** | Создание множества заказов для исчерпания ресурсов |
| **Вектор атаки** | Автоматизированное создание заказов |
| **Вероятность** | Средняя |
| **Влияние** | Среднее — деградация производительности |
| **Риск** | **Средний** |

**Реализованные меры:**
- ✅ Валидация количества позиций (MaxItemQuantity = 5)
- ⚠️ Нет ограничения на количество заказов

**Предлагаемые меры:**
- 🔄 Rate limiting на создание заказов
- 🔄 Ограничение активных заказов на пользователя
- 🔄 Fraud detection для аномальной активности

---

### 4.6 Elevation of Privilege (Повышение привилегий)

#### Угроза E-3: Отмена чужого заказа

| Атрибут | Значение |
|---------|----------|
| **Описание** | Пользователь отменяет чужой заказ |
| **Вектор атаки** | POST `/api/v1/orders/{id}/cancel` с чужим ID |
| **Вероятность** | Средняя |
| **Влияние** | Среднее — нарушение бизнес-процесса |
| **Риск** | **Низкий** |

**Реализованные меры:**
- ⚠️ CancelAsync проверяет только статус, но не владельца
- ⚠️ Нет проверки userId при отмене

**Уязвимость:**
```csharp
// OrdersService.cs - нет проверки владельца!
public async Task<(bool Success, string? Error)> CancelAsync(Guid id, Guid userId)
{
    var order = await _context.Orders.FindAsync(id);
    // ... нет проверки: if (order.UserId != userId) ...
}
```

**Предлагаемые меры:**
- 🔴 **ТРЕБУЕТСЯ:** Добавить проверку владельца заказа
- 🔄 Или использовать атрибут [Authorize] с политикой

---

#### Угроза E-4: Подмена userId при создании заказа

| Атрибут | Значение |
|---------|----------|
| **Описание** | Атакующий создаёт заказ от имени другого пользователя |
| **Вектор атаки** | Модификация userId в JWT или теле запроса |
| **Вероятность** | Низкая |
| **Влияние** | Высокое — заказ на чужое имя |
| **Риск** | **Низкий** |

**Реализованные меры:**
- ✅ userId берётся из JWT claims, а не из request body
- ✅ Ignore request.UserId если присутствует

**Анализ кода:**
```csharp
// OrdersController.cs - безопасное получение userId
var userId = GetCurrentUserId();
// ...
var (order, error) = await _ordersService.CreateAsync(userId.Value, request);
```

---

## 5. Матрица угроз

### 5.1 Сводная матрица STRIDE

| Угроза | Модуль | S | T | R | I | D | E | Риск | Статус |
|--------|--------|---|---|---|---|---|---|------|--------|
| S-1: Кража JWT Access Token | Auth | 🔴 | - | - | - | - | - | Высокий | Частично митигирован |
| S-2: Кража Refresh Token | Auth | 🔴 | - | - | - | - | - | Критический | Частично митигирован |
| S-3: Brute Force | Auth | 🔴 | - | - | - | - | - | Высокий | Митигирован |
| S-4: Использование чужого JWT | Orders | 🔴 | - | - | - | - | - | Высокий | Частично митигирован |
| T-1: Модификация JWT | Auth | - | 🔴 | - | - | - | - | Средний | Митигирован |
| T-2: SQL Injection | Auth | - | 🔴 | - | - | - | - | Низкий | Митигирован |
| T-3: Изменение статуса заказа | Orders | - | 🔴 | - | - | - | - | Высокий | Митигирован |
| T-4: Модификация цены | Orders | - | 🔴 | - | - | - | - | Критический | **Требует внимания** |
| T-5: Mass Assignment | Orders | - | ⚠️ | - | - | - | - | Средний | Митигирован |
| R-1: Отсутствие логов Auth | Auth | - | - | ⚠️ | - | - | - | Средний | Частично митигирован |
| R-2: Отсутствие аудита Orders | Orders | - | - | ⚠️ | - | - | - | Средний | Митигирован |
| I-1: Утечка PII | Auth | - | - | - | 🔴 | - | - | Высокий | Частично митигирован |
| I-2: Утечка через ошибки | Auth | - | - | - | ⚠️ | - | - | Средний | Митигирован |
| I-3: Раскрытие JWT Secret | Auth | - | - | - | 🔴 | - | - | Критический | Частично митигирован |
| I-4: IDOR в заказах | Orders | - | - | - | 🔴 | - | - | Высокий | Митигирован |
| I-5: Перечисление заказов | Orders | - | - | - | ⚠️ | - | - | Низкий | Митигирован |
| D-1: Флуд аутентификации | Auth | - | - | - | - | 🔴 | - | Высокий | Частично митигирован |
| D-2: Исчерпание ресурсов БД | Orders | - | - | - | - | ⚠️ | - | Средний | Частично митигирован |
| E-1: Подмена роли в JWT | Auth | - | - | - | - | - | 🔴 | Низкий | Митигирован |
| E-2: IDOR в AuthService | Auth | - | - | - | - | - | 🔴 | Низкий | Митигирован |
| E-3: Отмена чужого заказа | Orders | - | - | - | - | - | 🔴 | Средний | **Требует внимания** |
| E-4: Подмена userId | Orders | - | - | - | - | - | 🔴 | Низкий | Митигирован |

> 🔴 — Высокий риск, ⚠️ — Средний риск, 🟢 — Низкий риск

### 5.2 Приоритизация по риску

| Приоритет | Угроза | Риск | Действие |
|-----------|--------|------|----------|
| 1 | T-4: Модификация цены | Критический | Немедленное исправление |
| 2 | S-2: Кража Refresh Token | Критический | Усиление защиты |
| 3 | I-3: Раскрытие JWT Secret | Критический | Использование Vault |
| 4 | S-1, S-4: Кража JWT | Высокий | Token binding |
| 5 | T-3: Изменение статуса | Высокий | Webhook от платёжной системы |
| 6 | I-1, I-4: Утечка данных | Высокий | Шифрование PII |
| 7 | D-1: DDoS | Высокий | Rate limiting |
| 8 | E-3: Отмена чужого заказа | Средний | Проверка владельца |

---

## 6. Реализованные меры защиты

### 6.1 AuthService — Реализованные меры

| Категория | Мера | Реализация | Файл |
|-----------|------|------------|------|
| **Хэширование паролей** | BCrypt workFactor=12 | `BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12)` | AuthService.cs |
| **JWT подпись** | HMAC-SHA256 | `SecurityAlgorithms.HmacSha256` | JwtService.cs |
| **JWT валидация** | Full validation | Issuer, Audience, Lifetime, SigningKey | Program.cs |
| **Token lifetime** | Access: 15 min | `_accessTokenExpirationMinutes = 15` | JwtService.cs |
| **Refresh token** | 7 days, crypto-random | `RandomNumberGenerator.Create()` | JwtService.cs |
| **Account Lockout** | 5 attempts → 15 min lock | `MaxFailedAttempts = 5, LockoutMinutes = 15` | AuthService.cs |
| **Single-use refresh** | Token revocation on refresh | `RevokedAt`, `RevokedReason` | AuthService.cs |
| **Audit logging** | Serilog to file | `WriteTo.File()` | Program.cs |
| **Input validation** | DTOs | `RegisterRequest`, `LoginRequest` | Controllers |
| **EF Core** | Parameterized queries | LINQ to SQL | AuthService.cs |
| **HTTPS** | Redirect | `app.UseHttpsRedirection()` | Program.cs |

### 6.2 OrdersService — Реализованные меры

| Категория | Мера | Реализация | Файл |
|-----------|------|------------|------|
| **Authorization** | Role-based | `[Authorize(Roles = "Manager,Admin,Master")]` | OrdersController.cs |
| **IDOR protection** | Owner check | `HasAccess(order.UserId)` | OrdersController.cs |
| **Status FSM** | Valid transitions | `IsValidStatusTransition()` | OrdersService.cs |
| **Audit log** | OrderHistory | `PreviousStatus`, `NewStatus`, `ChangedBy` | OrdersService.cs |
| **Input validation** | Quantity limit | `MaxItemQuantity = 5` | OrdersService.cs |
| **Price validation** | Negative check | `if (item.UnitPrice < 0)` | OrdersService.cs |
| **User context** | JWT claims | `GetCurrentUserId()` from JWT | OrdersController.cs |

---

## 7. Предлагаемые меры защиты

### 7.1 Критические (Immediate Priority)

#### P1: Защита от модификации цены (T-4)

**Проблема:** Цены товаров приходят от клиента и не валидируются на сервере.

**Решение:**
```csharp
// Рекомендуемая реализация
public async Task<(OrderDto? Order, string? Error)> CreateAsync(Guid userId, CreateOrderRequest request)
{
    // Получить актуальные цены из CatalogService
    var productPrices = await _catalogService.GetPricesAsync(request.Items.Select(i => i.ProductId));
    
    foreach (var item in request.Items)
    {
        var actualPrice = productPrices[item.ProductId];
        if (item.UnitPrice != actualPrice)
        {
            _logger.LogWarning("Price mismatch for product {ProductId}: client={ClientPrice}, actual={ActualPrice}",
                item.ProductId, item.UnitPrice, actualPrice);
            item.UnitPrice = actualPrice; // Использовать актуальную цену
        }
    }
    // ...
}
```

#### P2: Проверка владельца при отмене заказа (E-3)

**Проблема:** Метод CancelAsync не проверяет, что заказ принадлежит пользователю.

**Решение:**
```csharp
// OrdersService.cs
public async Task<(bool Success, string? Error)> CancelAsync(Guid id, Guid userId)
{
    var order = await _context.Orders.FindAsync(id);
    
    if (order == null)
    {
        return (false, "Заказ не найден");
    }
    
    // Добавить проверку владельца
    if (order.UserId != userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user?.Role != UserRole.Manager && user?.Role != UserRole.Admin)
        {
            _logger.LogWarning("Unauthorized cancel attempt: User {UserId} tried to cancel Order {OrderId}",
                userId, id);
            return (false, "У вас нет прав на отмену этого заказа");
        }
    }
    // ...
}
```

### 7.2 Высокие (High Priority)

#### P3: Rate Limiting

**Реализация через AspNetCoreRateLimit:**
```csharp
// Program.cs
builder.Services.AddMemoryCache();
builder.Services.AddInMemoryRateLimiting();
builder.Services.Configure<IpRateLimitOptions>(options =>
{
    options.GeneralRules = new List<RateLimitRule>
    {
        new RateLimitRule
        {
            Endpoint = "POST:/api/v1/auth/login",
            Limit = 5,
            Period = "1m"
        },
        new RateLimitRule
        {
            Endpoint = "*",
            Limit = 100,
            Period = "1m"
        }
    };
});
```

#### P4: JWT Secret в Vault

**Рекомендация:** Использовать HashiCorp Vault или Azure Key Vault для хранения секретов.

```csharp
// Вместо конфигурации
var secretKey = await _vaultClient.GetSecretAsync("jwt/secret-key");
```

#### P5: Token Binding

**Привязка токена к устройству:**
```csharp
// JwtService.cs
var claims = new[]
{
    // ... existing claims
    new Claim("device_fingerprint", deviceFingerprint)
};

// При валидации
var tokenFingerprint = jwtToken.Claims.FirstOrDefault(c => c.Type == "device_fingerprint")?.Value;
if (tokenFingerprint != requestDeviceFingerprint)
{
    return Unauthorized();
}
```

### 7.3 Средние (Medium Priority)

#### P6: Content Security Policy

```csharp
// Program.cs
app.Use(async (context, next) =>
{
    context.Response.Headers.Add("Content-Security-Policy", 
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'");
    context.Response.Headers.Add("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Add("X-Frame-Options", "DENY");
    context.Response.Headers.Add("X-XSS-Protection", "1; mode=block");
    await next();
});
```

#### P7: Audit Log Improvement

```csharp
// Structured logging with Serilog
Log.Information("Security event: {EventType}, User: {UserId}, IP: {IpAddress}, Details: {Details}",
    "LoginSuccess", userId, ipAddress, new { email, role });
```

#### P8: Order Limit per User

```csharp
// OrdersService.cs
public async Task<(OrderDto? Order, string? Error)> CreateAsync(Guid userId, CreateOrderRequest request)
{
    var activeOrders = await _context.Orders
        .CountAsync(o => o.UserId == userId && 
                        o.Status != OrderStatus.Completed && 
                        o.Status != OrderStatus.Cancelled);
    
    if (activeOrders >= 10)
    {
        return (null, "Превышено максимальное количество активных заказов");
    }
    // ...
}
```

---

## 8. Рекомендации по безопасности

### 8.1 Общие рекомендации

| Категория | Рекомендация | Приоритет |
|-----------|--------------|-----------|
| **Secrets Management** | Мигрировать на HashiCorp Vault/Azure Key Vault | Высокий |
| **Monitoring** | Настроить SIEM для security events | Высокий |
| **WAF** | Внедрить Web Application Firewall | Средний |
| **DDoS Protection** | Использовать Cloudflare или аналог | Средний |
| **Penetration Testing** | Ежеквартальный тест на проникновение | Средний |
| **Security Training** | Обучение разработчиков OWASP Top 10 | Средний |
| **Dependency Scanning** | Snyk/Dependabot для зависимостей | Высокий |
| **SAST** | SonarQube/Semgrep в CI/CD | Высокий |

### 8.2 Checklist для разработчиков

- [ ] Все endpoints имеют `[Authorize]` атрибут
- [ ] Input validation на всех DTO
- [ ] Нет хардкод секретов
- [ ] Parameterized queries (EF Core)
- [ ] Audit logging для критических операций
- [ ] Проверка владельца ресурса (IDOR)
- [ ] Role-based authorization для admin endpoints
- [ ] Error messages не раскрывают внутреннюю структуру

### 8.3 Incident Response Plan

1. **Обнаружение** — SIEM alert / User report
2. **Содержание** — Отозвать скомпрометированные токены
3. **Анализ** — Audit logs analysis
4. **Устранение** — Патч уязвимости
5. **Восстановление** — Возврат к нормальной работе
6. **Пост-мортем** — Документация и уроки

---

## Заключение

Настоящий threat model документ идентифицировал **22 угрозы** для AuthService и OrdersService:

- **3 критических** (требуют немедленного внимания)
- **8 высоких** (требуют планового митигирования)
- **8 средних** (рекомендуется митигирование)
- **3 низких** (приемлемый риск)

**Ключевые выводы:**

1. **Модификация цен (T-4)** — наиболее критическая уязвимость, требует интеграции с CatalogService для валидации цен на сервере.

2. **Защита JWT токенов** — реализована базовая защита, рекомендуется усиление через token binding и короткий срок жизни.

3. **Аудит и логирование** — частично реализовано, рекомендуется централизация и защита логов.

4. **IDOR защита** — реализована в OrdersService, требует исправления в методе CancelAsync.

---

**Документ подготовлен:** Security Analyst  
**Дата:** 15.03.2026  
**Версия:** 1.0

---

*Документ является частью проекта GoldPC и должен пересматриваться при существенных изменениях в архитектуре.*