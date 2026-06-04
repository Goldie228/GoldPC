# Задача: Фильтры не появляются при выборе категории в каталоге

> **Приоритет:** High  
> **Статус:** Открыта  
> **Симптом:** При выборе категории товара (например, "Накопители", "Корпуса", "Охлаждение", "Мониторы") фильтры не отображаются — блок спецификаций пустой

---

## Диагноз

Проблема комплексная, 3 независимые причины:

### 🔴 Причина 1 (CRITICAL): Нет seed-продуктов для 8 из 13 категорий

**Файл:** `src/CatalogService/Data/CatalogDbContext.cs` (строки 536–765)

Seed-данные содержат продукты ТОЛЬКО для:
- `processors` (CPU) — 3 продукта ✅
- `motherboards` — 2 продукта ✅
- `ram` — 2 продукта ✅
- `gpu` — 2 продукта ✅
- `psu` — 3 продукта ✅

Категории **БЕЗ продуктов** (фильтры не появятся):
- ❌ `storage` (Накопители)
- ❌ `cases` (Корпуса)
- ❌ `coolers` (Охлаждение)
- ❌ `monitors` (Мониторы)
- ❌ `keyboards` (Клавиатуры)
- ❌ `mice` (Мыши)
- ❌ `headphones` (Наушники)
- ❌ `periphery` (Периферия — нет маппинга из фронтенда)

**Почему:** Backend вызывает `GetDistinctSpecificationValuesAsync()` → если нет продуктов с характеристиками → возвращает пустой массив → `allValues.Count == 0` → `continue` → фильтры не рендерятся.

**Исправление:** Добавить 2-3 seed-продукта с `ProductSpecificationValue` для каждой пустой категории в `CatalogDbContext.cs`.

---

### 🟡 Причина 2 (HIGH): SPEC_ORDER ключи не совпадают с бэкендом

**Файл:** `src/frontend/src/components/filter-sidebar/FilterSidebar.tsx` (строки 76–119)

Фронтенд использует **русские названия** ключей атрибутов (например, `videopamyat`), а бэкенд — **английские** (`vram`).

| Категория | Backend AttributeKey | Frontend SPEC_ORDER key | Совпадает? |
|-----------|---------------------|------------------------|------------|
| GPU | `vram`, `gpu` | `videopamyat`, `graficheskiy_protsessor` | ❌ |
| CPU | `socket`, `cores`, `threads`, `integrated_graphics`, `tdp` | `socket`, `cores` — совпадают, `integrated_graphics`, `threads`, `tdp` — ДА, но `model_series`, `codename` — нет в бэкенде | ⚠️ Частично |
| Motherboard | `socket`, `chipset` | `socket`, `chipset`, `form_factor`, `memory_type`, `memory_slots`, `max_memory` | ⚠️ Частично |
| RAM | `memory_type`, `capacity` | `capacity`, `memory_type`, `type` | ✅ |
| Storage | `capacity`, `interface` | `capacity`, `form_factor`, `interface` | ⚠️ Частично |
| PSU | `wattage`, `efficiency` | `wattage`, `efficiency`, `form_factor`, `modular` | ⚠️ Частично |
| Cases | `form_factor`, `color` | `form_factor` | ⚠️ Частично |
| Coolers | `cooler_type`, `supported_sockets`, `max_tdp` | `cooler_type`, `socket`, `tdp` | ⚠️ Частично |
| Monitors | `diagonal`, `resolution`, `refresh_rate` | `diagonal`, `resolution`, `refresh_rate`, `type` | ⚠️ Частично |
| Keyboards | `type`, `interface`, `color` | `type`, `interface`, `color` | ✅ |
| Mice | `type`, `interface`, `dpi`, `sensor_type` | `type`, `interface`, `sensor_type`, `dpi` | ✅ |
| Headphones | `type`, `interface`, `color` | `type`, `form_factor`, `interface`, `color` | ⚠️ Частично |

**Последствие:** Даже если backend вернёт фильтры, они могут отображаться в неправильном порядке или с неправильными заголовками.

**Исправление:** Синхронизировать ключи в `SPEC_ORDER` и `ATTRIBUTE_LABELS` с реальными значениями `CategoryFilterAttribute.AttributeKey` из бэкенда.

---

### 🟠 Причина 3 (MEDIUM): Категория `fan` маппится на несуществующий `fans`

**Файлы:**
- `src/frontend/src/api/types.ts` — есть тип `ProductCategory = 'fan'`
- `src/frontend/src/components/filter-sidebar/FilterSidebar.tsx:65` — `FRONTEND_TO_BACKEND: fan → fans`
- `src/CatalogService/Data/CatalogDbContext.cs` — нет категории со slug `fans`

Ближайшая категория в бэкенде — `coolers` ("Системы охлаждения").

---

### 🔵 Причина 4 (LOW): Нет loading state при загрузке фильтров

**Файл:** `FilterSidebar.tsx:919`
```tsx
return false ? (  // ← Всегда false, скелетон никогда не показывается
```

Пользователь не видит индикатор загрузки при запросе фильтров.

---

## План исправления

### Шаг 1: Добавить seed-продукты для пустых категорий

**Файл:** `src/CatalogService/Data/CatalogDbContext.cs`

Добавить 2-3 продукта с характеристиками для каждой категории:
- `storage` — SSD 1TB NVMe, HDD 2TB
- `cases` — Корпус Mid-Tower, Mini-Tower  
- `coolers` — Кулер CPU, Воздушное охлаждение
- `monitors` — 27" IPS 1440p, 24" TN 1080p
- `keyboards` — Механическая, Мембранная
- `mice` — Игровая мышь 16000 DPI
- `headphones` — Наушники студийные

Для каждого продукта добавить `ProductSpecificationValue` с характеристиками, соответствующими `CategoryFilterAttribute`.

**Формат (пример для storage):**
```csharp
new Product
{
    Id = Guid.Parse("..."),
    Name = "SSD NVMe 1TB Samsung 990 Pro",
    Slug = "ssd-nvme-1tb-samsung-990-pro",
    CategoryId = storageCategoryId,
    ManufacturerId = samsungId,
    BasePrice = 199.99m,
    // ...
    SpecificationValues = new List<ProductSpecificationValue>
    {
        new() { AttributeKey = "capacity", CanonicalValue = "1 ТБ" },
        new() { AttributeKey = "interface", CanonicalValue = "NVMe M.2" },
    }
}
```

### Шаг 2: Синхронизировать SPEC_ORDER с бэкендом

**Файл:** `src/frontend/src/components/filter-sidebar/FilterSidebar.tsx`

Обновить `SPEC_ORDER` (строки 76–119) и `ATTRIBUTE_LABELS` (строки 121–165) чтобы ключи совпадали с `CategoryFilterAttribute.AttributeKey` из бэкенда.

Актуальные ключи из бэкенда (`CatalogDbContext.cs` строки ~420–482):

```typescript
// GPU
const GPU_SPEC_ORDER: SpecOrder = {
  gpu: ['gpu', 0],
  vram: ['vram', 1],
  dlina_videokarty: ['dlina_videokarty', 2],
  vysota_videokarty: ['vysota_videokarty', 3],
};

// CPU
const CPU_SPEC_ORDER: SpecOrder = {
  socket: ['socket', 0],
  cores: ['cores', 1],
  // ...
};

// и так далее для всех категорий
```

### Шаг 3: Добавить loading state для фильтров

**Файл:** `src/frontend/src/components/filter-sidebar/FilterSidebar.tsx`

Добавить состояние загрузки:
```tsx
const [facetsLoading, setFacetsLoading] = useState(false);
// setFacetsLoading(true) перед fetch, setFacetsLoading(false) после
```

Показывать skeleton вместо пустого блока:
```tsx
{facetsLoading ? (
  <div className="space-y-4 p-4">
    {[1,2,3].map(i => (
      <div key={i} className="h-12 bg-elevated rounded-lg animate-pulse" />
    ))}
  </div>
) : selectedCategory && filterFacets.length > 0 ? (
  // ... существующая логика
) : null}
```

### Шаг 4: Исправить маппинг `fan`

**Вариант A:** Удалить `fan` из `ProductCategory` и всех маппингов
**Вариант B:** Добавить категорию `fans` в бэкенд (предпочтительно)

---

## Критерии готовности

- [ ] `npm run build` проходит
- [ ] `dotnet build src/CatalogService/CatalogService.csproj` проходит
- [ ] При выборе категории "Процессоры" появляются фильтры: Socket, Cores, Threads, TDP
- [ ] При выборе категории "Видеокарты" появляются фильтры: GPU, VRAM
- [ ] При выборе категории "Накопители" появляются фильтры: Capacity, Interface
- [ ] При выборе любой категории с товарами отображаются соответствующие фильтры
- [ ] При загрузке фильтров показывается скелетон (не пустота)
- [ ] Категория "fan" корректно маппится

---

**Связанные файлы (полный список):**

| Файл | Роль |
|------|------|
| `src/frontend/src/components/filter-sidebar/FilterSidebar.tsx` | Основной файл для SPEC_ORDER, loading state, маппинга |
| `src/frontend/src/api/types.ts` | ProductCategory type definition |
| `src/frontend/src/api/catalog.ts` | getFilterFacets, getCategories API |
| `src/frontend/src/pages/catalog-page/CatalogPage.tsx` | Catalog page layout |
| `src/CatalogService/Data/CatalogDbContext.cs` | Seed data — добавить продукты для пустых категорий |
| `src/CatalogService/Services/CatalogService.cs` | GetFilterFacetsByCategoryAsync логика |
| `src/CatalogService/Controllers/ProductsController.cs` | API endpoint для filter-facets |
