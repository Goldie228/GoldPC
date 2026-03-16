# Blue-Green Deployment Documentation

## Обзор

Blue-Green Deployment — это стратегия развертывания, которая обеспечивает нулевой простой (zero-downtime) при обновлении приложений. Используются две идентичные среды (Blue и Green), в любой момент времени только одна из них активна.

## Архитектура

```
┌─────────────────────────────────────────────────────────────────┐
│                         Load Balancer (Nginx)                    │
│                    /etc/nginx/conf.d/upstream.conf               │
└────────────────────────────┬────────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│   BLUE SLOT (Active)    │    │   GREEN SLOT (Inactive) │
│   Ports: 5001-5003,3000 │    │   Ports: 5011-5013,3001 │
├─────────────────────────┤    ├─────────────────────────┤
│ • catalog-blue:5001     │    │ • catalog-green:5011    │
│ • pcbuilder-blue:5002   │    │ • pcbuilder-green:5012  │
│ • auth-blue:5003        │    │ • auth-green:5013       │
│ • frontend-blue:3000    │    │ • frontend-green:3001   │
└─────────────────────────┘    └─────────────────────────┘
              │                             │
              └──────────────┬──────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Shared Infrastructure                         │
│  ┌───────────┐  ┌───────────┐  ┌────────────────────────────┐  │
│  │ PostgreSQL│  │   Redis   │  │   Nginx (Load Balancer)    │  │
│  │   :5432   │  │   :6379   │  │        :80, :443           │  │
│  └───────────┘  └───────────┘  └────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Файлы конфигурации

| Файл | Описание |
|------|----------|
| `.github/workflows/deploy-blue-green.yml` | GitHub Actions workflow для автоматического Blue-Green deployment |
| `docker/docker-compose.prod.yml` | Production Docker Compose с двумя слотами |
| `docker/nginx/nginx.conf` | Основная конфигурация Nginx |
| `docker/nginx/conf.d/upstream.conf` | Конфигурация upstream (управляется deployment скриптом) |

## Процесс развертывания

### 1. Trigger
Деплой запускается автоматически при push в ветку `main`:
```yaml
on:
  push:
    branches: [main]
```

Или вручную через workflow_dispatch с указанием версии.

### 2. Build Job
- Сборка Docker образов для всех сервисов
- Push в GitHub Container Registry (ghcr.io)
- Тегирование: `sha`, `branch`, `latest`

### 3. Deploy Job
```
1. Определение текущего активного слота (Blue/Green)
2. Pull новых Docker образов
3. Запуск контейнеров в НЕактивном слоте
4. Health checks (до 10 попыток с интервалом 10 сек)
5. Переключение Nginx upstream на новый слот
6. Проверка error rate (< 1%)
7. Остановка старого слота
```

### 4. Rollback
Автоматический rollback происходит если:
- Health checks не прошли
- Error rate превысил 1%

Ручной rollback через workflow:
```bash
gh workflow run deploy-blue-green.yml -f version=v1.2.3
```

## Требования к серверу

### Необходимые Secrets в GitHub

| Secret | Описание |
|--------|----------|
| `DEPLOY_HOST` | Хост сервера для деплоя |
| `DEPLOY_USER` | SSH пользователь |
| `DEPLOY_KEY` | SSH приватный ключ |
| `DEPLOY_PORT` | SSH порт (опционально, по умолчанию 22) |
| `SLACK_WEBHOOK` | Webhook для Slack уведомлений (опционально) |

### Структура директорий на сервере

```
/opt/goldpc/
├── docker-compose.prod.yml
├── nginx/
│   ├── nginx.conf
│   ├── conf.d/
│   │   └── upstream.conf
│   └── ssl/
│       ├── goldpc.by.crt
│       └── goldpc.by.key
├── prometheus/
│   └── prometheus.yml
└── grafana/
    └── provisioning/
```

## Локальное тестирование

### Запуск Blue слота
```bash
cd docker
docker compose -f docker-compose.prod.yml --profile blue up -d
```

### Запуск Green слота
```bash
docker compose -f docker-compose.prod.yml --profile green up -d
```

### Переключение между слотами
```bash
# Обновить upstream.conf на green
sed -i 's/-blue/-green/g' nginx/conf.d/upstream.conf

# Перезагрузить Nginx
docker exec goldpc-nginx nginx -s reload
```

## Health Check Endpoints

| Сервис | Endpoint |
|--------|----------|
| CatalogService | `http://localhost:5001/health` |
| PCBuilderService | `http://localhost:5002/health` |
| AuthService | `http://localhost:5003/health` |
| Frontend | `http://localhost:3000/health` |
| Nginx | `http://localhost/health` |

## Мониторинг

### Prometheus Metrics
Если включен профиль `monitoring`:
```bash
docker compose -f docker-compose.prod.yml --profile blue --profile monitoring up -d
```

- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3002`

### Логи
```bash
# Логи всех сервисов Blue слота
docker compose -f docker-compose.prod.yml logs catalog-blue pcbuilder-blue auth-blue frontend-blue

# Логи Nginx
docker logs goldpc-nginx
```

## Troubleshooting

### Проблема: Health check failed
```bash
# Проверить статус контейнеров
docker ps -a

# Проверить логи
docker logs goldpc-catalog-green

# Проверить health check вручную
curl -f http://localhost:5011/health
```

### Проблема: Nginx не переключается
```bash
# Проверить конфигурацию
docker exec goldpc-nginx nginx -t

# Перезагрузить принудительно
docker exec goldpc-nginx nginx -s reload
```

### Проблема: Образ не найден
```bash
# Проверить наличие образа
docker images | grep goldpc

# Pull образ вручную
docker pull ghcr.io/OWNER/goldpc-catalog:latest
```

## Best Practices

1. **Всегда тестируйте в staging** перед production деплоем
2. **Используйте семантическое версионирование** для тегов образов
3. **Мониторьте метрики** после каждого деплоя
4. **Держите rollback наготове** — проверяйте процедуру периодически
5. **Бэкапьте базу данных** перед миграциями

## Связанные документы

- [11-deployment.md](../development-plan/11-deployment.md) — План деплоя
- [12-monitoring-and-feedback.md](../development-plan/12-monitoring-and-feedback.md) — Мониторинг