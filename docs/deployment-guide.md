# Руководство по развертыванию GoldPC

## 📋 Обзор документа

**Версия:** 1.0  
**Последнее обновление:** Март 2026  
**Ответственные:** DevOps Team, TIER-1 Архитектор

Данный документ представляет собой комплексное руководство по развертыванию системы GoldPC в production-окружении. Содержит стратегии деплоя, процедуры ручного развертывания, управление секретами и стратегии отката.

---

## Содержание

1. [Архитектура развертывания](#1-архитектура-развертывания)
2. [Стратегии развертывания](#2-стратегии-развертывания)
3. [Чеклист ручного развертывания](#3-чеклист-ручного-развертывания)
4. [Управление секретами](#4-управление-секретами)
5. [Стратегия отката (Rollback Strategy)](#5-стратегия-отката-rollback-strategy)
6. [Мониторинг и алерты](#6-мониторинг-и-алерты)
7. [Процедуры восстановления](#7-процедуры-восстановления)

---

## 1. Архитектура развертывания

### 1.1 Общая схема инфраструктуры

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PRODUCTION                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    ┌──────────────┐                                                          │
│    │    CDN       │  ← Статические assets (JS, CSS, изображения)            │
│    └──────┬───────┘                                                          │
│           │                                                                  │
│    ┌──────▼───────┐                                                          │
│    │ Load Balancer│  ← Nginx / Cloud LB (SSL termination)                   │
│    │   (Nginx)    │                                                          │
│    └──────┬───────┘                                                          │
│           │                                                                  │
│    ┌──────▼───────────────────────────────────────────────────┐             │
│    │                    Blue-Green Switch                     │             │
│    │  ┌─────────────────────┐   ┌─────────────────────┐      │             │
│    │  │   Blue Environment  │   │  Green Environment  │      │             │
│    │  │   (Current: v1.0)   │   │   (New: v1.1)       │      │             │
│    │  │                     │   │                     │      │             │
│    │  │ ┌─────┐ ┌─────┐    │   │ ┌─────┐ ┌─────┐    │      │             │
│    │  │ │API-1│ │API-2│    │   │ │API-1│ │API-2│    │      │             │
│    │  │ └─────┘ └─────┘    │   │ └─────┘ └─────┘    │      │             │
│    │  │ ┌───────────────┐  │   │ ┌───────────────┐  │      │             │
│    │  │ │   Frontend    │  │   │ │   Frontend    │  │      │             │
│    │  │ └───────────────┘  │   │ └───────────────┘  │      │             │
│    │  └─────────────────────┘   └─────────────────────┘      │             │
│    └──────────────────────────────────────────────────────────┘             │
│                              │                                              │
│    ┌─────────────────────────▼───────────────────────────────┐             │
│    │                   Data Layer                             │             │
│    │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   │             │
│    │  │ PostgreSQL  │   │    Redis    │   │   Vault     │   │             │
│    │  │  (Primary)  │   │   (Cache)   │   │  (Secrets)  │   │             │
│    │  └─────────────┘   └─────────────┘   └─────────────┘   │             │
│    └─────────────────────────────────────────────────────────┘             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Компоненты системы

| Сервис | Порт | Описание | Реплики |
|--------|------|----------|---------|
| `frontend` | 3000 | React SPA (Nginx) | 1-2 |
| `catalogservice` | 5001 | Каталог компонентов | 2+ |
| `pcbuilderservice` | 5002 | Конфигуратор ПК | 2+ |
| `authservice` | 5003 | Аутентификация JWT | 2+ |
| `ordersservice` | 5004 | Управление заказами | 2+ |
| `postgres` | 5432 | PostgreSQL 16 | 1 (primary) |
| `redis` | 6379 | Redis 7 (кэш, сессии) | 1 |

### 1.3 Микросервисная архитектура

```
                    ┌─────────────────┐
                    │   Frontend      │
                    │   (React SPA)   │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Auth Service   │ │ Catalog Service │ │  PC Builder     │
│   :5003         │ │   :5001         │ │  Service :5002  │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                    ┌────────▼────────┐
                    │   PostgreSQL    │
                    │   + Redis       │
                    └─────────────────┘
```

---

## 2. Стратегии развертывания

### 2.1 Blue-Green Deployment

**Описание:** Две идентичные production-среды (Blue и Green). В любой момент времени одна активна, вторая — для нового деплоя.

#### Преимущества
- ✅ **Zero-downtime deployment** — нет простоя при переключении
- ✅ **Быстрый откат** — переключение на предыдущую версию за секунды
- ✅ **Тестирование в production** — можно протестировать Green перед переключением
- ✅ **Простота** — понятный процесс для команды

#### Недостатки
- ❌ **Двойные ресурсы** — требуются ресурсы для двух сред
- ❌ **Сложность с БД** — миграции требуют особого подхода

#### Процесс Blue-Green Deployment

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BLUE-GREEN DEPLOYMENT FLOW                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. CURRENT STATE          2. DEPLOY TO GREEN       3. SWITCH       │
│                                                                      │
│  ┌────────┐                ┌────────┐                ┌────────┐     │
│  │  LB    │────────▶       │  LB    │────────▶       │  LB    │     │
│  └────────┘                └────────┘                └────────┘     │
│       │                         │                         │          │
│       ▼                         ▼                         ▼          │
│  ┌────────┐                ┌────────┐                ┌────────┐     │
│  │  BLUE  │ ◀── Active     │  BLUE  │                │  BLUE  │     │
│  │  v1.0  │                │  v1.0  │                │  v1.0  │     │
│  │  2x API│                │  2x API│                │  0x API│     │
│  └────────┘                └────────┘                └────────┘     │
│       │                    ┌────────┐                     │          │
│       │                    │ GREEN  │                     │          │
│       │                    │  v1.1  │                     │          │
│       │                    │  2x API│                     │          │
│       │                    └────────┘                     │          │
│       │                         │                         │          │
│       ▼                         ▼                         ▼          │
│  ┌────────┐                ┌────────┐                ┌────────┐     │
│  │   DB   │                │   DB   │                │   DB   │     │
│  └────────┘                └────────┘                └────────┘     │
│                                                                      │
│                            4. SCALE DOWN BLUE                       │
│                                                                      │
│  ┌────────┐                ┌────────┐                ┌────────┐     │
│  │  LB    │                │  LB    │                │  LB    │     │
│  └────────┘                └────────┘                └────────┘     │
│       │                                                   │          │
│       ▼                                                   ▼          │
│  ┌────────┐                                          ┌────────┐     │
│  │  BLUE  │                                          │  BLUE  │     │
│  │  v1.0  │                                          │  v1.0  │     │
│  │  STOP  │                                          │DELETE  │     │
│  └────────┘                                          └────────┘     │
│                                                                      │
│  ┌────────┐                                          ┌────────┐     │
│  │ GREEN  │ ◀── New Active                           │ GREEN  │     │
│  │  v1.1  │                                          │  v1.1  │     │
│  │  2x API│                                          │  2x API│     │
│  └────────┘                                          └────────┘     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### Команды для Blue-Green переключения

```bash
# 1. Определить текущую активную среду
CURRENT=$(docker-compose ps --services --filter "status=running" | grep backend | head -1)
echo "Current active: $CURRENT"

# 2. Определить целевую среду
if [ "$CURRENT" = "backend-blue" ]; then
  TARGET="backend-green"
else
  TARGET="backend-blue"
fi

# 3. Запустить новую версию
docker-compose pull $TARGET
docker-compose up -d --scale $TARGET=2 $TARGET

# 4. Ожидание health check
sleep 30
curl -f http://localhost:8080/health || exit 1

# 5. Переключить Load Balancer
# (обновить nginx конфигурацию)
sed -i "s/$CURRENT/$TARGET/g" /etc/nginx/conf.d/default.conf
nginx -s reload

# 6. Остановить старую среду
docker-compose stop $CURRENT
docker-compose scale $CURRENT=0
```

---

### 2.2 Canary Deployment

**Описание:** Постепенное направление части трафика на новую версию для тестирования в реальных условиях.

#### Преимущества
- ✅ **Постепенное внедрение** — можно обнаружить проблемы у малого числа пользователей
- ✅ **Реальное тестирование** — трафик реальных пользователей
- ✅ **Экономия ресурсов** — не нужны полные дублирующие среды

#### Недостатки
- ❌ **Сложность мониторинга** — требуется детальная метрика
- ❌ **Медленный деплой** — этапы по 10-25-50-100%

#### Процесс Canary Deployment

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CANARY DEPLOYMENT FLOW                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Этап 1: 10%          Этап 2: 25%         Этап 3: 50%              │
│                                                                      │
│  ┌────────────┐       ┌────────────┐       ┌────────────┐          │
│  │     LB     │       │     LB     │       │     LB     │          │
│  └─────┬──────┘       └─────┬──────┘       └─────┬──────┘          │
│        │                    │                    │                  │
│   ┌────┴────┐          ┌────┴────┐          ┌────┴────┐           │
│   │         │          │         │          │         │           │
│   ▼         ▼          ▼         ▼          ▼         ▼           │
│ ┌────┐   ┌────┐     ┌────┐   ┌────┐     ┌────┐   ┌────┐           │
│ │Blue│   │Canary│   │Blue│   │Canary│   │Blue│   │Canary│          │
│ │90% │   │10% │     │75% │   │25% │     │50% │   │50% │           │
│ │v1.0│   │v1.1│     │v1.0│   │v1.1│     │v1.0│   │v1.1│           │
│ └────┘   └────┘     └────┘   └────┘     └────┘   └────┘           │
│                                                                      │
│  Метрики для проверки на каждом этапе:                              │
│  • Error rate < 1%                                                   │
│  • P95 latency < 500ms                                               │
│  • CPU/Memory в норме                                                │
│  • Нет 5xx ошибок                                                    │
│                                                                      │
│  Этап 4: 100% (завершение)                                          │
│                                                                      │
│  ┌────────────┐                                                      │
│  │     LB     │                                                      │
│  └─────┬──────┘                                                      │
│        │                                                              │
│        ▼                                                              │
│  ┌───────────┐                                                       │
│  │  Canary   │ ◀── Вся система теперь на v1.1                        │
│  │   100%    │                                                       │
│  │   v1.1    │                                                       │
│  └───────────┘                                                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### Конфигурация Nginx для Canary

```nginx
# /etc/nginx/conf.d/canary.conf

# Разделение трафика на основе cookie
map $cookie_canary $backend_upstream {
    default backend_blue;
    "green" backend_green;
}

# Или разделение по проценту (требуется split_clients)
split_clients "${cookie_userid}" $canary_backend {
    10%    backend_green;
    *      backend_blue;
}

upstream backend_blue {
    server backend-blue:5001;
    keepalive 32;
}

upstream backend_green {
    server backend-green:5001;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name api.goldpc.by;

    location /api/v1/ {
        proxy_pass http://$canary_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
    }
}
```

---

### 2.3 Сравнение стратегий

| Критерий | Blue-Green | Canary |
|----------|------------|--------|
| **Downtime** | Zero | Zero |
| **Скорость деплоя** | Быстро (минуты) | Медленно (часы) |
| **Ресурсы** | 2x (двойные) | 1.1x - 2x |
| **Риск отката** | Минимальный | Средний |
| **Сложность** | Низкая | Высокая |
| **Тестирование** | Перед переключением | В процессе |
| **Рекомендация** | Релизы, критические обновления | Итеративные изменения, A/B тесты |

#### Рекомендации по выбору стратегии

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ВЫБОР СТРАТЕГИИ DEPLOYMENT                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────┐                        │
│  │      Какой тип релиза?                  │                        │
│  └─────────────────┬───────────────────────┘                        │
│                    │                                                 │
│          ┌─────────┴─────────┐                                       │
│          ▼                   ▼                                       │
│  ┌───────────────┐   ┌───────────────┐                              │
│  │ Major Release │   │ Minor/Patch   │                              │
│  │   (v1.0→v2.0) │   │   (v1.0→v1.1) │                              │
│  └───────┬───────┘   └───────┬───────┘                              │
│          │                   │                                       │
│          ▼                   ▼                                       │
│  ┌───────────────┐   ┌───────────────┐                              │
│  │  BLUE-GREEN   │   │    CANARY     │                              │
│  │               │   │   (10→25→50)  │                              │
│  └───────────────┘   └───────────────┘                              │
│                                                                      │
│  Дополнительные факторы:                                            │
│  • Бюджет ресурсов → Blue-Green требует больше ресурсов             │
│  • SLA требования → Canary для более безопасного внедрения          │
│  • Критичность → Blue-Green для мгновенного отката                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Чеклист ручного развертывания

> **Важно:** Данный чеклист используется при отказе CI/CD или для экстренного развертывания.

### 3.1 Подготовка к развертыванию

```markdown
## PRE-DEPLOYMENT CHECKLIST

### Окружение и доступы
- [ ] Проверить доступ к production серверу (SSH)
- [ ] Проверить доступ к Docker Registry
- [ ] Проверить доступ к базе данных
- [ ] Убедиться в наличии прав для деплоя
- [ ] Оповестить команду о начале деплоя

### Код и образы
- [ ] Убедиться, что все тесты прошли в CI
- [ ] Проверить версию образов в Registry
- [ ] Скачать образы локально для проверки
- [ ] Проверить digest образов (sha256)

### Резервные копии
- [ ] Создать backup базы данных
- [ ] Проверить restore процедуры
- [ ] Сохранить текущую конфигурацию nginx
- [ ] Зафиксировать текущие версии сервисов
```

### 3.2 Пошаговая инструкция

#### Шаг 1: Подключение к серверу

```bash
# Подключение к production серверу
ssh deploy@production.goldpc.by

# Переход в рабочую директорию
cd /opt/goldpc
```

#### Шаг 2: Проверка текущего состояния

```bash
# Проверка запущенных контейнеров
docker-compose ps

# Проверка версий
docker images | grep goldpc

# Проверка health endpoints
curl -s http://localhost:5001/health | jq
curl -s http://localhost:5002/health | jq
curl -s http://localhost:5003/health | jq

# Проверка логов на ошибки
docker-compose logs --tail=100 | grep -i error
```

#### Шаг 3: Резервное копирование базы данных

```bash
# Создание backup
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
docker exec goldpc-postgres pg_dump -U postgres goldpc > /backups/$BACKUP_FILE

# Проверка backup
ls -lh /backups/$BACKUP_FILE

# Запись информации о backup
echo "$(date): Pre-deployment backup created: $BACKUP_FILE" >> /var/log/goldpc/deploy.log
```

#### Шаг 4: Загрузка новых образов

```bash
# Авторизация в Registry
docker login ghcr.io -u $REGISTRY_USER -p $REGISTRY_TOKEN

# Загрузка новых образов
docker pull ghcr.io/goldpc/backend:$NEW_VERSION
docker pull ghcr.io/goldpc/frontend:$NEW_VERSION

# Проверка загруженных образов
docker images | grep $NEW_VERSION
```

#### Шаг 5: Обновление конфигурации

```bash
# Обновить переменные окружения
export IMAGE_TAG=$NEW_VERSION

# Обновить docker-compose.yml при необходимости
# vim docker-compose.yml

# Проверить конфигурацию
docker-compose config
```

#### Шаг 6: Применение миграций БД

```bash
# Проверка pending миграций
docker run --rm \
  --network goldpc-network \
  -e ConnectionStrings__DefaultConnection="$DB_CONNECTION_STRING" \
  ghcr.io/goldpc/backend:$NEW_VERSION \
  dotnet ef migrations list --project /app

# Применение миграций (если есть)
docker run --rm \
  --network goldpc-network \
  -e ConnectionStrings__DefaultConnection="$DB_CONNECTION_STRING" \
  ghcr.io/goldpc/backend:$NEW_VERSION \
  dotnet ef database update --project /app

# Проверка применения
docker exec goldpc-postgres psql -U postgres -d goldpc -c "SELECT * FROM __EFMigrationsHistory ORDER BY MigrationId DESC LIMIT 5;"
```

#### Шаг 7: Развертывание сервисов (Blue-Green)

```bash
# Определение текущей среды
CURRENT=$(docker-compose ps --services --filter "status=running" | grep -E "backend-blue|backend-green" | head -1)
echo "Current environment: $CURRENT"

# Определение целевой среды
if [ "$CURRENT" = "backend-blue" ] || [ -z "$CURRENT" ]; then
  TARGET="backend-green"
else
  TARGET="backend-blue"
fi
echo "Target environment: $TARGET"

# Остановка целевой среды (если была запущена)
docker-compose stop $TARGET 2>/dev/null || true

# Запуск новой версии
docker-compose up -d --scale $TARGET=2 --no-deps $TARGET

# Ожидание запуска
echo "Waiting for services to start..."
sleep 30

# Проверка health
for i in {1..10}; do
  if curl -sf http://localhost:8080/health > /dev/null; then
    echo "Health check passed!"
    break
  fi
  echo "Attempt $i: Waiting for health check..."
  sleep 10
done
```

#### Шаг 8: Переключение трафика

```bash
# Обновление nginx upstream
if [ "$TARGET" = "backend-green" ]; then
  sed -i 's/backend-blue/backend-green/g' /etc/nginx/conf.d/upstream.conf
else
  sed -i 's/backend-green/backend-blue/g' /etc/nginx/conf.d/upstream.conf
fi

# Проверка конфигурации nginx
nginx -t

# Перечитывание конфигурации (без downtime)
nginx -s reload

echo "Traffic switched to $TARGET"

# Логирование
echo "$(date): Switched traffic to $TARGET ($NEW_VERSION)" >> /var/log/goldpc/deploy.log
```

#### Шаг 9: Верификация

```bash
# Проверка ответов API
curl -s https://api.goldpc.by/health | jq

# Проверка метрик
curl -s http://localhost:9090/api/v1/query?query=up | jq

# Проверка error rate
curl -s http://localhost:9090/api/v1/query?query=rate(http_requests_total{status=~"5.."}[5m]) | jq

# Smoke тесты
./scripts/smoke-tests.sh production
```

#### Шаг 10: Остановка старой среды

```bash
# Ожидание перед остановкой (grace period)
echo "Waiting 5 minutes before stopping old environment..."
sleep 300

# Проверка метрик за последний период
# Если все ОК, останавливаем старую среду

# Остановка старой среды
docker-compose stop $CURRENT
docker-compose scale $CURRENT=0

echo "Old environment ($CURRENT) stopped"

# Логирование
echo "$(date): Stopped $CURRENT environment" >> /var/log/goldpc/deploy.log
```

### 3.3 Пост-деплоймент чеклист

```markdown
## POST-DEPLOYMENT CHECKLIST

### Функциональная проверка
- [ ] Главная страница загружается
- [ ] Авторизация работает
- [ ] Каталог отображается
- [ ] Конфигуратор функционирует
- [ ] Оформление заказа доступно

### Техническая проверка
- [ ] Все контейнеры running
- [ ] Health endpoints отвечают 200
- [ ] Error rate < 1%
- [ ] P95 latency < 500ms
- [ ] CPU utilization < 70%
- [ ] Memory utilization < 80%

### Мониторинг
- [ ] Grafana dashboards отображают данные
- [ ] Alerts настроены корректно
- [ ] Logs агрегируются

### Документация
- [ ] Обновить CHANGELOG.md
- [ ] Записать версию в deploy log
- [ ] Оповестить команду о завершении
```

---

## 4. Управление секретами

### 4.1 Обязательные секреты

| Секрет | Описание | Где используется | Пример |
|--------|----------|-----------------|--------|
| `JWT_KEY` | Секретный ключ для подписи JWT токенов | AuthService, все API | Минимум 32 символа |
| `JWT_ISSUER` | Издатель JWT токенов | AuthService | `goldpc` |
| `JWT_AUDIENCE` | Аудитория JWT токенов | AuthService | `goldpc-users` |
| `DB_PASSWORD` | Пароль к PostgreSQL | Все backend сервисы | Сложный пароль |
| `DB_CONNECTION_STRING` | Строка подключения к БД | Все backend сервисы | `Server=...;Password=...` |
| `REDIS_PASSWORD` | Пароль к Redis (опционально) | Кэширующие сервисы | Сложный пароль |
| `SMTP_PASSWORD` | Пароль SMTP сервера | Notification сервис | — |
| `PAYMENT_API_KEY` | API ключ платежной системы | OrdersService | — |
| `SSL_CERT` | SSL сертификат | Nginx | PEM формат |
| `SSL_KEY` | Приватный ключ SSL | Nginx | PEM формат |

### 4.2 Настройка переменных окружения

#### Development (.env)

```bash
# .env.development - НЕ КОММИТИТЬ!
# Копировать из .env.example

# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=admin
POSTGRES_DB=goldpc
DB_CONNECTION_STRING=Server=localhost;Database=goldpc;User Id=postgres;Password=admin;

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (Development only - use strong keys in production!)
JWT_KEY=dev-secret-key-for-testing-only-min-32-chars!
JWT_ISSUER=goldpc
JWT_AUDIENCE=goldpc-users

# Services
CATALOG_SERVICE_URL=http://localhost:5001
PCBUILDER_SERVICE_URL=http://localhost:5002
AUTH_SERVICE_URL=http://localhost:5003
```

#### Production

```bash
# /opt/goldpc/.env.production
# Управляется через Vault или секреты облачного провайдера

# Database
POSTGRES_USER=goldpc_app
POSTGRES_PASSWORD=<from-vault>
DB_CONNECTION_STRING=Server=prod-db.goldpc.by;Database=goldpc;User Id=goldpc_app;Password=<from-vault>;SslMode=Require;

# Redis
REDIS_HOST=prod-redis.goldpc.by
REDIS_PORT=6379
REDIS_PASSWORD=<from-vault>

# JWT
JWT_KEY=<from-vault-min-64-chars>
JWT_ISSUER=goldpc
JWT_AUDIENCE=goldpc-users
JWT_ACCESS_TOKEN_TTL=900
JWT_REFRESH_TOKEN_TTL=604800

# External Services
SMTP_HOST=smtp.goldpc.by
SMTP_USER=noreply@goldpc.by
SMTP_PASSWORD=<from-vault>
PAYMENT_API_KEY=<from-vault>
```

### 4.3 HashiCorp Vault конфигурация

```hcl
# vault/policies/goldpc-policy.hcl

# Policy для приложения
path "secret/data/goldpc/production/*" {
  capabilities = ["read"]
}

path "secret/data/goldpc/production/database" {
  capabilities = ["read"]
}

path "secret/data/goldpc/production/jwt" {
  capabilities = ["read"]
}

path "secret/data/goldpc/production/external" {
  capabilities = ["read"]
}
```

```bash
# Загрузка секретов в Vault
vault kv put secret/goldpc/production/database \
  postgres_user="goldpc_app" \
  postgres_password="<secure-password>" \
  connection_string="Server=...;Password=...;"

vault kv put secret/goldpc/production/jwt \
  signing_key="<secure-random-64-chars>" \
  issuer="goldpc" \
  audience="goldpc-users"

vault kv put secret/goldpc/production/external \
  smtp_password="<smtp-password>" \
  payment_api_key="<api-key>"
```

### 4.4 Ротация секретов

```markdown
## Процедура ротации секретов

### JWT_KEY (каждые 90 дней)
1. [ ] Сгенерировать новый ключ
2. [ ] Добавить новый ключ в Vault (jwt_key_new)
3. [ ] Обновить AuthService для поддержки двух ключей
4. [ ] Деплой с поддержкой обоих ключей
5. [ ] Дождаться истечения всех refresh токенов (7 дней)
6. [ ] Удалить старый ключ
7. [ ] Финальный деплой

### DB_PASSWORD (каждые 180 дней)
1. [ ] Создать нового пользователя БД
2. [ ] Выдать права новому пользователю
3. [ ] Обновить секреты в Vault
4. [ ] Перезапустить сервисы
5. [ ] Удалить старого пользователя после проверки

### SSL сертификаты (ежегодно)
1. [ ] Получить новый сертификат за 30 дней до истечения
2. [ ] Установить в Vault
3. [ ] Обновить nginx конфигурацию
4. [ ] Перечитать конфигурацию: nginx -s reload
5. [ ] Проверить: curl -v https://goldpc.by
```

### 4.5 Аварийный доступ к секретам

```bash
# Экстренное получение секретов из Vault
# Требуется: VAULT_ADDR, VAULT_TOKEN

# Получение JWT ключа
vault kv get -field=signing_key secret/goldpc/production/jwt

# Получение строки подключения
vault kv get -field=connection_string secret/goldpc/production/database

# Полный дамп (только для экстренных случаев)
vault kv get secret/goldpc/production
```

---

## 5. Стратегия отката (Rollback Strategy)

### 5.1 Общие принципы

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ROLLBACK DECISION TREE                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                    ┌─────────────────────┐                          │
│                    │ Обнаружена проблема │                          │
│                    │   после деплоя      │                          │
│                    └──────────┬──────────┘                          │
│                               │                                      │
│                    ┌──────────▼──────────┐                          │
│                    │   Критичность?      │                          │
│                    └──────────┬──────────┘                          │
│                               │                                      │
│          ┌────────────────────┼────────────────────┐                │
│          ▼                    ▼                    ▼                │
│   ┌────────────┐       ┌────────────┐       ┌────────────┐        │
│   │  CRITICAL  │       │    HIGH    │       │  MEDIUM    │        │
│   │ (сервис    │       │ (ошибки    │       │ (незначит. │        │
│   │  недоступен)│       │  у пользователей)│     деградация)│      │
│   └─────┬──────┘       └─────┬──────┘       └─────┬──────┘        │
│         │                    │                    │                │
│         ▼                    ▼                    ▼                │
│   ┌────────────┐       ┌────────────┐       ┌────────────┐        │
│   │ НЕМЕДЛЕННЫЙ│       │  БЫСТРЫЙ   │       │  Запланир. │        │
│   │  ROLLBACK  │       │  ROLLBACK  │       │  ROLLBACK  │        │
│   │   (< 5мин) │       │  (< 30мин) │       │ (след. релиз)│       │
│   └────────────┘       └────────────┘       └────────────┘        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Сценарии отката

#### Сценарий A: Откат Blue-Green (быстрый)

**Время восстановления:** < 5 минут

```bash
#!/bin/bash
# scripts/rollback-blue-green.sh

set -e

echo "=== BLUE-GREEN ROLLBACK ==="

# 1. Определить текущую активную среду
ACTIVE=$(docker-compose ps --services --filter "status=running" | grep -E "backend-blue|backend-green" | head -1)
echo "Current active: $ACTIVE"

# 2. Определить предыдущую среду
if [ "$ACTIVE" = "backend-blue" ]; then
  PREVIOUS="backend-green"
else
  PREVIOUS="backend-blue"
fi

# 3. Проверить, есть ли предыдущая версия
if ! docker images | grep -q "$PREVIOUS"; then
  echo "ERROR: No previous version found!"
  exit 1
fi

# 4. Запустить предыдущую среду
echo "Starting $PREVIOUS..."
docker-compose up -d --scale $PREVIOUS=2 --no-deps $PREVIOUS

# 5. Ожидание health check
echo "Waiting for health check..."
sleep 30

for i in {1..10}; do
  if curl -sf http://localhost:8080/health > /dev/null; then
    echo "Health check passed!"
    break
  fi
  echo "Attempt $i: Waiting..."
  sleep 10
done

# 6. Переключить Load Balancer
echo "Switching traffic to $PREVIOUS..."
sed -i "s/$ACTIVE/$PREVIOUS/g" /etc/nginx/conf.d/upstream.conf
nginx -s reload

# 7. Остановить текущую среду
echo "Stopping $ACTIVE..."
docker-compose stop $ACTIVE
docker-compose scale $ACTIVE=0

# 8. Верификация
echo "Verifying..."
curl -sf https://api.goldpc.by/health || exit 1

echo "=== ROLLBACK COMPLETE ==="
echo "$(date): Rollback from $ACTIVE to $PREVIOUS completed" >> /var/log/goldpc/deploy.log
```

#### Сценарий B: Откат к конкретной версии

**Время восстановления:** 10-15 минут

```bash
#!/bin/bash
# scripts/rollback-to-version.sh

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 v1.2.3"
  exit 1
fi

echo "=== ROLLBACK TO VERSION $VERSION ==="

# 1. Проверить наличие образа
if ! docker pull ghcr.io/goldpc/backend:$VERSION; then
  echo "ERROR: Version $VERSION not found in registry!"
  exit 1
fi

# 2. Остановить текущие сервисы
echo "Stopping current services..."
docker-compose down

# 3. Обновить переменную версии
export IMAGE_TAG=$VERSION

# 4. Запустить сервисы с указанной версией
echo "Starting services with version $VERSION..."
docker-compose up -d

# 5. Ожидание запуска
sleep 30

# 6. Проверка health
echo "Checking health..."
for service in catalogservice pcbuilderservice authservice; do
  curl -sf http://localhost:8080/health || exit 1
done

# 7. Верификация
echo "Running smoke tests..."
./scripts/smoke-tests.sh production

echo "=== ROLLBACK TO $VERSION COMPLETE ==="
```

#### Сценарий C: Откат миграций БД

**Время восстановления:** 15-30 минут (зависит от объема данных)

```bash
#!/bin/bash
# scripts/rollback-migration.sh

TARGET_MIGRATION=$1

if [ -z "$TARGET_MIGRATION" ]; then
  echo "Usage: $0 <target_migration>"
  echo "Example: $0 20240115123456_AddUserTable"
  exit 1
fi

echo "=== DATABASE MIGRATION ROLLBACK ==="

# 1. Backup перед откатом
BACKUP_FILE="pre_rollback_$(date +%Y%m%d_%H%M%S).sql"
echo "Creating backup: $BACKUP_FILE"
docker exec goldpc-postgres pg_dump -U postgres goldpc > /backups/$BACKUP_FILE

# 2. Проверка текущей версии
echo "Current migration version:"
docker exec goldpc-postgres psql -U postgres -d goldpc -c "SELECT * FROM __EFMigrationsHistory ORDER BY MigrationId DESC LIMIT 5;"

# 3. Откат к указанной миграции
echo "Rolling back to $TARGET_MIGRATION..."
docker run --rm \
  --network goldpc-network \
  -e ConnectionStrings__DefaultConnection="$DB_CONNECTION_STRING" \
  ghcr.io/goldpc/backend:$IMAGE_TAG \
  dotnet ef database update $TARGET_MIGRATION --project /app

# 4. Верификация
echo "Verifying migration rollback..."
docker exec goldpc-postgres psql -U postgres -d goldpc -c "SELECT * FROM __EFMigrationsHistory ORDER BY MigrationId DESC LIMIT 5;"

echo "=== MIGRATION ROLLBACK COMPLETE ==="
```

### 5.3 Чеклист отката

```markdown
## ROLLBACK CHECKLIST

### Перед откатом
- [ ] Зафиксировать симптомы проблемы
- [ ] Зафиксировать текущую версию
- [ ] Оповестить команду (Slack: #deployments)
- [ ] Создать incident ticket

### Во время отката
- [ ] Выполнить скрипт отката
- [ ] Мониторить логи
- [ ] Проверить health endpoints

### После отката
- [ ] Верифицировать функциональность
- [ ] Проверить метрики
- [ ] Оповестить команду о завершении
- [ ] Обновить incident ticket
- [ ] Провести post-mortem

### Документация
- [ ] Записать в deploy log
- [ ] Создать задачу на исправление
- [ ] Обновить знания в knowledge-base
```

### 5.4 Контакты для эскалации

| Уровень | Ответственный | Контакты |
|---------|---------------|----------|
| L1 | DevOps on-call | Slack: @devops-oncall |
| L2 | Lead Developer | Slack: @lead-dev, Tel: +375-XX-XXX-XX-XX |
| L3 | CTO | Tel: +375-XX-XXX-XX-XX |
| Vendor | Cloud Provider | Support portal |

---

## 6. Мониторинг и алерты

### 6.1 Ключевые метрики

| Метрика | Порог Warning | Порог Critical | Действие |
|---------|---------------|----------------|----------|
| Error Rate | > 1% | > 5% | Автоматический откат |
| P95 Latency | > 500ms | > 2000ms | Исследование |
| CPU Usage | > 70% | > 90% | Scale up |
| Memory Usage | > 80% | > 95% | Scale up |
| Disk Usage | > 70% | > 90% | Cleanup |
| DB Connections | > 80% pool | > 95% pool | Scale pool |

### 6.2 Alert правила (Prometheus)

```yaml
# prometheus/alerts.yml
groups:
  - name: goldpc-critical
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"

      - alert: ServiceDown
        expr: up{job="goldpc-backend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.instance }} is down"
          
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "P95 latency is above 2 seconds"
```

### 6.3 Dashboard (Grafana)

```markdown
## Обязательные панели на Grafana Dashboard

### Overview Panel
- Request Rate (RPS)
- Error Rate (%)
- P95/P99 Latency
- Active Users

### Services Panel
- Per-service health status
- Per-service error rate
- Per-service latency

### Infrastructure Panel
- CPU/Memory utilization
- Network I/O
- Disk I/O
- Container status

### Database Panel
- Connection pool usage
- Query latency
- Cache hit rate
- Replication lag
```

---

## 7. Процедуры восстановления

### 7.1 Восстановление базы данных

```bash
#!/bin/bash
# scripts/restore-database.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  echo "Available backups:"
  ls -la /backups/*.sql | tail -10
  exit 1
fi

echo "=== DATABASE RESTORE ==="
echo "Backup file: $BACKUP_FILE"

# 1. Остановить сервисы
echo "Stopping services..."
docker-compose stop catalogservice pcbuilderservice authservice ordersservice

# 2. Создать backup текущего состояния
CURRENT_BACKUP="pre_restore_$(date +%Y%m%d_%H%M%S).sql"
docker exec goldpc-postgres pg_dump -U postgres goldpc > /backups/$CURRENT_BACKUP
echo "Current state backed up: $CURRENT_BACKUP"

# 3. Восстановить backup
echo "Restoring from $BACKUP_FILE..."
docker exec -i goldpc-postgres psql -U postgres goldpc < /backups/$BACKUP_FILE

# 4. Проверка
echo "Verifying..."
docker exec goldpc-postgres psql -U postgres -d goldpc -c "SELECT COUNT(*) FROM users;"

# 5. Запустить сервисы
echo "Starting services..."
docker-compose start catalogservice pcbuilderservice authservice ordersservice

echo "=== RESTORE COMPLETE ==="
```

### 7.2 Восстановление Redis

```bash
#!/bin/bash
# scripts/restore-redis.sh

# Redis не требует сложного восстановления - данные кэшируемые
# При потере данных - кэш перестроится автоматически

echo "=== REDIS RECOVERY ==="

# 1. Перезапуск Redis
docker-compose restart redis

# 2. Проверка
docker exec goldpc-redis redis-cli ping

# 3. Очистка (если нужно)
# docker exec goldpc-redis redis-cli FLUSHALL

echo "Redis recovered. Cache will warm up automatically."
```

### 7.3 Disaster Recovery Plan

```markdown
## DISASTER RECOVERY PLAN

### RPO (Recovery Point Objective): 1 час
### RTO (Recovery Time Objective): 4 часа

### Сценарии катастроф

#### 1. Потеря сервера приложения
**Время восстановления:** 30 минут
- [ ] Запустить новые инстансы из образов
- [ ] Восстановить конфигурацию
- [ ] Проверить health endpoints

#### 2. Потеря базы данных
**Время восстановления:** 2-4 часа
- [ ] Восстановить PostgreSQL из backup
- [ ] Применить WAL архивы (если есть)
- [ ] Проверить целостность данных
- [ ] Запустить сервисы

#### 3. Потеря всего дата-центра
**Время восстановления:** 4-8 часов
- [ ] Активировать DR сайт
- [ ] Восстановить DNS
- [ ] Восстановить данные из offsite backup
- [ ] Запустить инфраструктуру

### Offsite Backup
- Ежедневные backup хранятся 30 дней
- Еженедельные backup хранятся 1 год
- Резервные копии в другом регионе
```

---

## Приложения

### A. Полезные команды

```bash
# Просмотр логов
docker-compose logs -f --tail=100 catalogservice

# Перезапуск сервиса
docker-compose restart catalogservice

# Масштабирование
docker-compose up -d --scale catalogservice=3

# Проверка ресурсов
docker stats

# Вход в контейнер
docker exec -it goldpc-catalog /bin/bash

# Проверка сети
docker network inspect goldpc-network

# Очистка неиспользуемых ресурсов
docker system prune -af
```

### B. Контакты

| Роль | Имя | Контакты |
|------|-----|----------|
| DevOps Lead | — | Slack: @devops-lead |
| Backend Lead | — | Slack: @backend-lead |
| DBA | — | Slack: @dba |
| Security | — | security@goldpc.local |

### C. Ссылки

- [Development Plan: Deployment](../development-plan/11-deployment.md)
- [Security Policy](./security-policy.md)
- [API Documentation](./API-Documentation.md)
- [Development Environment Setup](../development-plan/03-environment-setup.md)

---

*Документ создан в рамках проекта GoldPC. Последнее обновление: Март 2026.*