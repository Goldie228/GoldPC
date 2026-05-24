# Docker окружение GoldPC

> **Раздел**: 07_Infra_DevOps
> **Версия**: 1.0 | **Последнее обновление**: 2026-05-24

---

## 🐳 docker-compose.yml (Development)

**9 сервисов, 5 volumes, bridge network.**

```yaml
services:
  postgres:         # PostgreSQL 16-alpine, :5434
  postgres-replica: # PostgreSQL реплика, :5435
  rabbitmq:         # RabbitMQ 3-management, :5672
  redis:            # Redis 7-alpine, :6379
  catalog.api:      # CatalogService :9081
  auth.api:         # AuthService :9082
  frontend:         # React + Nginx :3002
  adminer:          # Adminer UI :9090
```

### Volumes

| Volume | Назначение |
|---|---|
| `postgres_data` | Данные PostgreSQL |
| `redis_data` | Данные Redis |
| `rabbitmq_data` | Данные RabbitMQ |

### Запуск

```bash
docker compose -f docker/docker-compose.yml up -d
```

### Healthchecks

| Сервис | Команда | Interval | Retries |
|---|---|---|---|
| PostgreSQL | `pg_isready -U postgres` | 10s | 5 |
| Redis | `redis-cli ping` | 10s | 5 |
| RabbitMQ | `rabbitmq-diagnostics ping` | 10s | 5 |
| CatalogService | `curl -f http://localhost:8080/health` | 30s | 5 |
| AuthService | `curl -f http://localhost:8080/` | 30s | 5 |

---

## 🐳 docker-compose.prod.yml (Production)

**18 сервисов, 2 профиля (blue/green), 5 volumes.**

### Blue профиль

| Сервис | Контейнер | Порт |
|---|---|---|
| `catalog-blue` | `goldpc-catalog-blue` | :5001 |
| `pcbuilder-blue` | `goldpc-pcbuilder-blue` | :5002 |
| `auth-blue` | `goldpc-auth-blue` | :5003 |
| `frontend-blue` | `goldpc-frontend-blue` | :3000 |

### Green профиль

| Сервис | Контейнер | Порт |
|---|---|---|
| `catalog-green` | `goldpc-catalog-green` | :5011 |
| `pcbuilder-green` | `goldpc-pcbuilder-green` | :5012 |
| `auth-green` | `goldpc-auth-green` | :5013 |
| `frontend-green` | `goldpc-frontend-green` | :3001 |

### Nginx Load Balancer

```yaml
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ./nginx/conf.d:/etc/nginx/conf.d:ro
    - ./nginx/ssl:/etc/nginx/ssl:ro
```

### Мониторинг (профиль monitoring)

| Сервис | Порт | Описание |
|---|---|---|
| Prometheus | :9090 | Сбор метрик |
| Grafana | :3002 | Визуализация |

### Redis Production

```yaml
redis:
  command: redis-server --appendonly yes --maxmemory 2gb --maxmemory-policy allkeys-lru
```

---

## 🐳 docker-compose.test.yml (Testing)

**7 сервисов, tmpfs (in-memory) для быстрых тестов.**

```yaml
services:
  postgres-test:    # :5433, tmpfs
  redis-test:       # :6380, tmpfs  
  catalogservice-test:  # :5001
  pcbuilderservice-test: # :5002
  authservice-test:     # :5003
  frontend-test:        # :3000
  playwright:           # E2E runner
  k6:                   # Load testing (профиль load)
```

### Использование tmpfs

```yaml
postgres-test:
  tmpfs:
    - /var/lib/postgresql/data

redis-test:
  tmpfs:
    - /data
```

### Playwright + k6

```yaml
playwright:
  image: mcr.microsoft.com/playwright:v1.40.0-jammy
  command: npx playwright test --reporter=html
  environment:
    - BASE_URL=http://frontend-test:8080
    - CI=true

k6:
  image: grafana/k6:latest
  command: run /scripts/k6.config.js
  profiles:
    - load
```

---

## 🏗️ Dockerfile структура

Все Dockerfile используют **multi-stage сборку** и **non-root пользователей**.

### Backend (CatalogService — пример)

```dockerfile
# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY src/CatalogService/CatalogService.csproj .
RUN dotnet restore
COPY src/CatalogService/ .
RUN dotnet publish -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Non-root user
RUN adduser --disabled-password --gecos '' appuser
USER appuser

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s --retries=5 \
  CMD curl -f http://localhost:8080/health || exit 1
ENTRYPOINT ["dotnet", "CatalogService.dll"]
```

### Frontend (React + Nginx)

```dockerfile
# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime - Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf
RUN adduser -D -H -u 1000 appuser && chown -R appuser /usr/share/nginx/html
USER appuser
```

---

## 🌐 Nginx конфигурация

### Security Headers

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://auth.goldpc.by;
  frame-ancestors 'none';
" always;
```

### Rate Limiting

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=50r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

location /api/v1/auth/login {
    limit_req zone=login burst=3 nodelay;
    proxy_pass http://backend;
}

location /api/ {
    limit_req zone=api burst=100 nodelay;
    proxy_pass http://backend;
}
```

### SSL

```nginx
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
```

### Blue-Green Upstream

```nginx
upstream backend {
    server catalog-blue:5001 weight=1;
    server pcbuilder-blue:5002 weight=1;
    server auth-blue:5003 weight=1;
    # При деплое переключается на green:
    # server catalog-green:5011 weight=1;
    # server pcbuilder-green:5012 weight=1;
    # server auth-green:5013 weight=1;
}
```

### Логирование

```nginx
log_format json_combined escape=json
    '{'
    '"time_local":"$time_local",'
    '"remote_addr":"$remote_addr",'
    '"request":"$request",'
    '"status":$status,'
    '"body_bytes_sent":$body_bytes_sent,'
    '"http_referrer":"$http_referer",'
    '"http_user_agent":"$http_user_agent",'
    '"request_time":$request_time,'
    '"upstream_addr":"$upstream_addr",'
    '"upstream_response_time":"$upstream_response_time"'
    '}';

access_log /var/log/nginx/access.log json_combined;
```

---

## 🔗 Связанные страницы

- [[07_Infra_DevOps/Обзор_инфраструктуры]] — общая инфраструктура
- [[07_Infra_DevOps/GitHub_Actions]] — CI/CD
- [[15_Deployments/Обзор_деплоя]] — деплой
- [[08_Security/Обзор_безопасности]] — безопасность
