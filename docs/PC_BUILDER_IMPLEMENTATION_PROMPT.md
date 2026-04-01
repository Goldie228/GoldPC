# Конструктор ПК (PC Builder) - Детальный Промпт для Реализации

## Версия 1.0 | Дата: 2026-04-01

---

## 🎯 Цель

Реализовать полнофункциональный **Конструктор ПК** для магазина GoldPC, позволяющий пользователям собирать персональные компьютеры с проверкой совместимости компонентов, расчётом цены и мощности, сохранением конфигураций и интеграцией с корзиной.

---

## 📋 Общая Архитектура

### Структура Приложения

```
┌─────────────────────────────────────────────────────────────┐
│              PC Builder Page (Split-Screen)                  │
├──────────────────────────────┬──────────────────────────────┤
│ ЛЕВАЯ ПАНЕЛЬ (60%)           │ ПРАВАЯ ПАНЕЛЬ (40%)          │
│                              │                              │
│ • Breadcrumbs                │ • Список выбранных компонент │
│ • Toolbar                    │ • Цены по позициям           │
│ • Слоты компонентов          │ • Мини-превью основных       │
│   - CPU (приоритетный)       │ • График энергопотребления   │
│   - GPU (приоритетный)       │ • Оценки производительности  │
│   - Motherboard              │ • Итоговая сумма             │
│   - RAM                      │ • Кнопка "Добавить в корзину"│
│   - Storage                  │                              │
│   - PSU                      │                              │
│   - Case                     │                              │
│   - Cooling                  │                              │
│                              │                              │
│ • Inline чипы совместимости  │                              │
│ • Выбор компонента ->        │                              │
│   Правая панель показывает   │                              │
│   только совместимые товары  │                              │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 🎨 Дизайн и Стилистика

### Цветовая Схема

**КРИТИЧЕСКИ ВАЖНО**: **ЗЕЛЁНЫЙ ЦВЕТ ЗАПРЕЩЁН** на всей странице!

- **Акцент:** Золотой (#d4a574) - для всех интерактивных элементов, кнопок, успешных состояний
- **Ошибки:** Красный (#ef4444) - для несовместимости
- **Предупреждения:** Оранжевый (#f97316) - для предупреждений
- **Информация:** Синий (#3b82f6) - для информационных сообщений
- **Фон:** Dark theme (как во всём сайте)
- **Рамки:** Золотые с прозрачностью для границ карточек

### Изображения Компонентов

Все изображения товаров должны отображаться в **белой квадратной рамке** (как в `ProductCard`):

```css
.imageWrapper {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  /* Точно как в ProductCard.module.css строки 64-75 */
}
```

- В слотах компонентов: миниатюры товаров (64x64px) в белой рамке
- При наведении: увеличение изображения
- В правой панели: превью основных компонентов (CPU, GPU) - 120x120px

### Анимации

Баланс красоты и производительности:
- Smooth transitions для смены состояний (0.3s ease)
- Staggered animations для списка слотов (как в текущем ComponentSlot)
- Scale animation при добавлении компонента
- Fade-in для правой панели при изменении цены
- **НЕ использовать** тяжёлые анимации (blur, shadow animations)

---

## 🧩 Компоненты и Функционал

### 1. Layout и Split-Screen

**Компонент:** `PCBuilderPage.tsx`

- **Левая панель (60%)**: фиксированная ширина на desktop
- **Правая панель (40%)**: sticky при скролле, фиксируется к верху viewport
- **Breadcrumbs:** `Главная / Конструктор ПК`
- **Mobile:** приоритет desktop, на мобильных допустимы ограничения UX

**Toolbar:**
- Кнопка "Назад" → `/catalog`
- Заголовок "Конструктор ПК"
- Быстрые фильтры: "Игровой ПК", "Офисный ПК", "Рабочая станция" (шаблоны)

### 2. Слоты Компонентов

**Компонент:** `ComponentSlot.tsx` (обновить существующий)

**Приоритетное размещение:**
- CPU и GPU — крупнее (120% от остальных), выделены визуально
- Остальные компоненты — стандартный размер

**Структура слота:**
```tsx
┌──────────────────────────────────────────────────────────────┐
│ [Иконка]  [Тип компонента]                        [Статус]   │
│           [Название товара / "Выберите компонент"]            │
│           [Миниатюра товара 64x64 в белой рамке]              │
│           [Спецификации: сокет, частота, мощность...]         │
│           [Чип совместимости - inline, если есть проблемы]    │
│                                                    [Цена]      │
│           [Кнопка: "Выбрать" / "Изменить"]                    │
└──────────────────────────────────────────────────────────────┘
```

**Состояния:**
- **Пустой:** серая рамка, иконка, плейсхолдер "Выберите компонент"
- **Заполнен:** золотая рамка, изображение товара, кнопка "Изменить"
- **Несовместимый:** красная рамка, чип с проблемой, кнопка "Выбрать другой"

**Чипы совместимости (inline badges):**
```tsx
// Пример
<StatusBadge severity="error">
  ⚠️ Несовместимый сокет: AM4 vs AM5
</StatusBadge>

<StatusBadge severity="warning">
  ⚡ Недостаточно мощности БП
</StatusBadge>
```

### 3. Выбор Компонента (Right Panel Selection)

При клике на "Выбрать" / "Изменить" правая панель **превращается** в панель выбора компонента:

```tsx
┌───────────────────────────────────────────┐
│ [← Назад]  Выбор: Процессор               │
├───────────────────────────────────────────┤
│ Фильтры:                                  │
│ • Бренд: AMD / Intel                      │
│ • Сокет: AM5 / LGA1700                    │
│ • Цена: [slider]                          │
│                                           │
│ Список товаров (ТОЛЬКО совместимые!):     │
│                                           │
│ ┌─────────────────────────────────────┐   │
│ │ [img] AMD Ryzen 7 7800X3D           │   │
│ │ AM5 • 8C/16T • 5.0GHz               │   │
│ │                        1899 BYN [✓] │   │
│ └─────────────────────────────────────┘   │
│                                           │
│ ┌─────────────────────────────────────┐   │
│ │ [img] Intel Core i7-14700K          │   │
│ │ LGA1700 • 20C/28T • 5.6GHz          │   │
│ │                        2199 BYN [✓] │   │
│ └─────────────────────────────────────┘   │
│                                           │
│ ... (прокрутка)                           │
└───────────────────────────────────────────┘
```

**Логика фильтрации:**
- **ПОКАЗЫВАТЬ ТОЛЬКО СОВМЕСТИМЫЕ** компоненты по умолчанию
- Фильтрация на клиенте + использование `useProducts` хука
- Если выбран CPU с сокетом AM5 → показываем только материнские платы с AM5
- Если выбрана материнка DDR5 → показываем только DDR5 память
- Динамическое обновление списка при изменении других компонентов

**Интеграция с Catalog:**
- Использовать `useProducts` хук с параметрами `category`
- Дополнительная фильтрация на клиенте по спецификациям
- Новый хук: `useCompatibleProducts(category, existingComponents)` (создать)

### 4. Правая Панель Сводки (Summary Panel)

**Компонент:** `BuildSummaryPanel.tsx` (создать новый)

**Содержимое:**

```tsx
┌─────────────────────────────────────────┐
│  Ваша сборка                            │
├─────────────────────────────────────────┤
│  Компоненты:                            │
│                                         │
│  [img] AMD Ryzen 7 7800X3D              │
│  Процессор              1899 BYN        │
│                                         │
│  [img] ASUS ROG Strix RTX 4070          │
│  Видеокарта             2599 BYN        │
│                                         │
│  ... (остальные компоненты)             │
│                                         │
├─────────────────────────────────────────┤
│  Энергопотребление:                     │
│  ━━━━━━━━━━━━━━━━░░░░ 450W / 750W      │
│  Запас: 300W (40%)          [✓ ОК]     │
├─────────────────────────────────────────┤
│  Производительность:                    │
│  🎮 Игры (1440p):       95 FPS (High)   │
│  💼 Рендер (Blender):   8.2/10          │
│  ⚡ Общий скор:         8,547 pts       │
├─────────────────────────────────────────┤
│  ИТОГО:            12,450 BYN           │
│                                         │
│  [Добавить в корзину]                   │
│                                         │
│  [Сохранить сборку]  [Поделиться 🔗]    │
└─────────────────────────────────────────┘
```

**График энергопотребления:**
- Прогресс-бар: заполненная часть (золото), свободная (серая)
- Расчёт: TDP CPU + TDP GPU + 50W (остальное) + 30% запас
- Валидация: если PSU < recommended → показывать предупреждение

**Оценки производительности:**
- **Gaming Score**: на основе GPU + CPU
  - RTX 4070 + Ryzen 7 → 1440p High ~95 FPS (примерные данные)
- **Workstation Score**: на основе CPU cores + RAM
  - Рендеринг: больше ядер → выше балл
- **Общий скор**: сумма benchmark баллов (PassMark / Cinebench style)

**Расчёт на основе:**
- CPU specs: `cores`, `threads`, `performanceScore` (добавить в спецификации)
- GPU specs: `vram`, `performanceScore` (добавить в спецификации)

### 5. Логика Проверки Совместимости

**Сервис:** `CompatibilityService` (backend) + `usePCBuilder` хук (frontend)

#### Критерии Совместимости (Жёсткие Правила)

**1. CPU ↔ Motherboard (Сокет)**
```typescript
if (cpu.socket !== motherboard.socket) {
  errors.push({
    severity: 'error',
    component1: 'cpu',
    component2: 'motherboard',
    message: `Сокет процессора (${cpu.socket}) не соответствует сокету материнской платы (${motherboard.socket})`,
    suggestion: `Выберите материнскую плату с сокетом ${cpu.socket} или процессор с сокетом ${motherboard.socket}`
  });
}
```

**2. RAM ↔ Motherboard (Тип памяти)**
```typescript
if (ram.type !== motherboard.memoryType) {
  errors.push({
    severity: 'error',
    component1: 'ram',
    component2: 'motherboard',
    message: `Тип памяти (${ram.type}) не поддерживается материнской платой (${motherboard.memoryType})`,
    suggestion: `Выберите память типа ${motherboard.memoryType}`
  });
}
```

**3. Cooling ↔ CPU (Сокет)**
```typescript
if (!cooling.supportedSockets.includes(cpu.socket)) {
  warnings.push({
    severity: 'warning',
    component: 'cooling',
    message: `Система охлаждения может не поддерживать сокет ${cpu.socket}`,
    suggestion: 'Проверьте совместимость у производителя'
  });
}
```

**4. PSU ↔ Конфигурация (Мощность)**
```typescript
const totalPower = cpu.tdp + gpu.tdp + 50; // базовое потребление
const recommendedPSU = totalPower * 1.4; // 40% запас

if (psu.wattage < recommendedPSU) {
  warnings.push({
    severity: 'warning',
    component: 'psu',
    message: `Рекомендуется блок питания мощнее (${Math.ceil(recommendedPSU)}W), текущий: ${psu.wattage}W`,
    suggestion: `Выберите БП от ${Math.ceil(recommendedPSU)}W`
  });
}
```

**5. GPU ↔ Case (Размер)**
```typescript
if (gpu.length > case.maxGpuLength) {
  errors.push({
    severity: 'error',
    component1: 'gpu',
    component2: 'case',
    message: `Видеокарта (${gpu.length}мм) не помещается в корпус (макс. ${case.maxGpuLength}мм)`,
    suggestion: `Выберите корпус с поддержкой видеокарт до ${gpu.length}мм`
  });
}
```

**6. Cooler ↔ Case (Высота)**
```typescript
if (cooler.height > case.maxCoolerHeight) {
  errors.push({
    severity: 'error',
    component1: 'cooling',
    component2: 'case',
    message: `Кулер (${cooler.height}мм) не помещается в корпус (макс. ${case.maxCoolerHeight}мм)`,
    suggestion: `Выберите корпус побольше или низкопрофильный кулер`
  });
}
```

**7. Bottleneck Detection**
```typescript
const cpuScore = cpu.performanceScore;
const gpuScore = gpu.performanceScore;
const ratio = Math.max(cpuScore, gpuScore) / Math.min(cpuScore, gpuScore);

if (ratio > 2.0) {
  warnings.push({
    severity: 'info',
    message: `Обнаружен дисбаланс производительности. ${
      cpuScore > gpuScore 
        ? 'Процессор значительно мощнее видеокарты — рассмотрите более мощный GPU'
        : 'Видеокарта значительно мощнее процессора — возможно узкое место в CPU'
    }`,
    suggestion: 'Рекомендуем сбалансировать конфигурацию'
  });
}
```

#### Валидация Backend

**Endpoint:** `POST /api/v1/pcbuilder/check-compatibility`

```csharp
// PCBuilderService/Services/CompatibilityService.cs
public class CompatibilityService : ICompatibilityService
{
    public async Task<CompatibilityCheckResponse> CheckCompatibilityAsync(
        CompatibilityCheckRequest request)
    {
        var result = new CompatibilityResult 
        { 
            IsCompatible = true, 
            Issues = new(), 
            Warnings = new() 
        };

        // 1. Загружаем спецификации всех компонентов
        var components = await LoadComponentSpecsAsync(request.Components);

        // 2. Проверяем каждое правило
        CheckCpuMotherboardSocket(components, result);
        CheckRamCompatibility(components, result);
        CheckPowerSupply(components, result);
        CheckCoolingCompatibility(components, result);
        CheckCaseFit(components, result);
        DetectBottleneck(components, result);

        // 3. Расчёт мощности
        var powerConsumption = CalculatePowerConsumption(components);
        var recommendedPSU = (int)(powerConsumption * 1.4);

        result.IsCompatible = result.Issues.Count == 0;

        return new CompatibilityCheckResponse
        {
            Result = result,
            PowerConsumption = powerConsumption,
            RecommendedPSU = recommendedPSU
        };
    }

    // ... методы проверки
}
```

---

## 📦 Backend API

### Endpoints

**1. Проверка совместимости**
```http
POST /api/v1/pcbuilder/check-compatibility
Content-Type: application/json

{
  "components": {
    "cpu": {
      "productId": "guid",
      "specifications": { ... }
    },
    "motherboard": { ... },
    "ram": { ... },
    ...
  }
}

Response 200 OK:
{
  "result": {
    "isCompatible": true,
    "issues": [],
    "warnings": [
      {
        "severity": "Warning",
        "component": "psu",
        "message": "Рекомендуется БП мощнее...",
        "suggestion": "Выберите от 750W"
      }
    ]
  },
  "powerConsumption": 450,
  "recommendedPSU": 630
}
```

**2. Сохранение конфигурации**
```http
POST /api/v1/pcbuilder/configurations
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Игровой ПК 2026",
  "components": { ... },
  "purpose": "Gaming"
}

Response 201 Created:
{
  "id": "guid",
  "name": "Игровой ПК 2026",
  ...
}
```

**3. Получение конфигураций пользователя**
```http
GET /api/v1/pcbuilder/configurations
Authorization: Bearer <token>

Response 200 OK:
{
  "data": [
    {
      "id": "guid",
      "name": "Игровой ПК 2026",
      "totalPrice": 12450,
      "isCompatible": true,
      "createdAt": "2026-04-01T10:00:00Z"
    },
    ...
  ]
}
```

**4. Генерация ссылки для шаринга**
```http
POST /api/v1/pcbuilder/configurations/{id}/share

Response 200 OK:
{
  "shareUrl": "https://goldpc.by/pc-builder/share/abc123def"
}
```

### Database Schema

**Таблица:** `PCConfigurations`

```sql
CREATE TABLE PCConfigurations (
    Id UUID PRIMARY KEY,
    UserId UUID NULL,                    -- NULL если не авторизован
    Name NVARCHAR(100) NOT NULL,
    Purpose NVARCHAR(50),                -- Gaming, Office, Workstation
    
    -- Component IDs (FK to Products)
    ProcessorId UUID NULL,
    MotherboardId UUID NULL,
    RamId UUID NULL,
    GpuId UUID NULL,
    PsuId UUID NULL,
    StorageId UUID NULL,
    CaseId UUID NULL,
    CoolerId UUID NULL,
    
    TotalPrice DECIMAL(18, 2),
    TotalPower INT,                      -- Ватты
    IsCompatible BIT DEFAULT 1,
    
    ShareToken NVARCHAR(50) UNIQUE NULL, -- Для шаринга
    
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2
);

CREATE INDEX IX_PCConfigurations_UserId ON PCConfigurations(UserId);
CREATE INDEX IX_PCConfigurations_ShareToken ON PCConfigurations(ShareToken);
```

---

## 🧪 Тестирование

### Уровни Тестов

#### 1. Unit Tests

**Backend (xUnit):**

```csharp
// PCBuilderService.Tests/CompatibilityServiceTests.cs

[Fact]
public async Task CheckCompatibility_IncompatibleSocket_ReturnsError()
{
    // Arrange
    var request = new CompatibilityCheckRequest
    {
        Components = new PCComponents
        {
            Cpu = CreateCpu(socket: "AM5"),
            Motherboard = CreateMotherboard(socket: "AM4")
        }
    };

    // Act
    var result = await _service.CheckCompatibilityAsync(request);

    // Assert
    Assert.False(result.Result.IsCompatible);
    Assert.Contains(result.Result.Issues, i => 
        i.Message.Contains("Сокет процессора") && i.Message.Contains("AM5") && i.Message.Contains("AM4"));
}

[Fact]
public async Task CalculatePowerConsumption_WithCpuAndGpu_ReturnsCorrectValue()
{
    // Arrange
    var components = new PCComponents
    {
        Cpu = CreateCpu(tdp: 120),
        Gpu = CreateGpu(tdp: 220)
    };

    // Act
    var power = await _service.CalculateTotalPowerConsumptionAsync(components);

    // Assert
    Assert.Equal(390, power); // 120 + 220 + 50 (базовое)
}
```

**Frontend (Vitest + React Testing Library):**

```typescript
// usePCBuilder.test.ts

describe('usePCBuilder', () => {
  it('should detect socket incompatibility', () => {
    const { result } = renderHook(() => usePCBuilder());
    
    act(() => {
      result.current.selectComponent('cpu', mockCpuAM5);
      result.current.selectComponent('motherboard', mockMotherboardAM4);
    });

    expect(result.current.isCompatible).toBe(false);
    expect(result.current.compatibility.errors).toHaveLength(1);
    expect(result.current.compatibility.errors[0]).toContain('Сокет');
  });

  it('should calculate total price correctly', () => {
    const { result } = renderHook(() => usePCBuilder());
    
    act(() => {
      result.current.selectComponent('cpu', { ...mockCpu, price: 1000 });
      result.current.selectComponent('gpu', { ...mockGpu, price: 2000 });
    });

    expect(result.current.totalPrice).toBe(3000);
  });
});
```

#### 2. Integration Tests

**Backend API Tests:**

```csharp
// PCBuilderService.Tests/IntegrationTests/PCBuilderControllerTests.cs

public class PCBuilderControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task CheckCompatibility_ValidRequest_Returns200()
    {
        // Arrange
        var client = _factory.CreateClient();
        var request = new CompatibilityCheckRequest { /* ... */ };

        // Act
        var response = await client.PostAsJsonAsync(
            "/api/v1/pcbuilder/check-compatibility", 
            request
        );

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<CompatibilityCheckResponse>();
        result.Should().NotBeNull();
    }
}
```

#### 3. E2E Tests (Playwright)

**Тестовые сценарии:**

```typescript
// tests/e2e/pc-builder.spec.ts

test.describe('PC Builder - Compatibility Check', () => {
  test('should show error when selecting incompatible CPU and motherboard', async ({ page }) => {
    // Arrange
    await page.goto('/pc-builder');

    // Act - Выбираем CPU с сокетом AM5
    await page.click('[data-testid="slot-cpu"] button');
    await page.click('[data-testid="product-ryzen-7-7800x3d"]');

    // Act - Выбираем материнку с сокетом AM4
    await page.click('[data-testid="slot-motherboard"] button');
    await page.click('[data-testid="product-asus-b550"]');

    // Assert - Проверяем ошибку совместимости
    await expect(page.locator('[data-testid="compatibility-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="compatibility-error"]')).toContainText('Сокет');
    
    // Assert - Кнопка "Добавить в корзину" недоступна
    await expect(page.locator('[data-testid="add-to-cart-button"]')).toBeDisabled();
  });

  test('should calculate total price correctly', async ({ page }) => {
    await page.goto('/pc-builder');

    // Добавляем CPU
    await page.click('[data-testid="slot-cpu"] button');
    await page.click('[data-testid="product-ryzen-7-7800x3d"]'); // 1899 BYN

    // Добавляем GPU
    await page.click('[data-testid="slot-gpu"] button');
    await page.click('[data-testid="product-rtx-4070"]'); // 2599 BYN

    // Проверяем итоговую цену
    const total = await page.locator('[data-testid="total-price"]').textContent();
    expect(total).toContain('4,498'); // 1899 + 2599
  });

  test('should save configuration for authorized user', async ({ page }) => {
    // Arrange - Логинимся
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('[type="submit"]');

    // Собираем конфигурацию
    await page.goto('/pc-builder');
    // ... добавляем компоненты

    // Act - Сохраняем
    await page.click('[data-testid="save-config-button"]');
    await page.fill('[name="configName"]', 'Моя игровая сборка');
    await page.click('[data-testid="confirm-save"]');

    // Assert
    await expect(page.locator('[data-testid="save-success-toast"]')).toBeVisible();
    
    // Проверяем, что конфигурация появилась в списке
    await page.goto('/account/configurations');
    await expect(page.locator('text=Моя игровая сборка')).toBeVisible();
  });

  test('should add complete build to cart', async ({ page }) => {
    await page.goto('/pc-builder');

    // Добавляем все компоненты (минимально необходимые)
    await selectComponent(page, 'cpu', 'ryzen-7-7800x3d');
    await selectComponent(page, 'motherboard', 'asus-x670e');
    await selectComponent(page, 'ram', 'gskill-32gb-ddr5');
    await selectComponent(page, 'gpu', 'rtx-4070');
    await selectComponent(page, 'storage', 'samsung-990-pro');
    await selectComponent(page, 'psu', 'corsair-750w');
    await selectComponent(page, 'case', 'nzxt-h510');
    await selectComponent(page, 'cooling', 'noctua-nh-d15');

    // Проверяем совместимость
    await expect(page.locator('[data-testid="compatibility-status"]')).toHaveText('Совместимо');

    // Добавляем в корзину
    await page.click('[data-testid="add-to-cart-button"]');

    // Переходим в корзину
    await page.goto('/cart');

    // Проверяем, что все 8 компонентов добавлены
    const cartItems = await page.locator('[data-testid="cart-item"]').count();
    expect(cartItems).toBe(8);
  });
});

test.describe('PC Builder - Edge Cases', () => {
  test('should handle empty configuration', async ({ page }) => {
    await page.goto('/pc-builder');

    // Проверяем, что кнопка "Добавить в корзину" недоступна
    await expect(page.locator('[data-testid="add-to-cart-button"]')).toBeDisabled();
    
    // Проверяем, что цена равна 0
    const total = await page.locator('[data-testid="total-price"]').textContent();
    expect(total).toContain('0');
  });

  test('should handle network error when loading products', async ({ page }) => {
    // Simulate network error
    await page.route('**/api/v1/catalog/products*', route => route.abort());

    await page.goto('/pc-builder');
    await page.click('[data-testid="slot-cpu"] button');

    // Проверяем отображение ошибки
    await expect(page.locator('[data-testid="error-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('should handle products without specifications', async ({ page }) => {
    // Mock API с товаром без спецификаций
    await page.route('**/api/v1/catalog/products?category=cpu*', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: [{
            id: 'test-cpu-id',
            name: 'Test CPU Without Specs',
            price: 1000,
            specifications: null
          }]
        })
      });
    });

    await page.goto('/pc-builder');
    await page.click('[data-testid="slot-cpu"] button');

    // Проверяем, что товар отображается с предупреждением
    await expect(page.locator('text=Test CPU Without Specs')).toBeVisible();
    await expect(page.locator('[data-testid="missing-specs-warning"]')).toBeVisible();
  });

  test('should prevent duplicate component selection', async ({ page }) => {
    await page.goto('/pc-builder');

    // Выбираем CPU
    await page.click('[data-testid="slot-cpu"] button');
    await page.click('[data-testid="product-ryzen-7-7800x3d"]');

    // Пытаемся выбрать тот же CPU снова
    await page.click('[data-testid="slot-cpu"] button');
    
    // Проверяем, что текущий выбранный компонент отмечен
    const selectedProduct = page.locator('[data-testid="product-ryzen-7-7800x3d"]');
    await expect(selectedProduct).toHaveClass(/selected/);
  });
});

// Helper function
async function selectComponent(page, slot: string, productId: string) {
  await page.click(`[data-testid="slot-${slot}"] button`);
  await page.click(`[data-testid="product-${productId}"]`);
  await page.waitForLoadState('networkidle');
}
```

### Тестовые Данные

**Источник:** Реальные товары из каталога

**Создать тестовую коллекцию:**
```sql
-- scripts/seed/pc-builder-test-data.sql

-- Создаём тестовые конфигурации для проверки всех сценариев
INSERT INTO Products (Id, Name, Category, Price, InStock, Specifications) VALUES
-- Compatible AMD build (AM5)
('cpu-am5-1', 'AMD Ryzen 7 7800X3D', 'cpu', 1899.00, 1, '{"socket":"AM5","cores":8,"threads":16,"tdp":120,"performanceScore":9500}'),
('mb-am5-1', 'ASUS TUF Gaming X670E-PLUS', 'motherboard', 1299.00, 1, '{"socket":"AM5","memoryType":"DDR5","formFactor":"ATX","maxRamSpeed":6000}'),

-- Compatible Intel build (LGA1700)
('cpu-1700-1', 'Intel Core i7-14700K', 'cpu', 2199.00, 1, '{"socket":"LGA1700","cores":20,"threads":28,"tdp":125,"performanceScore":10200}'),
('mb-1700-1', 'MSI MAG Z790 TOMAHAWK', 'motherboard', 1599.00, 1, '{"socket":"LGA1700","memoryType":"DDR5","formFactor":"ATX"}'),

-- Incompatible (для тестов ошибок)
('mb-am4-old', 'ASUS TUF B550-PLUS', 'motherboard', 799.00, 1, '{"socket":"AM4","memoryType":"DDR4","formFactor":"ATX"}'),
('ram-ddr4', 'G.Skill Ripjaws V 32GB DDR4', 'ram', 499.00, 1, '{"type":"DDR4","speed":3600,"capacity":32}'),

-- GPUs

('gpu-4070', 'ASUS ROG Strix RTX 4070', 'gpu', 2599.00, 1, '{"length":320,"tdp":220,"vram":12,"performanceScore":8500}'),
('gpu-4090', 'ASUS ROG Strix RTX 4090', 'gpu', 8999.00, 1, '{"length":357,"tdp":450,"vram":24,"performanceScore":12000}'),
-- PSUs
('psu-750', 'Corsair RM750e', 'psu', 549.00, 1, '{"wattage":750,"efficiency":"80+ Gold","modular":true}'),
('psu-500-weak', 'Aerocool VX-500', 'psu', 249.00, 1, '{"wattage":500,"efficiency":"80+ Bronze","modular":false}'),

-- Cases
('case-h510', 'NZXT H510', 'case', 399.00, 1, '{"formFactor":"ATX","maxGpuLength":381,"maxCoolerHeight":165}'),
('case-small', 'Cooler Master Q300L', 'case', 299.00, 1, '{"formFactor":"mATX","maxGpuLength":360,"maxCoolerHeight":159}'),

-- Cooling
('cool-d15', 'Noctua NH-D15', 'cooling', 449.00, 1, '{"type":"Air","height":165,"tdp":200,"supportedSockets":["AM5","AM4","LGA1700","LGA1200"]}'),
('cool-aio', 'NZXT Kraken X63', 'cooling', 699.00, 1, '{"type":"AIO","radiatorSize":280,"tdp":250,"supportedSockets":["AM5","AM4","LGA1700"]}'),

-- Storage
('ssd-990', 'Samsung 990 PRO 1TB', 'storage', 599.00, 1, '{"type":"NVMe","capacity":1000,"interface":"PCIe 4.0"}');
```

### Отчёты о Тестировании

**Формат:** Простой Markdown

**Структура отчёта:**

```markdown
# PC Builder - Отчёт о Тестировании
**Дата:** 2026-04-01
**Версия:** 1.0
**Тестировщик:** Goldie Developer

## Результаты

### Unit Tests
- ✅ Всего: 48
- ✅ Успешных: 48
- ❌ Провалено: 0
- ⏱ Время: 2.3s

### Integration Tests
- ✅ Всего: 24
- ✅ Успешных: 24
- ❌ Провалено: 0
- ⏱ Время: 8.7s

### E2E Tests
- ✅ Всего: 16
- ✅ Успешных: 14
- ❌ Провалено: 2
- ⏱ Время: 3m 42s

## Найденные Проблемы

### 🔴 Критические (Блокеры)

**#1: Несовместимые компоненты всё равно добавляются в корзину**
- **Сценарий:** E2E test `should block add to cart if incompatible`
- **Ожидание:** Кнопка "Добавить в корзину" недоступна при ошибках совместимости
- **Факт:** Кнопка активна, можно добавить несовместимую конфигурацию
- **Скриншот:** `screenshots/issue-001.png`
- **Лог:** `logs/e2e-test-001.log`
- **Исправление:** Добавить проверку `isCompatible` в `BuildSummaryPanel`

### 🟠 Важные (Не блокеры)

**#2: Медленная загрузка списка совместимых компонентов**
- **Сценарий:** Performance test - выбор материнской платы после CPU
- **Ожидание:** < 500ms
- **Факт:** 1.8s
- **Причина:** Фильтрация на клиенте по всем товарам
- **Исправление:** Создать backend endpoint `/compatible-components`

### 🟢 Незначительные

**#3: Отсутствует индикация загрузки в правой панели**
- **Сценарий:** UX review
- **Ожидание:** Skeleton loader при пересчёте
- **Факт:** Панель "моргает"
- **Исправление:** Добавить `<Skeleton>` компонент

## Покрытие

| Компонент              | Unit | Integration | E2E | Покрытие |
|------------------------|------|-------------|-----|----------|
| usePCBuilder           | ✅   | -           | ✅  | 92%      |
| CompatibilityService   | ✅   | ✅          | ✅  | 88%      |
| ComponentSlot          | ✅   | -           | ✅  | 85%      |
| BuildSummaryPanel      | ✅   | -           | ✅  | 78%      |
| PCBuilderPage          | ✅   | -           | ✅  | 74%      |

## Следующая Итерация

1. ✅ Исправить #1 (критично)
2. ✅ Исправить #2 (оптимизация)
3. ⏭ Ретест всех E2E сценариев
4. ⏭ Валидация edge cases (пустые спецификации, сетевые ошибки)

---

**Статус:** 🟢 Готово к production (после исправления #1)
```

### Итеративный Процесс

**Цикл:**
```
┌─────────────────────────────────────────────────────────┐
│ 1. Разработка фичи                                      │
│    ↓                                                    │
│ 2. Написание тестов (Unit + Integration)               │
│    ↓                                                    │
│ 3. Запуск тестов локально                              │
│    ↓                                                    │
│ 4. Исправление ошибок                                  │
│    ↓                                                    │
│ 5. E2E тесты (Playwright)                              │
│    ↓                                                    │
│ 6. Генерация отчёта (Markdown)                         │
│    ↓                                                    │
│ 7. Code Review + исправление по отчёту                 │
│    ↓                                                    │
│ 8. Ретест (автоматический)                             │
│    ↓                                                    │
│ 9. Валидация (все тесты зелёные?)                      │
│    ├─ ✅ Да → Готово к деплою                          │
│    └─ ❌ Нет → вернуться к шагу 4                      │
└─────────────────────────────────────────────────────────┘
```

---

## 📚 Готовые Сборки и Шаблоны

### Wizard Подбора (Мастер)

**Компонент:** `BuildWizard.tsx` (создать)

**Флоу:**
```
Шаг 1: Назначение
┌─────────────────────────────────┐
│ Для чего вы собираете ПК?       │
│                                 │
│ [ ] 🎮 Игры                     │
│ [ ] 💼 Офис и интернет          │
│ [ ] 🎬 Видеомонтаж и 3D         │
│ [ ] 🖥️ Универсальный            │
│                                 │
│        [Далее →]                │
└─────────────────────────────────┘

Шаг 2: Бюджет
┌─────────────────────────────────┐
│ Какой у вас бюджет?             │
│                                 │
│ [ ] До 1,500 BYN (Минимум)      │
│ [ ] 1,500 - 3,000 BYN (Оптимум) │
│ [ ] 3,000 - 5,000 BYN (Хорошо)  │
│ [ ] 5,000+ BYN (Максимум)       │
│                                 │
│   [← Назад]   [Далее →]         │
└─────────────────────────────────┘

Шаг 3: Предпочтения
┌─────────────────────────────────┐
│ Дополнительные требования?      │
│                                 │
│ Производитель CPU:              │
│   ( ) AMD  ( ) Intel            │
│                                 │
│ Производитель GPU:              │
│   ( ) AMD  ( ) NVIDIA           │
│                                 │
│ Объём RAM (минимум):            │
│   [▓▓▓▓▓░░░] 16 GB              │
│                                 │
│   [← Назад]   [Готово ✓]        │
└─────────────────────────────────┘

Результат:
┌─────────────────────────────────┐
│ ✅ Мы подобрали для вас сборку! │
│                                 │
│ 🎮 Игровой ПК - Оптимум         │
│ Бюджет: 2,950 BYN               │
│                                 │
│ • AMD Ryzen 5 7600              │
│ • NVIDIA RTX 4060               │
│ • 16GB DDR5                     │
│ • 500GB NVMe SSD                │
│ • ...                           │
│                                 │
│ [Просмотреть]  [Изменить]       │
└─────────────────────────────────┘
```

### Готовые Шаблоны

**Endpoint:** `GET /api/v1/pcbuilder/recommendations?purpose=gaming&budget=1500-3000`

**Шаблоны (примеры):**

| Название                 | Назначение   | Бюджет (BYN) | Компоненты                                                                 |
|--------------------------|--------------|--------------|----------------------------------------------------------------------------|
| Игровой Минимум          | Gaming       | ~1,500       | Ryzen 5 5600 + RX 6600 + 16GB DDR4 + 500GB SSD                            |
| Игровой Оптимум          | Gaming       | ~3,000       | Ryzen 7 7700X + RTX 4060 Ti + 32GB DDR5 + 1TB NVMe                        |
| Игровой Максимум         | Gaming       | ~6,000       | Ryzen 7 7800X3D + RTX 4070 Ti + 32GB DDR5 + 2TB NVMe                      |
| Офисный Стандарт         | Office       | ~800         | Intel Pentium G7400 + Integrated + 8GB DDR4 + 256GB SSD                   |
| Рабочая Станция Начальная| Workstation  | ~2,000       | Ryzen 7 5700X + RTX 4060 + 32GB DDR4 + 1TB NVMe                           |
| Рабочая Станция Pro      | Workstation  | ~5,000       | Ryzen 9 7950X + RTX 4070 + 64GB DDR5 + 2TB NVMe                           |

**API Response:**
```json
{
  "recommendations": [
    {
      "id": "build-gaming-optimal",
      "name": "Игровой ПК - Оптимум",
      "purpose": "Gaming",
      "totalPrice": 2950.00,
      "performanceScore": 85,
      "gamingScore": 90,
      "workstationScore": 70,
      "description": "Идеальный баланс цены и производительности для современных игр в Full HD и 1440p",
      "components": {
        "cpu": {
          "productId": "cpu-ryzen-7-7700x",
          "name": "AMD Ryzen 7 7700X",
          "price": 1299.00,
          "specifications": { /* ... */ }
        },
        "gpu": {
          "productId": "gpu-rtx-4060ti",
          "name": "NVIDIA RTX 4060 Ti 8GB",
          "price": 1999.00,
          "specifications": { /* ... */ }
        },
        // ...
      }
    }
  ]
}
```

---

## 💾 Сохранение и Шаринг

### LocalStorage (для всех пользователей)

```typescript
// utils/pcBuilderStorage.ts

const STORAGE_KEY = 'goldpc_pc_builder_config';

export interface StoredConfiguration {
  components: Partial<Record<PCComponentType, Product>>;
  timestamp: number;
}

export function saveToLocalStorage(components: Partial<Record<PCComponentType, Product>>) {
  const data: StoredConfiguration = {
    components,
    timestamp: Date.now()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadFromLocalStorage(): StoredConfiguration | null {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;
  
  try {
    const parsed = JSON.parse(data) as StoredConfiguration;
    
    // Автоочистка старых данных (> 30 дней)
    if (Date.now() - parsed.timestamp > 30 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    
    return parsed;
  } catch {
    return null;
  }
}
```

### Облачное Сохранение (для авторизованных)

**Компонент:** `SaveConfigurationModal.tsx` (создать)

```tsx
<Modal title="Сохранить конфигурацию" open={open} onClose={onClose}>
  <form onSubmit={handleSave}>
    <Input
      label="Название сборки"
      name="configName"
      placeholder="Игровой ПК 2026"
      required
    />
    
    <Select label="Назначение" name="purpose">
      <option value="gaming">Игры</option>
      <option value="office">Офис</option>
      <option value="workstation">Рабочая станция</option>
    </Select>
    
    <div className="summary">
      <p>Компонентов: {selectedCount} / 8</p>
      <p>Совместимо: {isCompatible ? '✅ Да' : '❌ Нет'}</p>
      <p>Итого: {totalPrice.toLocaleString('ru-BY')} BYN</p>
    </div>
    
    <Button type="submit" disabled={!isCompatible || selectedCount === 0}>
      Сохранить
    </Button>
  </form>
</Modal>
```

### Генерация Ссылки для Шаринга

**Backend:**
```csharp
// PCBuilderService/Controllers/PCBuilderController.cs

[HttpPost("configurations/{id:guid}/share")]
public async Task<ActionResult<ShareConfigurationResponse>> ShareConfiguration(Guid id)
{
    var config = await _configurationService.GetConfigurationAsync(id);
    if (config == null) return NotFound();
    
    // Генерируем уникальный токен
    var shareToken = GenerateShareToken(); // например: "abc123def456"
    config.ShareToken = shareToken;
    await _db.SaveChangesAsync();
    
    var shareUrl = $"{_config["App:BaseUrl"]}/pc-builder/share/{shareToken}";
    
    return Ok(new ShareConfigurationResponse 
    { 
        ShareUrl = shareUrl 
    });
}

[HttpGet("share/{token}")]
[AllowAnonymous]
public async Task<ActionResult<PCConfiguration>> GetSharedConfiguration(string token)
{
    var config = await _db.PCConfigurations
        .FirstOrDefaultAsync(c => c.ShareToken == token);
    
    if (config == null) return NotFound();
    
    return Ok(MapToDto(config));
}

private string GenerateShareToken()
{
    return Convert.ToBase64String(Guid.NewGuid().ToByteArray())
        .Replace("/", "_")
        .Replace("+", "-")
        .Substring(0, 12);
}
```

**Frontend:**
```tsx
// pages/PCBuilderPage/ShareConfigModal.tsx

function ShareConfigModal({ configId }: { configId: string }) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const response = await api.post(`/pcbuilder/configurations/${configId}/share`);
    setShareUrl(response.data.shareUrl);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl!);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal>
      {!shareUrl ? (
        <Button onClick={handleShare}>Создать ссылку</Button>
      ) : (
        <>
          <Input value={shareUrl} readOnly />
          <Button onClick={handleCopy}>
            {copied ? '✅ Скопировано' : '📋 Копировать'}
          </Button>
        </>
      )}
    </Modal>
  );
}
```

---

## 🛒 Добавление в Корзину

### Логика

**Когда:**
- Пользователь нажимает "Добавить в корзину"
- Все компоненты добавляются **отдельными позициями** (не как bundle)

**Валидация:**
- ✅ Должна быть совместимая конфигурация (`isCompatible === true`)
- ✅ Хотя бы один компонент выбран (`selectedCount > 0`)

**Интеграция с OrderService:**

```typescript
// hooks/usePCBuilder.ts (дополнить)

export function usePCBuilder() {
  // ... existing code

  const addToCart = useCallback(async () => {
    if (!isCompatible || selectedCount === 0) {
      showToast('error', 'Невозможно добавить несовместимую конфигурацию');
      return;
    }

    try {
      // Добавляем каждый компонент отдельно
      const products = Object.values(selectedComponents)
        .filter((c): c is SelectedComponent => c !== undefined)
        .map(c => c.product);

      for (const product of products) {
        await cartApi.addItem({
          productId: product.id,
          quantity: 1
        });
      }

      showToast('success', `${products.length} компонентов добавлено в корзину`);
      
      // Опционально: переход в корзину
      navigate('/cart');
    } catch (error) {
      showToast('error', 'Не удалось добавить в корзину');
      console.error(error);
    }
  }, [selectedComponents, isCompatible, selectedCount]);

  return {
    // ... existing return
    addToCart,
  };
}
```

---

## 📊 Производительность и Оптимизация

### Метрики (Benchmarks)

**Источник:** Вычисляемые значения на основе спецификаций

**Формулы:**

```typescript
// utils/performanceCalculator.ts

export interface PerformanceMetrics {
  gamingScore: number;      // 1-100
  workstationScore: number; // 1-100
  overallScore: number;     // 1-100
  estimatedFps: {
    '1080p': number;
    '1440p': number;
    '4k': number;
  };
  renderingScore: number;   // For Blender, etc.
}

export function calculatePerformance(
  cpu: Product,
  gpu: Product | undefined,
  ram: Product | undefined
): PerformanceMetrics {
  const cpuScore = cpu.specifications?.performanceScore as number ?? 0;
  const gpuScore = gpu?.specifications?.performanceScore as number ?? 0;
  const ramCapacity = ram?.specifications?.capacity as number ?? 16;

  // Gaming Score (GPU 70%, CPU 25%, RAM 5%)
  const gamingScore = Math.min(100, Math.round(
    (gpuScore * 0.70 + cpuScore * 0.25 + (ramCapacity / 32) * 500) / 100
  ));

  // Workstation Score (CPU 60%, RAM 30%, GPU 10%)
  const workstationScore = Math.min(100, Math.round(
    (cpuScore * 0.60 + (ramCapacity / 64) * 3000 + gpuScore * 0.10) / 100
  ));

  // Overall Score (среднее)
  const overallScore = Math.round((gamingScore + workstationScore) / 2);

  // Estimated FPS (примерно)
  const estimatedFps = {
    '1080p': Math.round(gpuScore / 50), // RTX 4070 (~8500) -> ~170 FPS
    '1440p': Math.round(gpuScore / 70), // RTX 4070 (~8500) -> ~121 FPS
    '4k': Math.round(gpuScore / 120),   // RTX 4070 (~8500) -> ~70 FPS
  };

  // Rendering Score (Blender style)
  const renderingScore = Math.min(10, Math.round(
    ((cpuScore / 1000) + (gpuScore / 2000)) / 2
  ));

  return {
    gamingScore,
    workstationScore,
    overallScore,
    estimatedFps,
    renderingScore,
  };
}
```

**Отображение в UI:**

```tsx
// BuildSummaryPanel.tsx

<div className="performance-metrics">
  <h3>Производительность</h3>
  
  <div className="metric">
    <span className="metric-icon">🎮</span>
    <span className="metric-label">Игры (1440p):</span>
    <span className="metric-value">{metrics.estimatedFps['1440p']} FPS</span>
    <span className="metric-rating">{getRating(metrics.gamingScore)}</span>
  </div>
  
  <div className="metric">
    <span className="metric-icon">💼</span>
    <span className="metric-label">Рендер (Blender):</span>
    <span className="metric-value">{metrics.renderingScore}/10</span>
  </div>
  
  <div className="metric">
    <span className="metric-icon">⚡</span>
    <span className="metric-label">Общий скор:</span>
    <span className="metric-value">{metrics.overallScore}/100</span>
  </div>
</div>
```

---

## 🎯 Side-by-Side Сравнение Сборок

**Компонент:** `BuildComparison.tsx` (создать)

```tsx
<div className="comparison-view">
  <div className="comparison-column">
    <h3>Вариант 1: Игровой Минимум</h3>
    <BuildSummary config={config1} />
  </div>
  
  <div className="comparison-divider">
    <span>VS</span>
  </div>
  
  <div className="comparison-column">
    <h3>Вариант 2: Игровой Оптимум</h3>
    <BuildSummary config={config2} />
  </div>
</div>

<table className="comparison-table">
  <thead>
    <tr>
      <th>Компонент</th>
      <th>Вариант 1</th>
      <th>Вариант 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Процессор</td>
      <td>Ryzen 5 5600</td>
      <td>Ryzen 7 7700X</td>
    </tr>
    <tr>
      <td>Видеокарта</td>
      <td>RX 6600</td>
      <td>RTX 4060 Ti</td>
    </tr>
    <!-- ... -->
    <tr className="total-row">
      <td>Итого</td>
      <td>1,500 BYN</td>
      <td>2,950 BYN</td>
    </tr>
  </tbody>
</table>
```

---

## 🚀 Deployment и Production Readiness

### Требования к Production

1. **Backend:**
   - ✅ Все endpoints реализованы и протестированы
   - ✅ Валидация входных данных
   - ✅ Обработка ошибок (try-catch, logging)
   - ✅ Rate limiting (предотвращение спама)
   - ✅ Кэширование (Redis) для списков совместимых компонентов

2. **Frontend:**
   - ✅ Полное покрытие тестами (Unit + E2E)
   - ✅ Обработка ошибок сети (retry, fallback)
   - ✅ Loading states (скелетоны, спиннеры)
   - ✅ Accessibility (ARIA labels, keyboard navigation)
   - ✅ Performance (lazy loading, code splitting)

3. **Database:**
   - ✅ Миграции для новых таблиц
   - ✅ Индексы на ключевые поля
   - ✅ Seeding тестовых данных

4. **Мониторинг:**
   - ✅ Логирование ошибок (Serilog + SEQ)
   - ✅ Метрики производительности (Application Insights)
   - ✅ Алерты при критических ошибках

### Deployment Checklist

```markdown
## Pre-Deployment

- [ ] Все тесты зелёные (Unit + Integration + E2E)
- [ ] Code Review пройден
- [ ] Миграции базы данных подготовлены
- [ ] Environment variables настроены (Production)
- [ ] Secrets и API keys в Azure Key Vault

## Deployment

- [ ] Backend: деплой PCBuilderService в Azure App Service
- [ ] Frontend: деплой обновлённого React build
- [ ] Database: запуск миграций
- [ ] Redis: проверка подключения

## Post-Deployment

- [ ] Smoke tests (основные сценарии работают)
- [ ] Проверка логов (нет критических ошибок)
- [ ] Мониторинг метрик (response time, error rate)
- [ ] User Acceptance Testing (UAT)

## Rollback Plan

Если возникли критические проблемы:

1. Откатить frontend build на предыдущую версию
2. Откатить backend деплой
3. Откатить миграции базы данных (если возможно)
4. Уведомить команду и пользователей
```

---

## 📖 Документация

### README для разработчиков

**Создать:** `docs/pc-builder/README.md`

```markdown
# PC Builder Module - Developer Guide

## Overview

PC Builder позволяет пользователям собирать ПК с проверкой совместимости.

## Architecture

- **Frontend:** React + TypeScript, хук `usePCBuilder`
- **Backend:** .NET 8, `PCBuilderService`
- **Database:** PostgreSQL, таблица `PCConfigurations`

## Quick Start

### 1. Локальный запуск

```bash
# Backend
cd src/PCBuilderService
dotnet run

# Frontend
cd src/frontend
npm run dev
```

### 2. Запуск тестов

```bash
# Unit tests
dotnet test

# E2E tests
npm run test:e2e
```

## Components

### Frontend

- `PCBuilderPage.tsx` - Главная страница
- `ComponentSlot.tsx` - Слот для компонента
- `BuildSummaryPanel.tsx` - Правая панель сводки
- `usePCBuilder.ts` - Основной хук

### Backend

- `PCBuilderController.cs` - REST API
- `CompatibilityService.cs` - Логика проверки совместимости
- `ConfigurationService.cs` - Сохранение/загрузка конфигураций

## API Endpoints

| Method | Endpoint                             | Description                |
|--------|--------------------------------------|----------------------------|
| POST   | /api/v1/pcbuilder/check-compatibility| Проверка совместимости     |
| POST   | /api/v1/pcbuilder/configurations     | Сохранение конфигурации    |
| GET    | /api/v1/pcbuilder/configurations     | Список конфигураций        |
| GET    | /api/v1/pcbuilder/share/{token}      | Открыть шаренную сборку    |

## Testing

См. `docs/pc-builder/TESTING.md`

## Troubleshooting

**Проблема:** Компоненты не показываются как несовместимые

**Решение:** Проверьте, что в спецификациях есть поля `socket`, `memoryType` и т.д.

---

**Проблема:** Медленная загрузка списка компонентов

**Решение:** Используйте Redis кэширование для списков совместимых товаров.
```

### API Документация (Swagger)

**Уже есть:** OpenAPI спецификация в `contracts/openapi/v1/components/schemas/pcbuilder.yaml`

**Дополнить:**
- Примеры запросов/ответов для каждого endpoint
- Описания кодов ошибок
- Примеры использования

### Storybook для компонентов

**Создать:** `src/frontend/src/components/pc-builder/*.stories.tsx`

```tsx
// ComponentSlot.stories.tsx

export default {
  title: 'PC Builder/ComponentSlot',
  component: ComponentSlot,
};

export const Empty = () => (
  <ComponentSlot
    type="Процессор"
    name="Выберите компонент"
    price={null}
    state="empty"
    icon={<CpuIcon />}
    specs={[]}
    onSelect={() => alert('Select clicked')}
  />
);

export const Selected = () => (
  <ComponentSlot
    type="Процессор"
    name="AMD Ryzen 7 7800X3D"
    price={1899}
    state="selected"
    icon={<CpuIcon />}
    specs={['AM5', '8C/16T', '5.0GHz']}
    onSelect={() => alert('Change clicked')}
  />
);

export const Incompatible = () => (
  <ComponentSlot
    type="Материнская плата"
    name="ASUS TUF B550-PLUS"
    price={799}
    state="incompatible"
    icon={<MotherboardIcon />}
    specs={['AM4', 'DDR4']}
    warning="Несовместимый сокет: AM4 vs AM5"
    onSelect={() => alert('Change clicked')}
  />
);
```

---

## 🎨 Финальные Детали UI/UX

### Помощь пользователю

**НЕ ДОБАВЛЯТЬ:**
- Tooltips
- Guided tours
- Help buttons

**Почему:** UI должен быть интуитивно понятным без подсказок.

### Accessibility

```tsx
// Примеры ARIA attributes

<button
  data-testid="add-to-cart-button"
  disabled={!isCompatible || selectedCount === 0}
  aria-label="Добавить сборку в корзину"
  aria-disabled={!isCompatible}
>
  Добавить в корзину
</button>

<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {isCompatible ? 'Совместимо' : 'Есть проблемы'}
</div>
```

### Mobile Fallback

**Допустимо:**
- Упрощённая навигация (стек вместо split-screen)
- Скрытые детали производительности
- Увеличенные кнопки

**Приоритет:** Desktop experience

---

## ✅ Definition of Done

### Фича считается завершённой, когда:

- [x] **Backend:**
  - [x] Все endpoints реализованы
  - [x] Unit tests покрывают 80%+ кода
  - [x] Integration tests для критических сценариев
  - [x] Миграции базы данных созданы
  - [x] API документация (Swagger) обновлена

- [x] **Frontend:**
  - [x] Все компоненты реализованы и работают
  - [x] Unit tests для хуков и утилит
  - [x] E2E tests для всех основных сценариев
  - [x] Storybook для всех компонентов
  - [x] Responsive design (минимум tablet)

- [x] **Тестирование:**
  - [x] Все edge cases покрыты тестами
  - [x] E2E отчёт сгенерирован (Markdown)
  - [x] Manual testing выполнен
  - [x] Все найденные баги исправлены

- [x] **Документация:**
  - [x] README для разработчиков
  - [x] API документация
  - [x] Архитектурная диаграмма
  - [x] Troubleshooting guide

- [x] **Production:**
  - [x] Code review пройден
  - [x] Performance профилирование (< 500ms для основных операций)
  - [x] Deployment checklist выполнен
  - [x] Мониторинг настроен

---

## 🔄 Итеративный Процесс Разработки

### Фазы

**1. Discovery (1-2 дня)**
- ✅ Изучение требований
- ✅ Дизайн API
- ✅ Прототипирование UI

**2. Implementation (5-7 дней)**
- Backend: CompatibilityService + endpoints
- Frontend: PCBuilderPage + компоненты
- Database: миграции + seed данные

**3. Testing (3-4 дня)**
- Unit tests
- Integration tests
- E2E tests
- Генерация отчётов

**4. Iteration (2-3 дня)**
- Исправление багов по отчётам
- Ретесты
- Performance optimization

**5. Documentation (1 день)**
- README
- API docs
- Storybook

**6. Review & Deploy (1 день)**
- Code review
- Deployment
- Smoke tests

**Общая оценка:** ~2 недели (10-15 рабочих дней)

---

## 📝 Kanban Board Structure

### Колонки

```
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│   Backlog   │   To Do     │ In Progress │   Testing   │    Done     │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ • Wizard    │ • Backend   │ • Frontend  │ • E2E tests │ • Docs      │
│ • Templates │   API       │   UI        │ • Bug fixes │             │
│ • Sharing   │ • DB schema │ • Hooks     │             │             │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

### Пример Задач

**Epic:** PC Builder Implementation

**Stories:**

1. **Backend - Compatibility Service**
   - Реализовать CompatibilityService
   - Добавить endpoints для проверки
   - Написать unit tests
   - **Acceptance Criteria:**
     - [ ] Проверка CPU-Motherboard socket
     - [ ] Проверка RAM-Motherboard type
     - [ ] Расчёт мощности PSU
     - [ ] API возвращает детальные ошибки

2. **Frontend - Component Slots**
   - Создать ComponentSlot компонент
   - Добавить inline badges для ошибок
   - Интегрировать с usePCBuilder hook
   - **Acceptance Criteria:**
     - [ ] Отображение пустого/заполненного/несовместимого состояния
     - [ ] Миниатюры товаров в белой рамке
     - [ ] Анимации при смене состояния

3. **E2E Tests - Compatibility Scenarios**
   - Тест: несовместимые CPU-Motherboard
   - Тест: недостаточная мощность PSU
   - Тест: bottleneck detection
   - **Acceptance Criteria:**
     - [ ] Все тесты проходят
     - [ ] Отчёт в Markdown сгенерирован
     - [ ] Скриншоты сохранены

4. **Documentation - Developer Guide**
   - Написать README
   - Обновить API docs
   - Создать Storybook stories
   - **Acceptance Criteria:**
     - [ ] README покрывает все основные концепции
     - [ ] API docs с примерами
     - [ ] Все компоненты в Storybook

---

## 🎬 Заключение

Этот промпт содержит **максимально детальное** описание реализации PC Builder для GoldPC:

- ✅ **Архитектура:** Split-screen layout, компоненты, хуки
- ✅ **Дизайн:** Цветовая схема (БЕЗ ЗЕЛЁНОГО), стили, анимации
- ✅ **Логика:** Проверка совместимости (8 правил), расчёты производительности
- ✅ **Backend:** API endpoints, database schema, CompatibilityService
- ✅ **Frontend:** React компоненты, hooks, интеграция с каталогом
- ✅ **Тестирование:** Unit + Integration + E2E тесты, отчёты в Markdown
- ✅ **Готовые сборки:** Wizard, шаблоны по назначению и бюджету
- ✅ **Сохранение:** LocalStorage + облако + шаринг
- ✅ **Производительность:** Benchmarks, метрики, оптимизация
- ✅ **Документация:** README, API docs, Storybook
- ✅ **Production:** Deployment checklist, мониторинг, rollback plan

### Следующие Шаги

1. **Начать разработку** с Backend (CompatibilityService + endpoints)
2. **Параллельно** работать над Frontend (PCBuilderPage + компоненты)
3. **Писать тесты** по мере разработки (TDD approach)
4. **Генерировать отчёты** после каждого цикла E2E тестов
5. **Итерировать** по отчётам до достижения 100% зелёных тестов
6. **Задокументировать** всё в README + Storybook
7. **Деплоить** в production

---

**Версия:** 1.0  
**Дата:** 2026-04-01  
**Автор:** Goldie Developer  
**Статус:** ✅ Готов к разработке

---

**Примечания:**

- Все примеры кода приведены в качестве референса, адаптируйте под ваш стиль кодирования
- Спецификации товаров должны быть заполнены в реальном каталоге
- Performance scores - примерные, основаны на известных benchmark данных
- E2E тесты требуют запущенный backend и заполненную базу данных

**Удачи с реализацией! 🚀**
