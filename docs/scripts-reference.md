# Scripts Reference — GoldPC

Документация скриптов проекта. Описание назначения и ценности каждого скрипта.

---

## KEEP — Критически важные

### `seed-all.sh`
**Назначение:** Единый скрипт "от скрапинга до данных в БД" — полный пайплайн.
**Что делает:**
1. Устанавливает зависимости скрапера (`npm install` в `scripts/scraper/`)
2. Парсит товары с x-core.by (`node index.mjs --all`)
3. Скачивает картинки товаров
4. Парсит характеристики из HTML
5. Копирует данные в `scripts/seed-data/catalog-seed.json`
6. Импортирует в БД через `dotnet run -- seed-catalog`
7. Backfill производителей, sync путей к картинкам, нормализация фильтров
8. Очистка невалидных товаров

**Использование:**
```bash
./scripts/seed-all.sh              # Полный цикл (скрапинг + seed)
./scripts/seed-all.sh --seed-only  # Только seed из уже скачанных данных
./scripts/seed-all.sh --slow       # Медленный режим (увеличенные таймауты)
```

**Флаг `--slow`:** Увеличивает задержку между запросами (100мс→800мс) и таймауты загрузки страниц (30сек→60сек). Для медленного интернета.

**Ценность:** Критическая — заменяет ручной запуск 10+ скриптов.

---

### `seed-users.sh`
**Назначение:** Создание всех тестовых пользователей напрямую в PostgreSQL.
**Что делает:** Вставляет 5 пользователей (admin, manager, master, accountant, client) через SQL `INSERT ... ON CONFLICT DO NOTHING`. Обходит rate limiter AuthService.

| Email | Пароль | Роль |
|-------|--------|------|
| admin@goldpc.by | G0ldPC#Adm1n2026! | Admin |
| manager@goldpc.by | Test1234! | Manager |
| master@goldpc.by | Test1234! | Master |
| accountant@goldpc.by | Test1234! | Accountant |
| client@goldpc.by | Test1234! | Client |

**Использование:**
```bash
bash scripts/seed-data/seed-users.sh
```

**Ценность:** Критическая — единственный способ войти в систему. Вызывается из `dev-local.sh`.

---

### `start-dev.sh`
**Назначение:** Основной скрипт запуска окружения разработки.
**Что делает:**
- Запускает Docker-контейнеры (PostgreSQL, Redis, backend-сервисы, frontend)
- Поддерживает флаги: `--infra-only`, `--backend-only`, `--frontend-only`, `--skip-build`, `--detach`, `--logs`, `--clean`, `--reset-db`
- Проверяет здоровье сервисов после запуска
- Выводит список доступных эндпоинтов

**Использование:**
```bash
./scripts/start-dev.sh              # Запуск всего
./scripts/start-dev.sh --backend-only  # Только бэкенд
./scripts/start-dev.sh --clean        # Очистка перед запуском
```

**Ценность:** Высокая — основной инструмент разработчика, прописан в `AGENTS.md`.

---

### `sync-compatibility-rules.mjs`
**Назначение:** Синхронизация правил совместимости PC Builder между бэкендом и фронтендом.
**Что делает:**
- Читает `src/PCBuilderService/Data/compatibility-rules.json` (бэкенд)
- Обновляет `src/frontend/src/config/compatibilityRules.json` (фронтенд)
- Удаляет дубликаты в массивах (например, повторяющиеся группы сокетов)

**Использование:**
```bash
node scripts/sync-compatibility-rules.mjs
```

**Ценность:** Критическая — устраняет рассинхрон правил совместимости, исправляет BUG-21.

---

### `specs/generateSpecLabels.ts`
**Назначение:** Генерация человекочитаемых названий характеристик для фронтенда.
**Что делает:**
- Парсит сиды из `src/CatalogService/Data/CatalogDbContext.cs`
- Читает фильтры из `scripts/scraper/config/xcore-filter-attributes.json` и `scripts/scraper/data/all-filters-dump.json`
- Собирает статистику из `scripts/scraper/data/xcore-products.json`
- Генерирует `src/frontend/src/utils/specLabels.generated.ts`

**Использование:**
```bash
npx tsx scripts/specs/generateSpecLabels.ts
```

**Ценность:** Высокая — используется при сборке фронтенда для отображения названий характеристик.

---

## REVIEW — Требуют проверки

### `run-filter-migrations.sh`
**Назначение:** Запуск миграций фасетных фильтров каталога.
**Что делает:**
- Выполняет последовательные миграции через API CatalogService:
  1. Пересчёт частот процессоров (МГц → ГГц)
  2. Пересчёт видеопамяти (ГБ → МБ)
  3. Удаление leaked values
  4. Нормализация дубликатов
- Требует токен администратора (`ADMIN_TOKEN`)

**Использование:**
```bash
ADMIN_TOKEN=your_token ./scripts/run-filter-migrations.sh
```

**Статус:** Требует проверки — нужно убедиться, что миграции уже выполнены или всё ещё актуальны.

---

### `validate-all-dependencies.js`
**Назначение:** Проверка существования всех NPM и NuGet пакетов в реестрах.
**Что делает:**
- Рекурсивно ищет все `package.json` и `.csproj` файлы
- Проверяет каждую зависимость через registry.npmjs.org и api.nuget.org
- Выявляет "галлюцинации" ИИ — несуществующие пакеты
- Поддерживает флаги: `--verbose`, `--json`, `--quiet`

**Использование:**
```bash
node scripts/validate-all-dependencies.js
node scripts/validate-all-dependencies.js --verbose
```

**Статус:** Полезный аудиторский инструмент, но не критичен для работы проекта.

---

### `dump-all-filters.mjs`
**Назначение:** Сбор всех фильтров каталога в один файл для аудита.
**Что делает:**
- Обходит все категории (processors, gpu, motherboards, ram, storage, psu, cases, coolers, monitors, keyboards, mice, headphones)
- Сохраняет результат в `scripts/scraper/data/all-filters-dump.json`
- Генерирует Markdown-отчёт с подозрительными значениями

**Использование:**
```bash
node scripts/dump-all-filters.mjs
node scripts/dump-all-filters.mjs --url http://localhost:5000
```

**Статус:** Полезно для аудита качества данных каталога.

---

### `filter-audit/`
**Назначение:** Аудит структуры фильтров каталога.
**Что делает:**
- `generate-filters-report.ts` — генерирует полный отчёт по всем фильтрам в Markdown
- `filter-audit-api.mjs` / `filter-audit.mjs` — дополнительные скрипты аудита
- `README.md` — документация модуля

**Использование:**
```bash
npm run filter-audit
# или
npx tsx scripts/filter-audit/generate-filters-report.ts
```

**Статус:** Полезно для поддержания качества каталога.

---

### `scraper/`
**Назначение:** Сбор данных о товарах с XCore (или других источников).
**Что делает:**
- `index.mjs` — основной скрапер
- `fetch-xcore-filters.mjs` — сбор фильтров
- `fetch-product-images.mjs` — скачивание изображений
- `download-images.mjs` — загрузка картинок
- `config/xcore-spec-mappings.json` — маппинг характеристик
- `config/xcore-filter-attributes.json` — атрибуты фильтров
- `data/xcore-products.json` — собранные товары
- `data/all-filters-dump.json` — дамп всех фильтров
- `data/sample-products.json` — примеры товаров

**Использование:**
```bash
cd scripts/scraper && npm install
node index.mjs
```

**Статус:** Данные уже собраны. Скрапер может понадобиться для обновления каталога.

---

### `scripts/db/`
**Назначение:** Скрипты для работы с базой данных.
**Что делает:**
- `setup-partitioning.sql` — настройка партиционирования таблиц
- `migrate.sh` — запуск миграций БД

**Использование:**
```bash
./scripts/db/migrate.sh
psql -U postgres -d goldpc -f scripts/db/setup-partitioning.sql
```

**Статус:** Важно для работы с БД, нужно проверить актуальность.

---

## Удалённые скрипты

Следующие скрипты были удалены как неактуальные для дипломного проекта:

| Скрипт | Причина удаления |
|--------|-------------------|
| `sync-workspace.sh` | Для параллельной разработки множества ИИ-агентов |
| `setup-worktrees.sh` | Для создания git worktrees под многопользовательскую разработку |
| `clean-worktrees.sh` | Парный к `setup-worktrees.sh` |
| `setup-git-secrets.sh` | Инструмент безопасности, не критичен для диплома |
| `run-mutation-tests.sh` | Mutation testing через Stryker.NET, избыточно |
| `check-lighthouse-budgets.js` | Проверка производительности Lighthouse, не критично |
| `check-docker.sh` | Простая проверка Docker-окружения |
| `agent-status.sh` | Статус агента для координации ИИ-разработки |
| `neuroslop-check.js` | Детектор ИИ-сгенерированного мусора |
| `mcp_microservices_api.py` | Экспериментальный MCP-сервер |
| `check-all-pages.mjs` | Дублирует E2E тесты в `tests/e2e/` |
| `stryker-config.json` | Конфиг для удалённого `run-mutation-tests.sh` |

---

*Документация обновлена: 2026-04-30*
