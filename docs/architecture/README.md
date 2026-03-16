# Архитектура системы GoldPC

## 📋 Обзор

**GoldPC** — веб-приложение для компьютерного магазина с сервисным центром. Система построена на микросервисной архитектуре с использованием ASP.NET Core 8 на бэкенде и React 18 на фронтенде.

### Технологический стек

| Слой | Технологии |
|------|------------|
| **Frontend** | React 18, TypeScript 5, Vite 8, Redux Toolkit, Material-UI |
| **Backend** | ASP.NET Core 8, Entity Framework Core 8, C# 12 |
| **Database** | PostgreSQL 16, Redis 7 |
| **Auth** | JWT Bearer (access + refresh tokens) |
| **Infrastructure** | Docker, Nginx, Hangfire |

---

## 🗺️ C4 Model: Context Diagram (Level 1)

Диаграмма контекста показывает систему в окружении внешних сущностей и пользователей.

```mermaid
graph TB
    subgraph "Внешние пользователи"
        Client[👤 Клиент<br/>Веб-браузер]
        Manager[👔 Менеджер<br/>Веб-браузер]
        Master[🔧 Мастер<br/>Веб-браузер]
        Admin[⚙️ Администратор<br/>Веб-браузер]
        Accountant[📊 Бухгалтер<br/>Веб-браузер]
    end
    
    subgraph "Система GoldPC"
        System[🖥️ GoldPC System<br/><br/>Веб-приложение для компьютерного<br/>магазина с сервисным центром<br/><br/>Функции:<br/>• Каталог товаров<br/>• Конструктор ПК<br/>• Заказы и оплата<br/>• Сервисный центр<br/>• Гарантийное обслуживание]
    end
    
    subgraph "Внешние системы"
        Payment[💳 Платёжная система<br/>ЮKassa]
        SMS[📱 SMS-шлюз<br/>SMS.ru]
        Email[📧 Email-сервер<br/>SMTP]
        Backup[💾 Резервное копирование<br/>S3/NAS]
    end
    
    Client -->|HTTPS/JSON<br/>Просмотр каталога<br/>Оформление заказов| System
    Manager -->|HTTPS/JSON<br/>Управление заказами<br/>Управление каталогом| System
    Master -->|HTTPS/JSON<br/>Управление заявками<br/>Ремонт техники| System
    Admin -->|HTTPS/JSON<br/>Управление пользователями<br/>Мониторинг системы| System
    Accountant -->|HTTPS/JSON<br/>Финансовые отчёты| System
    
    System -->|HTTPS/REST API<br/>Оплата заказов| Payment
    System -->|HTTPS/REST API<br/>SMS-уведомления| SMS
    System -->|SMTP<br/>Email-уведомления| Email
    System -->|HTTPS/S3 API<br/>Резервные копии| Backup
    
    System -->[(🗄️ PostgreSQL<br/>База данных)]
    System -->[(⚡ Redis<br/>Кэш)]
```

### Пользователи системы

| Роль | Описание | Основные функции |
|------|----------|------------------|
| **Клиент** | Неавторизованный/авторизованный пользователь | Просмотр каталога, конструктор ПК, оформление заказов, отслеживание гарантий |
| **Менеджер** | Сотрудник магазина | Обработка заказов, управление каталогом, общение с клиентами |
| **Мастер** | Технический специалист | Выполнение ремонтных работ, обновление статусов заявок |
| **Администратор** | Системный администратор | Управление пользователями, справочниками, мониторинг |
| **Бухгалтер** | Финансовый сотрудник | Формирование финансовых отчётов |

---

## 📦 C4 Model: Container Diagram (Level 2)

Диаграмма контейнеров показывает высокоуровневую архитектуру системы и взаимодействие между контейнерами.

```mermaid
graph TB
    subgraph "Клиенты"
        Browser[🌐 Веб-браузер<br/>Chrome, Firefox, Safari, Edge]
    end
    
    subgraph "Frontend Container"
        ReactApp[⚛️ React Application<br/><br/>Технологии:<br/>• React 18<br/>• TypeScript 5<br/>• Material-UI<br/>• Tailwind CSS<br/>• Redux Toolkit<br/><br/>Функции:<br/>• SPA интерфейс<br/>• Состояние приложения<br/>• API клиент]
    end
    
    subgraph "Backend Containers"
        subgraph "API Services"
            CatalogAPI[📦 CatalogService<br/><br/>ASP.NET Core 8<br/>REST API<br/><br/>• Управление товарами<br/>• Категории<br/>• Поиск]
            
            OrdersAPI[🛒 OrdersService<br/><br/>ASP.NET Core 8<br/>REST API<br/><br/>• Заказы<br/>• Корзина<br/>• Оплата]
            
            AuthAPI[🔐 AuthService<br/><br/>ASP.NET Core 8<br/>REST API<br/><br/>• Аутентификация<br/>• Авторизация<br/>• JWT токены]
            
            PCBuilderAPI[🖥️ PCBuilderService<br/><br/>ASP.NET Core 8<br/>REST API<br/><br/>• Конструктор ПК<br/>• Проверка совместимости<br/>• Рекомендации]
            
            ServicesAPI[🔧 ServicesService<br/><br/>ASP.NET Core 8<br/>REST API<br/><br/>• Сервисные заявки<br/>• Статусы ремонта<br/>• Мастера]
            
            WarrantyAPI[📋 WarrantyService<br/><br/>ASP.NET Core 8<br/>REST API<br/><br/>• Гарантийные талоны<br/>• История обращений]
        end
        
        subgraph "Background Services"
            BackgroundServices[⚙️ Background Services<br/><br/>Hangfire<br/><br/>• Отправка Email<br/>• Отправка SMS<br/>• Очистка данных<br/>• Отчёты]
        end
    end
    
    subgraph "Data Containers"
        PostgreSQL[(🗄️ PostgreSQL 16<br/><br/>Основная БД<br/><br/>• Пользователи<br/>• Товары<br/>• Заказы<br/>• Заявки<br/>• Гарантии)]
        
        Redis[(⚡ Redis 7<br/><br/>Кэш и сессии<br/><br/>• Кэш каталога<br/>• Сессии пользователей<br/>• Refresh токены<br/>• Rate limiting)]
    end
    
    subgraph "External Systems"
        Payment[💳 ЮKassa API<br/>Платёжная система]
        SMS[📱 SMS.ru API<br/>SMS-шлюз]
        Email[📧 SMTP Server<br/>Email-сервер]
    end
    
    %% Client connections
    Browser -->|HTTPS| ReactApp
    
    %% Frontend to Backend
    ReactApp -->|HTTPS/JSON<br/>REST API| CatalogAPI
    ReactApp -->|HTTPS/JSON<br/>REST API| OrdersAPI
    ReactApp -->|HTTPS/JSON<br/>REST API| AuthAPI
    ReactApp -->|HTTPS/JSON<br/>REST API| PCBuilderAPI
    ReactApp -->|HTTPS/JSON<br/>REST API| ServicesAPI
    ReactApp -->|HTTPS/JSON<br/>REST API| WarrantyAPI
    
    %% Backend internal connections
    OrdersAPI -.->|HTTP/JSON| CatalogAPI
    OrdersAPI -.->|HTTP/JSON| WarrantyAPI
    PCBuilderAPI -.->|HTTP/JSON| CatalogAPI
    ServicesAPI -.->|HTTP/JSON| WarrantyAPI
    
    %% Backend to Database
    CatalogAPI -->|TCP/SQL<br/>Entity Framework Core| PostgreSQL
    OrdersAPI -->|TCP/SQL<br/>Entity Framework Core| PostgreSQL
    AuthAPI -->|TCP/SQL<br/>Entity Framework Core| PostgreSQL
    PCBuilderAPI -->|TCP/SQL<br/>Entity Framework Core| PostgreSQL
    ServicesAPI -->|TCP/SQL<br/>Entity Framework Core| PostgreSQL
    WarrantyAPI -->|TCP/SQL<br/>Entity Framework Core| PostgreSQL
    
    %% Backend to Redis
    CatalogAPI -->|TCP<br/>StackExchange.Redis| Redis
    AuthAPI -->|TCP<br/>StackExchange.Redis| Redis
    OrdersAPI -->|TCP<br/>StackExchange.Redis| Redis
    
    %% Background Services
    BackgroundServices -->|TCP/SQL| PostgreSQL
    BackgroundServices -->|HTTPS/API| SMS
    BackgroundServices -->|SMTP| Email
    
    %% External API connections
    OrdersAPI -->|HTTPS/REST API<br/>Оплата заказов| Payment
```

---

## 🔧 Микросервисы

### CatalogService

**Назначение:** Управление каталогом товаров, категориями и производителями.

| Аспект | Детали |
|--------|--------|
| **Порт** | 5001 |
| **Технологии** | ASP.NET Core 8, EF Core 8, PostgreSQL |
| **Ответственность** | CRUD товаров, категории, производители, поиск, инвентарь |

**Основные функции:**
- 📦 Управление товарами (CRUD операции)
- 📁 Иерархия категорий (дерево категорий)
- 🏭 Управление производителями
- 🔍 Полнотекстовый поиск по каталогу
- 📊 Управление остатками на складе
- ⭐ Отзывы и рейтинги товаров

**API Endpoints:**
```
GET    /api/v1/products           # Список товаров с пагинацией
GET    /api/v1/products/{id}      # Детали товара
POST   /api/v1/products           # Создание товара (Manager+)
PUT    /api/v1/products/{id}      # Обновление товара (Manager+)
DELETE /api/v1/products/{id}      # Удаление товара (Manager+)
GET    /api/v1/products/search    # Поиск по каталогу
GET    /api/v1/categories         # Дерево категорий
GET    /api/v1/manufacturers      # Список производителей
```

---

### OrdersService

**Назначение:** Управление заказами, корзиной и оплатой.

| Аспект | Детали |
|--------|--------|
| **Порт** | 5002 |
| **Технологии** | ASP.NET Core 8, EF Core 8, PostgreSQL, Redis |
| **Ответственность** | Заказы, корзина, оплата, история заказов |

**Основные функции:**
- 🛒 Корзина покупок (анонимная + авторизованная)
- 📦 Создание и отслеживание заказов
- 💳 Интеграция с платёжной системой (ЮKassa)
- 📊 История заказов пользователя
- 🔄 Смена статусов заказа
- 📧 Уведомления о статусе заказа

**Статусы заказа:**
```
New → Processing → Paid → Ready → Completed
                  ↓
               Cancelled
```

**API Endpoints:**
```
GET    /api/v1/orders             # Список заказов пользователя
GET    /api/v1/orders/{id}        # Детали заказа
POST   /api/v1/orders             # Создание заказа
PUT    /api/v1/orders/{id}/status # Изменение статуса (Manager+)
GET    /api/v1/cart               # Текущая корзина
POST   /api/v1/cart/items         # Добавление в корзину
DELETE /api/v1/cart/items/{id}    # Удаление из корзины
POST   /api/v1/checkout           # Оформление заказа
```

---

### AuthService

**Назначение:** Аутентификация и авторизация пользователей.

| Аспект | Детали |
|--------|--------|
| **Порт** | 5003 |
| **Технологии** | ASP.NET Core 8, EF Core 8, PostgreSQL, Redis, JWT |
| **Ответственность** | Регистрация, вход, JWT токены, управление пользователями |

**Основные функции:**
- 🔐 Регистрация новых пользователей
- 🚪 Аутентификация (email + пароль)
- 🎫 Генерация и валидация JWT токенов
- 🔄 Refresh токены (7 дней)
- 👥 Управление ролями пользователей
- 🔒 Хеширование паролей (bcrypt)

**Роли пользователей:**
| Роль | Права доступа |
|------|---------------|
| `Client` | Просмотр каталога, оформление заказов |
| `Manager` | Управление заказами и каталогом |
| `Master` | Сервисные заявки и ремонт |
| `Admin` | Полный доступ к системе |
| `Accountant` | Финансовые отчёты |

**API Endpoints:**
```
POST   /api/v1/auth/register      # Регистрация
POST   /api/v1/auth/login         # Вход
POST   /api/v1/auth/refresh       # Обновление токена
POST   /api/v1/auth/logout        # Выход
GET    /api/v1/users/me           # Профиль пользователя
PUT    /api/v1/users/me           # Обновление профиля
GET    /api/v1/users              # Список пользователей (Admin+)
```

---

### PCBuilderService

**Назначение:** Конструктор ПК с проверкой совместимости компонентов.

| Аспект | Детали |
|--------|--------|
| **Порт** | 5004 |
| **Технологии** | ASP.NET Core 8, EF Core 8, PostgreSQL |
| **Ответственность** | Конфигурации ПК, совместимость, рекомендации |

**Основные функции:**
- 🖥️ Создание конфигураций ПК
- ✅ Проверка совместимости компонентов
- 💡 Рекомендации по комплектующим
- 💰 Расчёт стоимости сборки
- 📋 Сохранение конфигураций

**API Endpoints:**
```
POST   /api/v1/builder/validate   # Проверка совместимости
POST   /api/v1/builder/calculate  # Расчёт стоимости
GET    /api/v1/builder/recommend  # Рекомендации компонентов
POST   /api/v1/configurations     # Сохранить конфигурацию
GET    /api/v1/configurations     # Список конфигураций пользователя
```

---

### ServicesService

**Назначение:** Управление сервисным центром и заявками на ремонт.

| Аспект | Детали |
|--------|--------|
| **Порт** | 5005 |
| **Технологии** | ASP.NET Core 8, EF Core 8, PostgreSQL |
| **Ответственность** | Сервисные заявки, статусы ремонта, мастера |

**Основные функции:**
- 🔧 Создание сервисных заявок
- 📊 Отслеживание статуса ремонта
- 👨‍🔧 Назначение мастеров
- 💰 Расчёт стоимости работ
- 📝 История обслуживания

**Статусы заявки:**
```
New → InProgress → WaitingForParts → Completed → Closed
                       ↓
                    Cancelled
```

**API Endpoints:**
```
GET    /api/v1/services           # Список услуг
GET    /api/v1/requests           # Список заявок
POST   /api/v1/requests           # Создание заявки
GET    /api/v1/requests/{id}      # Детали заявки
PUT    /api/v1/requests/{id}/status # Изменение статуса
PUT    /api/v1/requests/{id}/assign # Назначение мастера
```

---

### WarrantyService

**Назначение:** Управление гарантийными талонами.

| Аспект | Детали |
|--------|--------|
| **Порт** | 5006 |
| **Технологии** | ASP.NET Core 8, EF Core 8, PostgreSQL |
| **Ответственность** | Гарантийные талоны, история обращений |

**Основные функции:**
- 📋 Создание гарантийных талонов
- 🔍 Проверка гарантии по номеру
- 📅 Отслеживание срока действия
- ❌ Аннулирование гарантии
- 📊 История гарантийных обращений

**API Endpoints:**
```
GET    /api/v1/warranties         # Список гарантий пользователя
GET    /api/v1/warranties/{id}    # Детали гарантии
GET    /api/v1/warranties/check/{number} # Проверка по номеру
POST   /api/v1/warranties         # Создание гарантии
PUT    /api/v1/warranties/{id}/annul # Аннулирование
```

---

## 📐 Architecture Decision Records (ADR)

Ключевые архитектурные решения документированы в формате ADR:

| ADR | Название | Статус | Описание |
|-----|----------|--------|----------|
| [ADR-0001](../../contracts/adr/0001-choice-of-api-format.md) | Выбор REST/OpenAPI | ✅ Принято | REST/OpenAPI 3.0 как основной формат API |
| [ADR-0002](../../contracts/adr/0002-database-choice.md) | Выбор PostgreSQL | ✅ Принято | PostgreSQL 16 как основная СУБД |
| [ADR-0003](../../contracts/adr/0003-frontend-framework.md) | Выбор React/Vite | ✅ Принято | React 19 + Vite 8 + TypeScript для frontend |
| [ADR-0004](../../contracts/adr/0004-authentication-jwt.md) | Аутентификация JWT | ✅ Принято | JWT с refresh токенами |
| [ADR-001](../../contracts/adr/ADR-001-api-contracts.md) | Стратегия API-контрактов | ✅ Принято | Contract-First Development с OpenAPI, Pact, AsyncAPI |

### Краткое содержание ключевых решений

#### ADR-0001: REST/OpenAPI
- **Решение:** Использовать REST/OpenAPI 3.0 для синхронного API
- **Обоснование:** HTTP-кэширование, широкая поддержка в .NET, Swagger UI
- **Альтернативы:** GraphQL, gRPC — отклонены как избыточные для одного клиента

#### ADR-0002: PostgreSQL
- **Решение:** PostgreSQL 16 как основная СУБД
- **Обоснование:** JSONB для спецификаций товаров, полнотекстовый поиск, ACID, бесплатная лицензия
- **Альтернативы:** SQL Server (лицензия), MySQL (меньше возможностей), MongoDB (нет ACID)

#### ADR-0003: React/Vite
- **Решение:** React 19 + Vite 8 + TypeScript
- **Обоснование:** Компонентный подход, быстрая сборка Vite, типобезопасность
- **Альтернативы:** Vue, Angular, Svelte — отклонены из-за отсутствия опыта команды

#### ADR-0004: JWT Authentication
- **Решение:** JWT с refresh токенами (access: 15 мин, refresh: 7 дней)
- **Обоснование:** Stateless, стандарт, интеграция с ASP.NET Core, RBAC через claims
- **Альтернативы:** Session-based (не масштабируется), OAuth/OIDC (избыточно)

---

## 📁 Структура проекта

```
kursovaya/
├── contracts/                 # API контракты
│   ├── openapi/v1/           # OpenAPI спецификации
│   ├── asyncapi/v1/          # AsyncAPI спецификации
│   ├── pacts/                # Pact контракты
│   └── adr/                  # Architecture Decision Records
├── src/                      # Исходный код
│   ├── frontend/             # React приложение
│   ├── CatalogService/       # Сервис каталога
│   ├── OrdersService/        # Сервис заказов
│   ├── AuthService/          # Сервис аутентификации
│   ├── PCBuilderService/     # Сервис конструктора ПК
│   ├── ServicesService/      # Сервисный центр
│   ├── WarrantyService/      # Гарантийное обслуживание
│   └── SharedKernel/         # Общие компоненты
├── tests/                    # Тесты
│   ├── ArchitectureTests/    # Архитектурные тесты
│   └── */.Tests/             # Unit тесты сервисов
├── docker/                   # Docker конфигурации
├── docs/                     # Документация
│   ├── architecture/         # Архитектурные диаграммы
│   └── security/             # Документация безопасности
└── infrastructure/           # Инфраструктура (monitoring, k8s)
```

---

## 🔗 Связанные документы

- [ER Диаграмма](./er-diagram.mmd) — схема базы данных
- [C4 Component Diagram](./c4/component-diagram.mmd) — детальная структура CatalogService
- [Threat Model](../security/threat-model.md) — модель угроз STRIDE
- [API Documentation](../API-Documentation.md) — документация API

---

*Документ обновлён: 16.03.2026*
