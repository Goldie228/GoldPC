# Задача: Исправить ServicesService — таймаут в Docker

> **Приоритет:** Critical  
> **Статус:** ✅ Исправлена  
> **Корневая причина:** ServicesService полностью отсутствовал в Docker-инфраструктуре

---

## Диагноз

ServicesService (ASP.NET Core 8, порт 5003) — рабочий микросервис в исходном коде, но:

| Проблема | Где | Влияние |
|----------|-----|---------|
| ❌ Нет сервиса в docker-compose.yml | `docker/docker-compose.yml` | Docker Compose не запускает сервис |
| ❌ Нет Dockerfile.ServicesService | `docker/` | Не из чего собрать образ |
| ❌ ConnectionString = `localhost:5434` | `src/ServicesService/appsettings.json` | В Docker нужно `postgres:5432` |
| ❌ `app.UseHttpsRedirection()` | `src/ServicesService/Program.cs` | Healthcheck получит 308 вместо 200 |
| ❌ Нет nginx upstream | `docker/nginx/nginx.conf` | Фронтенд не может достучаться |
| ❌ Имя в start-dev.sh не совпадает | `scripts/start-dev.sh` | `servicesservice` vs `services.api` |
| ⚠️ `Database.Migrate()` на старте | `Program.cs` строки ~72 | Медленный запуск |

---

## План исправления (по шагам)

### Шаг 1: Исправить ConnectionString для Docker

Файл: `src/ServicesService/appsettings.json`

Добавить профиль `Docker`:
```json
{
  "Kestrel:Endpoints:Http:Url": "http://0.0.0.0:5003",
  "ConnectionStrings:DefaultConnection": "Host=postgres;Port=5432;Database=goldpc_services;Username=postgres;Password=postgres"
}
```

Или использовать переменные окружения (рекомендуется):
```bash
ConnectionStrings__DefaultConnection="Host=postgres;Port=5432;..."
```

### Шаг 2: Исправить `app.UseHttpsRedirection()`

Файл: `src/ServicesService/Program.cs`

```csharp
// Раскомментировать только если HTTPS настроен
// if (!builder.Environment.IsDevelopment())
// {
//     app.UseHttpsRedirection();
// }
```

В Docker всегда Development-режим для простоты.

### Шаг 3: Создать Dockerfile.ServicesService

Файл: `docker/Dockerfile.ServicesService`

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY src/ServicesService/ServicesService.csproj .
RUN dotnet restore
COPY src/ServicesService/ .
RUN dotnet publish -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .
EXPOSE 5003
ENV ASPNETCORE_ENVIRONMENT=Docker
ENV Kestrel__Endpoints__Http__Url=http://0.0.0.0:5003
ENV ConnectionStrings__DefaultConnection="Host=postgres;Port=5432;Database=goldpc_services;Username=postgres;Password=postgres"

HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:5003/health || exit 1

ENTRYPOINT ["dotnet", "ServicesService.dll"]
```

### Шаг 4: Добавить сервис в docker-compose.yml

Файл: `docker/docker-compose.yml`

После `auth.api`:
```yaml
services.api:
  build:
    context: ..
    dockerfile: docker/Dockerfile.ServicesService
  container_name: goldpc-services
  ports:
    - "5003:5003"
  environment:
    - ASPNETCORE_ENVIRONMENT=Docker
    - ConnectionStrings__DefaultConnection=Host=postgres;Port=5432;Database=goldpc_services;Username=postgres;Password=postgres
    - RabbitMq__Host=rabbitmq
    - Redis__ConnectionString=redis:6379
  depends_on:
    postgres:
      condition: service_healthy
    rabbitmq:
      condition: service_healthy
    redis:
      condition: service_healthy
  networks:
    - goldpc-network
  restart: unless-stopped
```

### Шаг 5: Добавить nginx upstream

Файл: `docker/nginx/nginx.conf`

В секцию `upstream`:
```nginx
upstream services_service {
    server services.api:5003;
}
```

В секцию `server` (после других location для API):
```nginx
location /api/v1/services/ {
    proxy_pass http://services_service;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### Шаг 6: Синхронизировать имена в start-dev.sh

Файл: `scripts/start-dev.sh`

Проверить строку ~211:
```bash
# Было (неправильные имена):
$DOCKER_COMPOSE up -d catalogservice pcbuilderservice authservice servicesservice warrantyservice

# Должно стать (имена из docker-compose.yml):
$DOCKER_COMPOSE up -d catalog.api auth.api services.api
```

---

## Критерии готовности

- [ ] `docker compose up services.api` запускается без ошибок
- [ ] `curl localhost:5003/health` возвращает 200
- [ ] `curl localhost:5003/api/v1/services/service-types` возвращает JSON (пустой массив или данные)
- [ ] Nginx проксирует `/api/v1/services/*` на ServicesService
- [ ] Docker Compose startup не таймаутит
- [ ] Фронтенд получает данные с `/api/v1/services/*`

---

## Примечания

- `WarrantyService` (порт 5004) вероятно имеет те же проблемы — проверить после фикса ServicesService
- `PCBuilderService` (порт 5002) уже есть в docker-compose.yml как `pcbuilder.api` — можно использовать как референс
- В production (`docker/docker-compose.prod.yml`) тоже отсутствуют ServicesService и WarrantyService
