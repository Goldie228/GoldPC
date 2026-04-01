# PC Builder - Архитектура

## Обзор Системы

```mermaid
graph TB
    subgraph Frontend ["Frontend (React)"]
        PCBuilderPage["PCBuilderPage"]
        ComponentSlot["ComponentSlot"]
        BuildSummaryPanel["BuildSummaryPanel"]
        usePCBuilder["usePCBuilder Hook"]
        
        PCBuilderPage --> ComponentSlot
        PCBuilderPage --> BuildSummaryPanel
        PCBuilderPage --> usePCBuilder
    end
    
    subgraph Backend ["Backend (.NET 8)"]
        PCBuilderController["PCBuilderController"]
        CompatibilityService["CompatibilityService"]
        ConfigurationService["ConfigurationService"]
        
        PCBuilderController --> CompatibilityService
        PCBuilderController --> ConfigurationService
    end
    
    subgraph Database ["PostgreSQL"]
        PCConfigurations["PCConfigurations Table"]
        Products["Products Table (Catalog)"]
        
        ConfigurationService --> PCConfigurations
        CompatibilityService --> Products
    end
    
    subgraph Cache ["Redis"]
        CompatibleComponents["Compatible Components Cache"]
        
        CompatibilityService --> CompatibleComponents
    end
    
    Frontend --> Backend
    Backend --> Database
    Backend --> Cache
```

## Поток Данных - Выбор Компонента

```mermaid
sequenceDiagram
    actor User
    participant UI as PCBuilderPage
    participant Hook as usePCBuilder
    participant API as Backend API
    participant DB as Database
    participant Cache as Redis Cache
    
    User->>UI: Клик "Выбрать CPU"
    UI->>UI: Показать правую панель выбора
    
    UI->>API: GET /api/v1/catalog/products?category=cpu
    API->>Cache: Проверить кэш
    
    alt Кэш есть
        Cache-->>API: Возврат данных
    else Кэша нет
        API->>DB: SELECT * FROM Products WHERE Category='cpu'
        DB-->>API: Список CPU
        API->>Cache: Сохранить в кэш
    end
    
    API-->>UI: Список CPU
    UI->>Hook: Фильтровать совместимые (на клиенте)
    Hook-->>UI: Только совместимые CPU
    UI->>User: Показать список
    
    User->>UI: Выбрать AMD Ryzen 7 7800X3D
    UI->>Hook: selectComponent('cpu', product)
    Hook->>Hook: Обновить selectedComponents
    Hook->>Hook: Пересчитать совместимость
    Hook->>Hook: Пересчитать цену
    Hook-->>UI: Обновлённое состояние
    
    UI->>User: Показать слот с выбранным CPU
    UI->>User: Обновить правую панель (цена, мощность)
```

## Поток Проверки Совместимости

```mermaid
flowchart TD
    Start([Пользователь выбрал компонент]) --> UpdateState[Обновить selectedComponents]
    UpdateState --> CheckLocal{Локальная проверка}
    
    CheckLocal -->|Быстрые правила| CheckSocket[Проверка сокета CPU-MB]
    CheckSocket --> CheckRAM[Проверка RAM-MB]
    CheckRAM --> CheckPower[Проверка мощности PSU]
    CheckPower --> CheckCooling[Проверка охлаждения]
    CheckCooling --> CheckCase[Проверка размеров]
    CheckCase --> CheckBottleneck[Детект bottleneck]
    
    CheckBottleneck --> LocalResult{Есть ошибки?}
    
    LocalResult -->|Да| ShowErrors[Показать инлайн ошибки]
    LocalResult -->|Нет| ShowOK[Показать ✓ Совместимо]
    
    ShowErrors --> DisableCart[Кнопка "В корзину" disabled]
    ShowOK --> EnableCart[Кнопка "В корзину" active]
    
    DisableCart --> End([Обновить UI])
    EnableCart --> End
```

## Поток Сохранения Конфигурации

```mermaid
sequenceDiagram
    actor User
    participant UI as PCBuilderPage
    participant Hook as usePCBuilder
    participant API as Backend API
    participant Auth as AuthService
    participant DB as PostgreSQL
    
    User->>UI: Клик "Сохранить"
    UI->>Auth: Проверить авторизацию
    
    alt Не авторизован
        Auth-->>UI: 401 Unauthorized
        UI->>User: Показать форму логина
    else Авторизован
        Auth-->>UI: Token валиден
        UI->>User: Показать модалку "Сохранить"
        
        User->>UI: Ввести название "Игровой ПК 2026"
        User->>UI: Клик "Сохранить"
        
        UI->>Hook: Получить текущую конфигурацию
        Hook-->>UI: selectedComponents
        
        UI->>API: POST /api/v1/pcbuilder/configurations
        Note over UI,API: Body: {name, components, purpose}
        
        API->>API: Валидация запроса
        API->>API: CheckCompatibility (ещё раз)
        
        API->>DB: INSERT INTO PCConfigurations
        DB-->>API: Saved config (id)
        
        API-->>UI: 201 Created + config id
        UI->>User: ✅ Конфигурация сохранена
        
        UI->>UI: Закрыть модалку
    end
```

## Структура Компонентов

```mermaid
graph TD
    subgraph PCBuilderPage
        Toolbar[Toolbar: Breadcrumbs + Back button]
        
        subgraph LeftPanel [Left Panel 60%]
            StatusIndicator[Status Indicator: Совместимо / Есть проблемы]
            SlotList[ComponentSlot List]
            Slot1[CPU Slot - Priority]
            Slot2[GPU Slot - Priority]
            Slot3[Motherboard Slot]
            Slot4[RAM Slot]
            Slot5[Storage Slot]
            Slot6[PSU Slot]
            Slot7[Case Slot]
            Slot8[Cooling Slot]
            
            SlotList --> Slot1
            SlotList --> Slot2
            SlotList --> Slot3
            SlotList --> Slot4
            SlotList --> Slot5
            SlotList --> Slot6
            SlotList --> Slot7
            SlotList --> Slot8
        end
        
        subgraph RightPanel [Right Panel 40%]
            ComponentList[Selected Components List]
            MiniPreviews[Mini Previews - CPU & GPU]
            PowerGraph[Power Consumption Graph]
            PerformanceScores[Performance Scores]
            TotalPrice[Total Price]
            AddToCartBtn[Add to Cart Button]
            SaveBtn[Save Config Button]
            ShareBtn[Share Link Button]
            
            ComponentList --> MiniPreviews
            MiniPreviews --> PowerGraph
            PowerGraph --> PerformanceScores
            PerformanceScores --> TotalPrice
            TotalPrice --> AddToCartBtn
            AddToCartBtn --> SaveBtn
            SaveBtn --> ShareBtn
        end
        
        Toolbar --> LeftPanel
        Toolbar --> RightPanel
    end
    
    style Slot1 fill:#d4a574
    style Slot2 fill:#d4a574
    style AddToCartBtn fill:#d4a574
```

## База Данных

```mermaid
erDiagram
    PCConfigurations {
        uuid Id PK
        uuid UserId FK
        nvarchar Name
        nvarchar Purpose
        uuid ProcessorId FK
        uuid MotherboardId FK
        uuid RamId FK
        uuid GpuId FK
        uuid PsuId FK
        uuid StorageId FK
        uuid CaseId FK
        uuid CoolerId FK
        decimal TotalPrice
        int TotalPower
        bit IsCompatible
        nvarchar ShareToken UK
        datetime2 CreatedAt
        datetime2 UpdatedAt
    }
    
    Products {
        uuid Id PK
        nvarchar Name
        nvarchar Category
        decimal Price
        bit InStock
        jsonb Specifications
    }
    
    Users {
        uuid Id PK
        nvarchar Email
        nvarchar PasswordHash
    }
    
    PCConfigurations ||--o{ Products : "references"
    PCConfigurations }o--|| Users : "belongs to"
```

## API Endpoints

```mermaid
graph LR
    subgraph "PC Builder API"
        CheckCompat[POST /check-compatibility]
        SaveConfig[POST /configurations]
        GetConfigs[GET /configurations]
        GetConfig[GET /configurations/:id]
        ShareConfig[POST /configurations/:id/share]
        GetShared[GET /share/:token]
        
        CheckCompat --> CompatService[CompatibilityService]
        SaveConfig --> ConfigService[ConfigurationService]
        GetConfigs --> ConfigService
        GetConfig --> ConfigService
        ShareConfig --> ConfigService
        GetShared --> ConfigService
    end
    
    subgraph Services
        CompatService --> CheckRules[Check Rules]
        CompatService --> CalcPower[Calculate Power]
        CompatService --> DetectBottle[Detect Bottleneck]
        
        ConfigService --> SaveToDB[(PostgreSQL)]
        ConfigService --> LoadFromDB[(PostgreSQL)]
        ConfigService --> GenToken[Generate Share Token]
    end
```

## Тестовая Архитектура

```mermaid
graph TB
    subgraph "Test Layers"
        UnitTests[Unit Tests]
        IntegrationTests[Integration Tests]
        E2ETests[E2E Tests - Playwright]
        
        subgraph "Unit Test Coverage"
            HookTests[usePCBuilder Hook]
            ServiceTests[CompatibilityService]
            UtilTests[Utils - performanceCalculator]
        end
        
        subgraph "Integration Test Coverage"
            APITests[API Endpoints]
            DBTests[Database Operations]
        end
        
        subgraph "E2E Test Coverage"
            CompatScenarios[Compatibility Scenarios]
            CartFlow[Add to Cart Flow]
            SaveFlow[Save Config Flow]
            EdgeCases[Edge Cases]
        end
        
        UnitTests --> HookTests
        UnitTests --> ServiceTests
        UnitTests --> UtilTests
        
        IntegrationTests --> APITests
        IntegrationTests --> DBTests
        
        E2ETests --> CompatScenarios
        E2ETests --> CartFlow
        E2ETests --> SaveFlow
        E2ETests --> EdgeCases
    end
    
    subgraph "Test Reports"
        MarkdownReport[Markdown Report]
        Screenshots[Screenshots]
        Logs[Test Logs]
        
        E2ETests --> MarkdownReport
        E2ETests --> Screenshots
        E2ETests --> Logs
    end
```

## Кэширование

```mermaid
flowchart LR
    Request[API Request] --> CheckCache{Redis Cache?}
    
    CheckCache -->|Hit| ReturnCached[Return from Cache]
    CheckCache -->|Miss| QueryDB[Query PostgreSQL]
    
    QueryDB --> SaveCache[Save to Redis]
    SaveCache --> ReturnFresh[Return Fresh Data]
    
    ReturnCached --> Response[API Response]
    ReturnFresh --> Response
    
    subgraph "Cache Strategy"
        TTL[TTL: 15 minutes]
        Keys[Keys: products:category:cpu]
        Invalidate[Invalidate on Product Update]
    end
```

## Безопасность

```mermaid
graph TD
    Request[API Request] --> Auth{Authenticated?}
    
    Auth -->|No| Public[Public Endpoints]
    Auth -->|Yes| Private[Private Endpoints]
    
    Public --> CheckCompat[/check-compatibility]
    Public --> GetShared[/share/:token]
    
    Private --> AuthCheck[Validate JWT Token]
    AuthCheck --> SaveConfig[/configurations POST]
    AuthCheck --> GetConfigs[/configurations GET]
    
    SaveConfig --> ValidateOwner{User owns config?}
    GetConfigs --> FilterByUser[Filter by UserId]
    
    ValidateOwner -->|Yes| Allow[200 OK]
    ValidateOwner -->|No| Deny[403 Forbidden]
    
    FilterByUser --> Allow
```

## Производительность

```mermaid
graph LR
    subgraph "Performance Targets"
        Target1[API Response < 200ms]
        Target2[UI Render < 100ms]
        Target3[E2E Test < 3min]
    end
    
    subgraph "Optimization Techniques"
        Opt1[Redis Caching]
        Opt2[Database Indexes]
        Opt3[React.memo]
        Opt4[useMemo / useCallback]
        Opt5[Code Splitting]
        Opt6[Lazy Loading]
    end
    
    Target1 --> Opt1
    Target1 --> Opt2
    Target2 --> Opt3
    Target2 --> Opt4
    Target3 --> Opt5
    Target3 --> Opt6
```

## Deployment Pipeline

```mermaid
flowchart TD
    Start[Developer commits code] --> Lint[Linting - ESLint]
    Lint --> UnitTest[Unit Tests - Vitest]
    UnitTest --> IntTest[Integration Tests - xUnit]
    IntTest --> Build[Build - Docker]
    
    Build --> E2ETest[E2E Tests - Playwright]
    E2ETest --> Report[Generate Test Report]
    
    Report --> Pass{All tests passed?}
    
    Pass -->|Yes| Deploy[Deploy to Azure]
    Pass -->|No| Notify[Notify Team - Rollback]
    
    Deploy --> Smoke[Smoke Tests]
    Smoke --> Monitor[Monitor Logs & Metrics]
    
    Notify --> Fix[Fix Issues]
    Fix --> Start
```

---

## Ключевые Решения

### Почему Split-Screen вместо Modal?

- ✅ Лучший UX для desktop
- ✅ Постоянная видимость правой панели с ценой
- ✅ Меньше кликов (не нужно открывать/закрывать модалку)

### Почему проверка совместимости на клиенте?

- ✅ Мгновенная обратная связь (без задержки API)
- ✅ Меньше нагрузки на backend
- ❌ Минус: правила могут расходиться с backend (требуется синхронизация)

**Решение:** Дублировать правила на backend + E2E тесты для проверки консистентности

### Почему без AI для проверки совместимости?

- ✅ Жёсткие правила точнее (сокет либо совпадает, либо нет)
- ✅ AI может давать ложные положительные/отрицательные результаты
- ✅ Проще тестировать и дебажить

### Почему Redis для кэша, а не in-memory?

- ✅ Shared cache между инстансами backend
- ✅ Персистентность при рестарте
- ✅ TTL из коробки

---

**Версия:** 1.0  
**Дата:** 2026-04-01
