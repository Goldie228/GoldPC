# GoldPC Production Infrastructure

Полное описание инфраструктуры для production-окружения с поддержкой Blue-Green deployment.

## 📁 Структура директории

```
infrastructure/production/
├── docker-compose.yml      # Основной файл конфигурации сервисов
├── .env.example            # Пример переменных окружения
├── README.md               # Этот файл
├── nginx/
│   ├── nginx.conf          # Конфигурация reverse proxy
│   └── ssl/                # SSL сертификаты (создать вручную)
│       ├── goldpc.by.crt
│       └── goldpc.by.key
└── postgres/
    ├── postgresql.conf     # Оптимизированная конфигурация PostgreSQL
    └── init-scripts/       # SQL скрипты инициализации (опционально)
```

## 🚀 Быстрый старт

### 1. Подготовка окружения

```bash
# Клонировать репозиторий и перейти в директорию
cd infrastructure/production

# Скопировать пример переменных окружения
cp .env.example .env

# Отредактировать .env файл с реальными значениями
nano .env
```

### 2. Генерация секретов

```bash
# Сгенерировать JWT ключ
openssl rand -base64 32

# Сгенерировать пароль для БД
openssl rand -base64 24

# Сгенерировать пароль для Redis
openssl rand -base64 24
```

### 3. Настройка SSL сертификатов

```bash
# Создать директорию для SSL сертификатов
mkdir -p nginx/ssl

# Опция A: Let's Encrypt (рекомендуется для продакшена)
# Установить certbot и получить сертификат:
sudo certbot certonly --standalone -d goldpc.by -d www.goldpc.by

# Скопировать сертификаты
sudo cp /etc/letsencrypt/live/goldpc.by/fullchain.pem nginx/ssl/goldpc.by.crt
sudo cp /etc/letsencrypt/live/goldpc.by/privkey.pem nginx/ssl/goldpc.by.key

# Опция B: Самоподписанный сертификат (для тестирования)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/goldpc.by.key \
  -out nginx/ssl/goldpc.by.crt \
  -subj "/C=BY/ST=Minsk/L=Minsk/O=GoldPC/OU=IT/CN=goldpc.by"
```

### 4. Создание директорий для данных

```bash
# Создать директории для постоянного хранения данных
sudo mkdir -p /var/lib/goldpc/postgres
sudo mkdir -p /var/lib/goldpc/redis

# Установить правильные права
sudo chown -R 999:999 /var/lib/goldpc/postgres
sudo chown -R 999:999 /var/lib/goldpc/redis
```

### 5. Запуск сервисов

```bash
# Запустить все сервисы
docker-compose up -d

# Проверить статус
docker-compose ps

# Просмотр логов
docker-compose logs -f
```

## 🔄 Blue-Green Deployment

### Концепция

Blue-Green deployment обеспечивает нулевой downtime при обновлении:

- **Blue** — текущая стабильная версия (активна)
- **Green** — новая версия для развертывания (неактивна)

### Процесс деплоя

```bash
# 1. Установить новую версию в GREEN_VERSION в .env
# GREEN_VERSION=v1.1.0

# 2. Запустить green окружение
docker-compose up -d --scale backend-green=2 backend-green

# 3. Дождаться health check
docker-compose logs -f backend-green

# 4. Переключить трафик на green (обновить nginx конфигурацию)
# Изменить $backend_upstream на backend_green в nginx.conf
docker-compose exec nginx nginx -s reload

# 5. Остановить blue окружение
docker-compose stop backend-blue
docker-compose up -d --scale backend-blue=0 backend-blue

# 6. Обновить версии в .env для следующего деплоя
# BLUE_VERSION=v1.1.0
```

### Canary Deployment (опционально)

Для поэтапного переключения трафика используйте cookie `canary=green`:

```bash
# Тестирование green окружения
curl -b "canary=green" https://goldpc.by/api/v1/health
```

## 📊 Мониторинг

### Health Checks

Все сервисы имеют настроенные health checks:

```bash
# Nginx
curl http://localhost/health

# Backend (через nginx)
curl https://goldpc.by/api/v1/health

# PostgreSQL
docker-compose exec postgres pg_isready -U goldpc_user

# Redis
docker-compose exec redis redis-cli ping
```

### Логи

```bash
# Логи всех сервисов
docker-compose logs -f

# Логи конкретного сервиса
docker-compose logs -f nginx
docker-compose logs -f backend-blue
docker-compose logs -f postgres

# Nginx access логи
tail -f nginx/logs/access.log

# Nginx error логи
tail -f nginx/logs/error.log
```

### Статистика контейнеров

```bash
# Использование ресурсов
docker stats

# Информация о контейнерах
docker-compose ps
docker-compose top
```

## ⚙️ Конфигурация сервисов

### Resource Limits

| Сервис | CPU Limit | Memory Limit | CPU Reserved | Memory Reserved |
|--------|-----------|--------------|--------------|-----------------|
| nginx | 1 | 512M | 0.25 | 128M |
| backend-blue | 2 | 1G | 0.5 | 256M |
| backend-green | 2 | 1G | 0.5 | 256M |
| frontend | 0.5 | 256M | 0.1 | 64M |
| postgres | 4 | 8G | 1 | 1G |
| redis | 1 | 2G | 0.25 | 512M |

### Порты

| Сервис | Внутренний порт | Внешний порт |
|--------|-----------------|--------------|
| nginx | 80, 443 | 80, 443 |
| backend-blue | 8080 | - |
| backend-green | 8080 | - |
| frontend | 80 | - |
| postgres | 5432 | - |
| redis | 6379 | - |

## 🔐 Безопасность

### Переменные окружения

- **DB_PASSWORD** — пароль PostgreSQL
- **JWT_KEY** — секретный ключ для JWT токенов
- **REDIS_PASSWORD** — пароль Redis

### Рекомендации

1. Используйте сильные пароли (минимум 16 символов)
2. Регулярно ротируйте секреты
3. Используйте HashiCorp Vault для управления секретами
4. Включите SSL/TLS для всех соединений
5. Настройте firewall для ограничения доступа

### Firewall настройки

```bash
# Разрешить только HTTP/HTTPS и SSH
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 🔧 Обслуживание

### Backup базы данных

```bash
# Создать backup
docker-compose exec postgres pg_dump -U goldpc_user goldpc > backup_$(date +%Y%m%d).sql

# Восстановить из backup
cat backup_20260316.sql | docker-compose exec -T postgres psql -U goldpc_user goldpc
```

### Обновление образов

```bash
# Загрузить новые образы
docker-compose pull

# Пересоздать контейнеры
docker-compose up -d --force-recreate
```

### Очистка

```bash
# Остановить все сервисы
docker-compose down

# Удалить volumes (ВНИМАНИЕ: удалит все данные!)
docker-compose down -v

# Очистить неиспользуемые образы
docker image prune -a
```

## 📋 Troubleshooting

### Проблема: Контейнер не запускается

```bash
# Проверить логи
docker-compose logs <service_name>

# Проверить конфигурацию
docker-compose config

# Проверить статус
docker-compose ps
```

### Проблема: Ошибка подключения к БД

```bash
# Проверить статус PostgreSQL
docker-compose exec postgres pg_isready

# Проверить логи PostgreSQL
docker-compose logs postgres
```

### Проблема: SSL сертификат не работает

```bash
# Проверить права на файлы
ls -la nginx/ssl/

# Проверить конфигурацию nginx
docker-compose exec nginx nginx -t
```

## 📚 Дополнительная документация

- [11-deployment.md](../../development-plan/11-deployment.md) — План деплоя
- [12-monitoring-and-feedback.md](../../development-plan/12-monitoring-and-feedback.md) — Мониторинг
- [security-policy.md](../../docs/security-policy.md) — Политика безопасности

---

*Документ создан в рамках плана разработки GoldPC.*