# Blue-Green стратегия деплоя

> **Раздел**: 15_Deployments
> **Версия**: 1.0 | **Последнее обновление**: 2026-05-24

---

## 📋 Обзор

**Blue-Green deployment** — стратегия zero-downtime деплоя, при которой одновременно работают две идентичные production среды (Blue и Green), и трафик переключается между ними через Nginx.

```mermaid
graph TB
    subgraph "Nginx Load Balancer"
        UP[upstream backend]
        SW{Active Slot}
    end

    subgraph "Blue Slot (:5001-:5003, :3000)"
        B1[Catalog :5001]
        B2[PCBuilder :5002]
        B3[Auth :5003]
        B4[Frontend :3000]
    end

    subgraph "Green Slot (:5011-:5013, :3001)"
        G1[Catalog :5011]
        G2[PCBuilder :5012]
        G3[Auth :5013]
        G4[Frontend :3001]
    end

    subgraph "Shared"
        PG[(PostgreSQL)]
        RD[(Redis)]
    end

    SW -->|Active| B1 & B2 & B3 & B4
    SW -.->|Standby| G1 & G2 & G3 & G4
    B1 & G1 --> PG
    B2 & G2 --> PG
    B3 & G3 --> PG & RD
```

---

## 🔄 Процесс деплоя

```mermaid
sequenceDiagram
    participant D as DevOps
    participant NGX as Nginx
    participant G as Green Slot
    participant B as Blue Slot
    participant PG as PostgreSQL

    Note over D,PG: Начальное состояние: Blue активен

    D->>G: Deploy new version
    Note over G: docker compose --profile green up -d
    
    G->>G: Apply migrations
    G->>PG: Read/write in same DB
    
    G->>G: Run health checks
    G-->>D: All healthy
    
    D->>NGX: Switch upstream to Green
    Note over NGX: nginx -s reload
    
    NGX->>NGX: Graceful connection drain
    
    Note over D,PG: Green активен, Blue в standby
    
    D->>B: Stop old version
    Note over B: docker compose stop catalog-blue ...
```

---

## ⚙️ Nginx конфигурация

### upstream.conf (активный)

```nginx
upstream backend {
    # Active slot — GREEN
    server catalog-green:5011 weight=1;
    server pcbuilder-green:5012 weight=1;
    server auth-green:5013 weight=1;
    
    # Standby — BLUE (закомментировано)
    # server catalog-blue:5001;
    # server pcbuilder-blue:5002;
    # server auth-blue:5003;
}

upstream frontend {
    # Active slot — GREEN
    server frontend-green:3001 weight=1;
    
    # Standby — BLUE
    # server frontend-blue:3000;
}
```

### Переключение (upstream-switch.sh)

```bash
#!/bin/bash
# Переключение между Blue и Green

CURRENT_ENV=$1  # "blue" или "green"

if [ "$CURRENT_ENV" = "blue" ]; then
    TARGET_ENV="green"
else
    TARGET_ENV="blue"
fi

# Замена в конфигурации
sed -i "s/catalog-$CURRENT_ENV/catalog-$TARGET_ENV/g" /etc/nginx/conf.d/default.conf
sed -i "s/frontend-$CURRENT_ENV/frontend-$TARGET_ENV/g" /etc/nginx/conf.d/default.conf

# Проверка и перезагрузка
nginx -t && nginx -s reload
echo "Switched from $CURRENT_ENV to $TARGET_ENV"
```

---

## 🚨 Emergency Rollback

### GitHub Actions (rollback.yml)

```yaml
# Ручной запуск
name: Emergency Rollback
on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to rollback to'
        required: true
      reason:
        description: 'Reason for rollback'
        default: 'Emergency rollback'
      skip_health_check:
        type: boolean
        default: false
```

**Процесс rollback**:
1. Pull указанной версии образов из Registry
2. Определить текущий активный слот (blue/green)
3. Развернуть предыдущую версию в неактивный слот
4. Переключить Nginx upstream
5. Healthcheck verification
6. Остановка старого слота
7. Slack уведомление
8. Audit log entry

```mermaid
flowchart LR
    RB[Trigger Rollback] --> PULL[Pull images :version]
    PULL --> DETECT[Detect active slot]
    DETECT --> DEPLOY[Deploy to inactive slot]
    DEPLOY --> SWITCH[Switch Nginx]
    SWITCH --> HEALTH[Health Check]
    HEALTH -->|Pass| STOP[Stop old slot]
    HEALTH -->|Fail| REVERT[Revert Nginx]
    STOP --> NOTIFY[Slack Notification]
    REVERT --> NOTIFY
```

---

## ⏱️ Zero-downtime гарантии

| Аспект | Гарантия |
|---|---|
| **Downtime при деплое** | 0 (graceful Nginx reload) |
| **Downtime при rollback** | < 1 секунда |
| **Потеря соединений** | Nginx gracefully drain |
| **Миграции БД** | Обратно-совместимые (add-only) |
| **Кэш** | Redis общий, прогревается |

### Graceful drain

Nginx при перезагрузке (`nginx -s reload`) завершает текущие соединения, а новые направляет на новый upstream:

```nginx
# Zero-downtime reload
worker_processes auto;
worker_shutdown_timeout 30s;  # Ждём завершения запросов до 30s
```

---

## 💾 Порты сервисов

| Сервис | Dev | Blue | Green |
|---|---|---|---|
| CatalogService | :5000 | :5001 | :5011 |
| PCBuilderService | :5004 | :5002 | :5012 |
| AuthService | :5001 | :5003 | :5013 |
| Frontend | :5173/:3002 | :3000 | :3001 |

### Docker Compose profiles

```bash
# Deploy Blue
docker compose -f docker-compose.prod.yml --profile blue up -d

# Deploy Green
docker compose -f docker-compose.prod.yml --profile green up -d

# Deploy Monitoring
docker compose -f docker-compose.prod.yml --profile monitoring up -d

# Всё сразу
docker compose -f docker-compose.prod.yml --profile all up -d
```

---

## 🔗 Связанные страницы

- [[15_Deployments/Обзор_деплоя]] — общая стратегия
- [[07_Infra_DevOps/Docker_окружение]] — Docker Compose prod
- [[07_Infra_DevOps/GitHub_Actions]] — rollback.yml
- [[17_Tests/Обзор_тестирования]] — тестирование перед деплоем
