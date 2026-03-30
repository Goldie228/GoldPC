# Руководство по миграции фасетных фильтров

Данное руководство описывает процесс исправления фасетных фильтров на основе UX-аудита.

## Что было исправлено

### 1. 🔴 Физическая невозможность (Range Parsing)

#### ✅ `monitors.brightness` (яркость мониторов)
- **Было**: диапазон 2002–10002 кд/м² (склеенные числа)
- **Стало**: корректный парсинг с делением на 10 (2002 → 200, 10002 → 1000)
- **Файл**: `src/CatalogService/Services/SpecificationValidation.cs`

#### ✅ `processors.base_freq` и `max_freq` (частоты процессоров)
- **Было**: смешаны ГГц и МГц (диапазон 1.5–4000 ГГц)
- **Стало**: всё в ГГц, миграция пересчитывает МГц → ГГц
- **Файл**: `src/CatalogService/Services/SpecificationValidation.cs`

#### ✅ `gpu.videopamyat` (видеопамять)
- **Было**: диапазон 0.00–0.05 ГБ (ошибка конвертации)
- **Стало**: хранение в МБ (базовая единица), конвертация в ГБ при выводе в UI
- **Файлы**: 
  - `src/CatalogService/Services/SpecificationValidation.cs` (парсинг)
  - `src/CatalogService/Services/CatalogService.cs` (конвертация для UI)

---

### 2. 🟠 Утечка значений (Field Routing / Leaked Values)

#### ✅ `keyboards.type` — батарейки, свитчи, форм-факторы
- **Было**: в один фильтр утекли батарейки (2 x AAA), свитчи (Razer Green), форм-факторы (60%)
- **Стало**: фильтруются при импорте

#### ✅ `mice.type` — батарейки, интерфейсы, описания кнопок
- **Было**: утечка батареек, интерфейсов (Bluetooth), длинных описаний кнопок
- **Стало**: фильтруются при импорте

#### ✅ `headphones.type` — крепление микрофона
- **Было**: вместо типа наушников — крепления микрофона (гибкий держатель)
- **Стало**: фильтруются при импорте

#### ✅ `ram.type` — организация чипов
- **Было**: утечка технических параметров (1Gx16, 512Mx16)
- **Стало**: фильтруются при импорте

#### ✅ `cases.form_factor` — размеры и форм-факторы БП
- **Было**: утечка физических размеров (12" x 13") и форм-факторов БП (SFX, TFX)
- **Стало**: фильтруются при импорте

**Файл**: `src/CatalogService/Services/SpecImportNormalizer.cs` (метод `ShouldSkipValue()`)

---

### 3. 🟡 Мусорные агрегации (Terms Dictionary / Alias Mapping)

#### ✅ `psu.efficiency` — булевы значения и синонимы
- **Было**: 17 вариантов (false, true, 72%, 80+ Gold, золотой)
- **Стало**: 7 нормализованных значений (нет сертификата, 80+ standard, 80+ bronze, 80+ silver, 80+ gold, 80+ platinum, 80+ titanium)

#### ✅ `psu.modular` — булевы + синонимы
- **Было**: 8 вариантов (false, true, Full, модульный, полностью модульное)
- **Стало**: 3 нормализованных значения (немодульный, полностью модульный, полумодульный)

#### ✅ `motherboards.form_factor` и `cases.form_factor` — дубликаты
- **Было**: Mini-ITX и miniITX, Flex ATX и FlexATX
- **Стало**: унифицированные значения (mini-itx, flex-atx)

**Файл**: `src/CatalogService/Services/SpecImportNormalizer.cs` (метод `NormalizeForLookup()`)

---

## Миграции данных

Созданы новые миграции для пересчёта уже импортированных данных:

1. **RecalculateProcessorFrequenciesAsync()** — пересчёт частот процессоров из МГц в ГГц
2. **RecalculateVideoMemoryAsync()** — пересчёт видеопамяти из ГБ в МБ
3. **RemoveLeakedValuesAsync()** — удаление утекших значений (уже была)
4. **NormalizeDuplicatesAsync()** — объединение дубликатов (уже была)

**Файл**: `src/CatalogService/Services/SpecificationDataMigration.cs`

---

## Запуск миграций

### Вариант 1: Автоматический скрипт (рекомендуется)

```bash
# 1. Запустите сервисы (если ещё не запущены)
./scripts/dev-local.sh --tail

# 2. Получите токен администратора
# (токен можно получить через логин в UI или напрямую из базы)

# 3. Запустите миграции
export ADMIN_TOKEN="your_admin_token_here"
./scripts/run-filter-migrations.sh
```

### Вариант 2: Ручные API-вызовы

```bash
API="http://localhost:5000"
TOKEN="your_admin_token"

# 1. Пересчитать частоты процессоров
curl -X POST "$API/api/v1/admin/data/migrate/recalculate-frequencies" \
  -H "Authorization: Bearer $TOKEN"

# 2. Пересчитать видеопамять
curl -X POST "$API/api/v1/admin/data/migrate/recalculate-vram" \
  -H "Authorization: Bearer $TOKEN"

# 3. Удалить leaked values
curl -X POST "$API/api/v1/admin/data/migrate/remove-leaked-values" \
  -H "Authorization: Bearer $TOKEN"

# 4. Нормализовать дубликаты
curl -X POST "$API/api/v1/admin/data/migrate/normalize-duplicates" \
  -H "Authorization: Bearer $TOKEN"
```

### Вариант 3: Все миграции разом

```bash
curl -X POST "$API/api/v1/admin/data/migrate/all" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Проверка результатов

### 1. Проверка через API

Проверьте диапазоны фильтров для проблемных категорий:

```bash
# Мониторы (brightness)
curl "$API/api/v1/catalog/categories/monitors/filter-facets" | jq '.data[] | select(.key == "brightness")'

# Процессоры (base_freq, max_freq)
curl "$API/api/v1/catalog/categories/processors/filter-facets" | jq '.data[] | select(.key == "base_freq" or .key == "max_freq")'

# Видеокарты (videopamyat)
curl "$API/api/v1/catalog/categories/gpu/filter-facets" | jq '.data[] | select(.key == "videopamyat")'

# БП (efficiency, modular)
curl "$API/api/v1/catalog/categories/psu/filter-facets" | jq '.data[] | select(.key == "efficiency" or .key == "modular")'
```

### 2. Запуск аудита фильтров

```bash
cd scripts/filter-audit
npm run audit
```

Сравните новый отчёт с предыдущим (из `out/filters-report-20260330-140258.md`):

- ✅ `monitors.brightness`: диапазон должен быть ~200–1000 кд/м²
- ✅ `processors.base_freq`: диапазон ~1.5–5.5 ГГц
- ✅ `processors.max_freq`: диапазон ~3.0–6.0 ГГц
- ✅ `gpu.videopamyat`: диапазон ~1–48 ГБ (вместо 0.00–0.05)
- ✅ `psu.efficiency`: 7 нормализованных значений (вместо 17)
- ✅ `psu.modular`: 3 нормализованных значения (вместо 8)
- ✅ `keyboards.type`, `mice.type`, `headphones.type`: нет утекших значений

---

## Откат миграций (если нужно)

Миграции модифицируют данные в базе. Если что-то пошло не так:

```bash
# 1. Восстановите базу из бэкапа
psql -U postgres -d goldpc_catalog < backup_20260330.sql

# 2. Перезапустите сервисы
./scripts/dev-local.sh --restart
```

Регулярно создавайте бэкапы перед миграциями:

```bash
pg_dump -U postgres -d goldpc_catalog > backup_$(date +%Y%m%d).sql
```

---

## Влияние на новые импорты

После применения исправлений все новые импорты будут автоматически нормализоваться:

- ✅ Частоты в МГц автоматически конвертируются в ГГц
- ✅ Видеопамять хранится в МБ, конвертируется в ГБ при выводе
- ✅ Яркость > 2000 автоматически исправляется (деление на 10)
- ✅ Leaked values автоматически пропускаются
- ✅ Синонимы автоматически маппятся на канонические значения

---

## FAQ

### Q: Нужно ли запускать миграции повторно?

**A**: Нет, миграции идемпотентны, но повторный запуск не навредит (просто вернут "0 fixed").

### Q: Можно ли запустить только одну миграцию?

**A**: Да, используйте отдельные эндпоинты (`recalculate-frequencies`, `recalculate-vram`, и т.д.)

### Q: Что делать, если миграция вернула ошибку?

**A**: Проверьте логи CatalogService в терминале. Возможные причины:
- База данных недоступна
- Нет прав администратора (401)
- Некорректные данные в базе (проверьте логи миграции)

### Q: Как проверить, что видеопамять корректно конвертируется в UI?

**A**: 
```bash
curl "http://localhost:5000/api/v1/catalog/categories/gpu/filter-facets" | jq '.data[] | select(.key == "videopamyat")'
```

Должно вернуть:
```json
{
  "key": "videopamyat",
  "displayName": "Видеопамять, ГБ",
  "filterType": "range",
  "minValue": 1.0,    // Было 0.001 МБ → стало 1 ГБ
  "maxValue": 48.0    // Было 0.048 МБ → стало 48 ГБ
}
```

---

## Поддержка

Если возникли проблемы:

1. Проверьте логи миграций в терминале CatalogService
2. Запустите аудит фильтров для диагностики
3. Создайте issue с описанием проблемы и логами
