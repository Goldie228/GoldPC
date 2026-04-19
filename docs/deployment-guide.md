# Руководство по развертыванию GoldPC

## 📋 Обзор документа

**Версия:** 2.0  
**Последнее обновление:** 20 апреля 2026  
**Статус инфраструктуры:** Docker Compose (Development/Staging)

Данный документ описывает реальную инфраструктуру GoldPC и процедуры её развертывания.

---

## Содержание

1. [Архитектура развертывания](#1-архитектура-развертывания)
2. [Локальное развертывание](#2-локальное-развертывание)
3. [Production развертывание](#3-production-развертывание)
4. [Управление секретами](#4-управление-секретами)
5. [Стратегия отката](#5-стратегия-отката)
6. [Мониторинг](#6-мониторинг)

---

## 1. Архитектура развертывания

### 1.1 Текущая инфраструктура

```
┌─────────────────────────────────────────────────────────────────┐
│                      DEVELOPMENT / STAGING                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Docker Host                            │  │
│  │                                                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │  │
│  │  │  Frontend   │  │  Nginx      │  │  Adminer    │      │  │
│  │  │  :3002      │  │  (future)   │  │  :9090      │      │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │  │
│  │                                                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │  │
│  │  │ Catalog API │  │  Auth API   │  │  RabbitMQ   │      │  │
│  │  │  :9081      │  │  :9082      │  │  :5672      │      │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │  │
│  │                                                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │  │
│  │  │ PostgreSQL  │  │ PostgreSQL  │  │    Redis    │      │  │
│  │  │ Primary     │  │  Replica    │  │    :6379    │      │  │
│  │  │  :5434      │  │   :5435     │  │             │      │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Компоненты системы

| Сервис | Порт | Описание | Статус |
|--------|------|----------|--------|
| `frontend` | 3002 | React SPA (Nginx) | ✅ Активен |
| `catalog.api` | 9081 | Каталог товаров | ✅ Активен |
| `auth.api` | 9082 | Аутентификация JWT | ✅ Активен |
| `postgres` | 5434 | PostgreSQL 16 (Primary) | ✅ Активен |
| `postgres-replica` | 5435 | PostgreSQL 16 (Replica) | ✅ Активен |
| `redis` | 6379 | Redis 7 (кэш) | ✅ Активен |
| `rabbitmq` | 5672/15672 | RabbitMQ (message broker) | ✅ Активен |
| `adminer` | 9090 | Database UI | ✅ Активен |

### 1.3 Микросервисы в разработке

Следующие сервисы существуют в коде, но не включены в docker-compose:

| Сервис | Путь | Описание |
|--------|------|----------|
| `PCBuilderService` | `src/PCBuilderService/` | Конструктор ПК |
| `OrdersService` | `src/OrdersService/` | Заказы |
| `ServicesService` | `src/ServicesService/` | Сервисный центр |
| `WarrantyService` | `src/WarrantyService/` | Гарантии |
| `ReportingService` | `src/ReportingService/` | Отчётность |

---

## 2. Локальное развертывание

### 2.1 Предварительные требования

- **Docker** 20.10+
- **Docker Compose** 2.0+
- **dotnet SDK** 8.0+ (для разработки)

### 2.2 Запуск проекта

```bash
# Из корня репозитория
cd /path/to/GoldPC

# Запуск всех сервисов
docker compose -f docker/docker-compose.yml up -d

# Проверка статуса
docker compose -f docker/docker-compose.yml ps

# Просмотр логов
docker compose -f docker/docker-compose.yml logs -f
```

### 2.3 Доступ к сервисам

| Сервис | URL |
|--------|-----|
| Frontend | http://localhost:3002 |
| Catalog API | http://localhost:9081 |
| Catalog Swagger | http://localhost:9081/swagger |
| Auth API | http://localhost:9082 |
| Auth Swagger | http://localhost:9082/swagger |
| RabbitMQ Management | http://localhost:15672 |
| Adminer | http://localhost:9090 |

**RabbitMQ логин/пароль:** `guest` / `guest`

### 2.4 Остановка проекта

```bash
# Остановка сервисов
docker compose -f docker/docker-compose.yml down

# Остановка с удалением данных (ОСТОРОЖНО!)
docker compose -f docker/docker-compose.yml down -v
```

---

## 3. Production развертывание

### 3.1 Рекомендации

Для production окружения рекомендуется:

1. **Использовать Kubernetes** или **Docker Swarm** для оркестрации
2. **Настроить обратный прокси** (Nginx/Traefik) с SSL
3. **Использовать внешние БД** (не в том же кластере)
4 **Настроить бэкапы** PostgreSQL
5. **Использовать secrets manager** (HashiCorp Vault, AWS Secrets Manager)

### 3.2 Переменные окружения для production

Создайте `.env.production`:

```bash
# PostgreSQL
POSTGRES_USER=goldpc_prod
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=goldpc

# Redis
REDIS_PASSWORD=<redis-password>

# JWT
JwtSettings__Secret=<32+ char random string>
JwtSettings__Issuer=goldpc-prod
JwtSettings__Audience=goldpc-users

# RabbitMQ
RABBITMQ_DEFAULT_USER=<rabbit-user>
RABBITMQ_DEFAULT_PASS=<rabbit-pass>

# ASPNETCORE
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=https://+:443;http://+:80
```

### 3.3 SSL сертификаты

Для production используйте Let's Encrypt:

```bash
# Установить Certbot
sudo apt install certbot python3-certbot-nginx

# Получить сертификат
sudo certbot --nginx -d api.goldpc.by -d goldpc.by
```

---

## 4. Управление секретами

### 4.1 Текущий подход (Development)

Секреты передаются через `docker-compose.yml` и `.env` файлы.

**⚠️ Важно:** Никогда не коммитьте `.env` файлы в репозиторий!

### 4.2 Рекомендуемый подход (Production)

Используйте один из подходов:

| Инструмент | Описание |
|------------|----------|
| **Docker Secrets** | Встроенное решение для Docker Swarm |
| **Kubernetes Secrets** | Для Kubernetes кластеров |
| **HashiCorp Vault** | Полноценный secrets manager |
| **AWS Secrets Manager** | Для AWS инфраструктуры |

### 4.3 Критичные секреты

| Секрет | Где используется |
|--------|------------------|
| `POSTGRES_PASSWORD` | Доступ к БД |
| `JwtSettings__Secret` | Подпись JWT токенов |
| `REDIS_PASSWORD` | Доступ к Redis |
| `RABBITMQ_DEFAULT_PASS` | Доступ к RabbitMQ |

---

## 5. Стратегия отката

### 5.1 Откат через Docker Compose

```bash
# 1. Остановить текущие сервисы
docker compose -f docker/docker-compose.yml stop

# 2. Удалить текущие контейнеры
docker compose -f docker/docker-compose.yml rm -f

# 3. Откатиться к предыдущему коммиту
git checkout <previous-commit>

# 4. Пересобрать образы
docker compose -f docker/docker-compose.yml build

# 5. Запустить сервисы
docker compose -f docker/docker-compose.yml up -d
```

### 5.2 Откат через Docker images

Если у вас сохранены теги образов:

```bash
# Посмотреть доступные образы
docker images | grep goldpc

# Откатиться к предыдущему тегу
docker compose -f docker/docker-compose.yml pull
# (обновить теги в docker-compose.yml)
docker compose -f docker/docker-compose.yml up -d
```

### 5.3 Откат базы данных

```bash
# Восстановить из бэкапа
pg_restore -U postgres -d goldpc /backups/goldpc_20260420.dump

# Или через Adminer:
# 1. Открыть http://localhost:9090
# 2. Выбрать базу данных
# 3. Import → выбрать SQL файл
```

---

## 6. Мониторинг

### 6.1 Health checks

Все сервисы имеют health checks в docker-compose:

```bash
# Проверить статус health checks
docker compose -f docker/docker-compose.yml ps

# Посмотреть логи health check
docker logs goldpc-postgres | grep -i health
```

### 6.2 Логи

```bash
# Все логи
docker compose -f docker/docker-compose.yml logs -f

# Логи конкретного сервиса
docker compose -f docker/docker-compose.yml logs -f catalog.api
docker compose -f docker/docker-compose.yml logs -f auth.api

# Экспорт логов в файл
docker compose -f docker/docker-compose.yml logs > logs-$(date +%Y%m%d).txt
```

### 6.3 Метрики (рекомендации)

Для production рекомендуется добавить:

| Инструмент | Описание |
|------------|----------|
| **Prometheus** | Сбор метрик |
| **Grafana** | Визуализация |
| **ELK Stack** | Централизованные логи |
| **Jaeger** | Distributed tracing |

### 6.4 Ключевые метрики для мониторинга

- **CPU/Memory usage** по контейнерам
- **Request rate** и **error rate** по API
- **Database connections** и **slow queries**
- **Redis hit/miss ratio**
- **RabbitMQ queue depth**

---

## 7. Бэкапы

### 7.1 Бэкап PostgreSQL

```bash
# Создать бэкап
docker exec goldpc-postgres pg_dump -U postgres goldpc > goldpc_$(date +%Y%m%d_%H%M%S).dump

# Бэкап всех баз
docker exec goldpc-postgres pg_dumpall -U postgres > all_databases_$(date +%Y%m%d_%H%M%S).dump
```

### 7.2 Восстановление

```bash
# Восстановить базу
cat goldpc_20260420.dump | docker exec -i goldpc-postgres psql -U postgres goldpc

# Или через pg_restore (для бэкапов в кастомном формате)
docker exec -i goldpc-postgres pg_restore -U postgres -d goldpc goldpc_20260420.dump
```

### 7.3 Автоматизация бэкапов

Добавьте в crontab:

```bash
# Ежедневный бэкап в 2:00 AM
0 2 * * * cd /path/to/GoldPC && \
  docker exec goldpc-postgres pg_dump -U postgres goldpc > \
  /backups/goldpc_$(date +\%Y\%m\%d).dump && \
  find /backups -name "*.dump" -mtime +7 -delete
```

---

## 8. Troubleshooting

### 8.1 Сервис не запускается

```bash
# Проверить логи
docker compose -f docker/docker-compose.yml logs <service-name>

# Перезапустить сервис
docker compose -f docker/docker-compose.yml restart <service-name>

# Пересобрать сервис
docker compose -f docker/docker-compose.yml up -d --build <service-name>
```

### 8.2 Проблемы с базой данных

```bash
# Проверить подключение
docker exec goldpc-postgres psql -U postgres -c "SELECT version();"

# Перезапустить PostgreSQL
docker compose -f docker/docker-compose.yml restart postgres

# Проверить репликацию
docker exec goldpc-postgres-replica psql -U postgres -c "SELECT * FROM pg_stat_replication;"
```

### 8.3 Очистка и перезапуск

```bash
# Полная очистка (УДАЛЯЕТ ВСЕ ДАННЫЕ!)
docker compose -f docker/docker-compose.yml down -v
docker compose -f docker/docker-compose.yml up -d --build
```
