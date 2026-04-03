# GoldPC — Архитектурный контекст

## О проекте
Интернет-магазин компьютерной техники, микросервисная архитектура.

## Стек
| Слой | Технологии |
|---|---|
| Backend | .NET 8, ASP.NET Core, микросервисы в `src/*Service/` |
| Frontend | React 18, TypeScript, Vite — `src/frontend/` |
| Данные | PostgreSQL 16, Redis, RabbitMQ |
| Инфра | Docker Compose (`docker/docker-compose.yml`), Kubernetes (`kubernetes/`) |
| Тесты | Vitest (frontend), xUnit/`dotnet test` (backend), Playwright (E2E) |

## Сервисы
| Сервис | Папка |
|---|---|
| Каталог | `src/CatalogService` |
| Конструктор ПК | `src/PCBuilderService` |
| Заказы | `src/OrdersService` |
| Аутентификация | `src/AuthService` |
| Сервисный центр | `src/ServicesService` |
| Гарантия | `src/WarrantyService` |
| Отчёты | `src/ReportingService` |

## Ключевые файлы
- Архитектура: `docs/architecture/README.md`
- Контракты: `contracts/`
- Локальный запуск: `scripts/dev-local.sh --tail`
- Решение: `src/GoldPC.sln`, `src/SharedKernel`

## Правила проекта
- ❌ Supabase НЕ используется
- ✅ Следовать существующим паттернам (стиль, структура, именование)
- ✅ Минимум комментариев — код самодокументируемый
- ✅ Секреты только в переменных окружения
- ✅ Все изменения покрываются тестами
- ✅ DRY, KISS, без feature creep

## Проверка после изменений
```bash
# Backend
dotnet test src/GoldPC.sln

# Frontend
npm run test
npm run lint

# Запуск всего стека
scripts/dev-local.sh --tail
```

## Как работаю
1. **Анализ** — определяю затронутые сервисы, зависимости, риски
2. **Декомпозиция** — разбиваю на атомарные задачи, делаю параллельно где возможно
3. **Реализация** — изменяю только то, что нужно; следую паттернам
4. **Верификация** — компиляция → тесты → линтеры → интеграция
5. **Отчёт** — что сделано, какие файлы, статус тестов, рекомендации
