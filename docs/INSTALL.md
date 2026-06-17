# Инсталляционное руководство GoldPC

## 1. Требования

### 1.1 Серверное оборудование

| Параметр | Минимум | Рекомендуется |
|----------|---------|---------------|
| CPU | 4+ ядер | 8+ ядер |
| RAM | 8+ ГБ | 16+ ГБ |
| Диск | 100+ ГБ SSD | 200+ ГБ SSD |
| Сеть | 100 Мбит/с | 1 Гбит/с |

### 1.2 Программное обеспечение

| Компонент | Требование |
|-----------|------------|
| ОС | Ubuntu 22.04 LTS |
| Docker | 20.10+ |
| Docker Compose | v2.0+ |
| Git | 2.0+ |

## 2. Установка Docker

```bash
# Установка Docker и Docker Compose
sudo apt update && sudo apt install -y docker.io docker-compose-plugin

# Добавление текущего пользователя в группу docker
sudo usermod -aG docker $USER

# Перелогиньтесь для применения изменений
newgrp docker
```

**Проверка:**

```bash
docker --version
docker compose version
```

## 3. Клонирование проекта

```bash
git clone https://github.com/goldpc/GoldPC.git
cd GoldPC
```

## 4. Настройка переменных окружения

Создайте `.env` файл в корне проекта:

```bash
touch .env
```

Заполните содержимое:

```env
# ============================================
# DATABASE
# ============================================
POSTGRES_USER=goldpc
POSTGRES_PASSWORD=<секретный_пароль>
POSTGRES_DB=goldpc_catalog

# ============================================
# REDIS
# ============================================
REDIS_PASSWORD=<секретный_пароль>

# ============================================
# JWT AUTHENTICATION
# ============================================
JWT_SECRET_KEY=<минимум_32_символа>

# ============================================
# ENCRYPTION (для sensitive данных)
# ============================================
ENCRYPTION_KEY=<Base64 32 bytes>

# ============================================
# SMTP (Email уведомления)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASSWORD=app_password

# ============================================
# STRIPE (Платежи)
# ============================================
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# ============================================
# FRONTEND
# ============================================
VITE_API_URL=http://localhost:5000
```

> **⚠️ ВАЖНО:** Никогда не коммитьте `.env` файл в репозиторий. Убедитесь, что он добавлен в `.gitignore`.

## 5. Запуск

### Development режим

```bash
./scripts/dev-local.sh
```

### Production режим

```bash
docker compose -f docker/docker-compose.prod.yml up -d
```

## 6. Инициализация БД

Миграции Applied автоматически при первом запуске приложения.

Для ручного выполнения миграций:

```bash
dotnet ef database update --project src/CatalogService
```

## 7. Seed данных

### Создание admin пользователя

```bash
./scripts/seed-data/seed-admin-user.sh
```

**Данные по умолчанию:**
- Email: `admin@goldpc.by`
- Пароль: `G0ldPC#Adm1n2026!`

> **⚠️ ВАЖНО:** Обязательно смените пароль администратора после первого входа!

## 8. Проверка работоспособности

| Сервис | URL |
|--------|-----|
| Frontend | http://localhost:5173 |
| API Gateway | http://localhost:5000 |
| Swagger | http://localhost:5000/swagger |
| Adminer | http://localhost:8080 |

## 9. Настройка SSL (Production)

### Установка Certbot

```bash
sudo apt install -y certbot
```

### Получение сертификата

```bash
sudo certbot certonly --standalone -d goldpc.by
```

### Конфигурация Nginx

См. директорию `docker/nginx/` для шаблонов конфигурации.

## 10. Резервное копирование

### Ежедневный бэкап через cron

```bash
# Открыть crontab
crontab -e

# Добавить строку (бэкап каждый день в 2:00)
0 2 * * * /path/to/scripts/db/migrate.sh --backup
```

### Ручной бэкап

```bash
docker exec goldpc-postgres pg_dump -U goldpc goldpc_catalog > backup_$(date +%Y%m%d).sql
```

## 11. Обновление

```bash
# Получение последних изменений
git pull

# Пересборка и перезапуск контейнеров
docker compose -f docker/docker-compose.prod.yml up -d --build
```

## 12. Откат

```bash
# Просмотр истории коммитов
git log --oneline -10

# Откат к нужному коммиту
git checkout <commit_hash>

# Пересборка
docker compose -f docker/docker-compose.prod.yml up -d --build
```

## 13. Известные проблемы

| Проблема | Решение |
|----------|---------|
| PostgreSQL порт 5434 (не стандартный 5432) | Используйте порт 5434 при подключении |
| AuthService порт 5001 | Сервис аутентификации доступен на порту 5001 |
| RabbitMQ отключён по умолчанию | Включите в `docker-compose.yml` при необходимости |
