# Исправление фасетных фильтров - Quick Start

## 🚀 Быстрый запуск миграций

### 1. Бэкап БД (ОБЯЗАТЕЛЬНО!)

```bash
pg_dump -h localhost -U postgres goldpc_catalog > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Запустить все миграции через API

```bash
# Получить admin token
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@goldpc.com","password":"YOUR_PASSWORD"}' | jq -r '.data.token')

# Запустить все миграции одной командой
curl -X POST http://localhost:5000/api/v1/admin/data/migrate/all \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq

# Ожидаемый ответ:
# {
#   "rangeOutliers": { "valid": 12500, "fixed": 234, "removed": 89 },
#   "leakedValues": { "valid": 5600, "removed": 1234 },
#   "duplicates": { "valid": 8900, "fixed": 567 },
#   "totalMessage": "All migrations completed successfully"
# }
```

### 3. Проверить результаты

```bash
# Проверить слайдеры (max_cooler_height должен быть ~36-250, а не 36-1805)
curl http://localhost:5000/api/v1/catalog/categories/cases/filter-facets | \
  jq '.data[] | select(.key == "max_cooler_height")'

# Проверить Terms-фильтры (efficiency должен иметь ~7 вариантов, а не 17)
curl http://localhost:5000/api/v1/catalog/categories/psu/filter-facets | \
  jq '.data[] | select(.key == "efficiency") | .options | length'
```

---

## 🔍 Что было исправлено

### Критичные проблемы (🔴 блокируют UX)

- ✅ Выбросы в слайдерах (1805 мм, 32003050 DPI, 10002 кд/м²)
- ✅ Percentile-based aggregation (99-й перцентиль вместо Max)
- ✅ Валидация Range-значений при импорте

### Высокий приоритет (🟠 неверные данные)

- ✅ Конвертация МГц → ГГц для частот процессоров
- ✅ Конвертация МБ → ГБ для видеопамяти
- ✅ Исправление ошибок парсинга чисел

### Средний приоритет (🟡 загрязнение)

- ✅ Фильтрация батареек из типа клавиатуры/мыши
- ✅ Фильтрация свитчей из типа клавиатуры
- ✅ Фильтрация яркости из типа монитора
- ✅ Фильтрация коннекторов из типа охлаждения

### Низкий приоритет (🟢 косметика)

- ✅ Объединение дубликатов (Mini-ITX vs miniITX)
- ✅ Нормализация локализаций (80+ Gold vs золотой)
- ✅ Сортировка составных значений (DDR4, DDR5 vs DDR5, DDR4)

---

## 📊 Автоматические исправления

**Все новые товары** автоматически:
- ✅ Валидируются при импорте
- ✅ Невалидные значения пропускаются с логированием
- ✅ Terms-значения нормализуются
- ✅ Leaked values фильтруются
- ✅ Единицы измерения конвертируются

**Не нужно** запускать миграции повторно после каждого импорта!

---

## 🆘 Если что-то пошло не так

### Откатить миграцию

```bash
# Восстановить бэкап
psql -h localhost -U postgres goldpc_catalog < backup_TIMESTAMP.sql

# Перезапустить сервис
docker-compose restart catalog-service
```

### Проверить логи

```bash
# Логи CatalogService
docker-compose logs -f catalog-service | grep -E "(Validation|Migration)"

# Или локально
tail -f ./src/CatalogService/logs/catalog-service-*.log | grep -E "(Validation|Migration)"
```

### Связаться с разработчиком

- Goldie Developer (Backend Lead)
- Slack: #goldpc-backend
- Email: goldie@goldpc.com

---

## 📚 Полная документация

- [`/docs/ФАСЕТНЫЕ_ФИЛЬТРЫ_ИСПРАВЛЕНИЯ.md`](./ФАСЕТНЫЕ_ФИЛЬТРЫ_ИСПРАВЛЕНИЯ.md) - Детальная документация
- [`/docs/ТЕХНИЧЕСКИЕ_ТАСКИ_ФИЛЬТРЫ.md`](./ТЕХНИЧЕСКИЕ_ТАСКИ_ФИЛЬТРЫ.md) - Технические таски для бэкендеров
- [`.cursor/plans/фикс_фасетных_фильтров_*.plan.md`](../.cursor/plans/) - План исправлений

---

## ⏱️ Timeline

- **30.03.2026, 12:32** - Аудит фильтров завершен
- **30.03.2026, 13:30** - Исправления реализованы
- **XX.XX.2026, XX:XX** - Миграции запущены на staging
- **XX.XX.2026, XX:XX** - Миграции запущены на production
