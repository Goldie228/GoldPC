# GoldPC Monitoring Stack

Полноценный стек мониторинга для проекта GoldPC, включающий сбор метрик, визуализацию, алертинг и распределённую трассировку.

## Компоненты

| Сервис | Порт | Назначение |
|--------|------|------------|
| **Prometheus** | 9090 | Сбор и хранение метрик |
| **Grafana** | 3001 | Визуализация и дашборды |
| **Alertmanager** | 9093 | Маршрутизация алертов |
| **Jaeger** | 16686 | Распределённая трассировка |
| **Node Exporter** | 9100 | Метрики хоста |
| **Postgres Exporter** | 9187 | Метрики PostgreSQL |
| **Redis Exporter** | 9121 | Метрики Redis |

## Быстрый старт

### Предварительные требования

1. Запущенное приложение GoldPC:
```bash
cd docker
docker compose up -d
```

2. Сеть `goldpc-network` должна существовать

### Запуск стека мониторинга

```bash
cd infrastructure/monitoring
docker compose up -d
```

### Проверка статуса

```bash
docker compose ps
```

## Доступ к интерфейсам

| Интерфейс | URL | Учетные данные |
|-----------|-----|----------------|
| Prometheus | http://localhost:9090 | - |
| Grafana | http://localhost:3001 | admin / admin123 |
| Alertmanager | http://localhost:9093 | - |
| Jaeger UI | http://localhost:16686 | - |

> ⚠️ **Безопасность**: В продакшене измените пароль Grafana через переменную окружения `GRAFANA_ADMIN_PASSWORD`.

## Структура директорий

```
infrastructure/monitoring/
├── docker-compose.yml           # Основной compose файл
├── prometheus/
│   ├── prometheus.yml          # Конфигурация Prometheus
│   └── rules/
│       └── alerts.yml          # Правила алертов
├── alertmanager/
│   └── alertmanager.yml        # Конфигурация алертов
└── grafana/
    └── provisioning/
        ├── datasources/
        │   └── datasources.yml # Источники данных
        └── dashboards/
            ├── dashboards.yml  # Конфигурация дашбордов
            └── goldpc-overview.json # Дашборд
```

## Настройка

### Переменные окружения

Создайте файл `.env` для переопределения настроек:

```env
# Grafana
GRAFANA_ADMIN_PASSWORD=your-secure-password

# Alertmanager (опционально)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
```

### Добавление новых scrape targets

Отредактируйте `prometheus/prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'my-new-service'
    static_configs:
      - targets: ['my-service:8080']
```

### Настройка Slack алертов

1. Создайте Slack Incoming Webhook
2. Обновите `alertmanager/alertmanager.yml`:

```yaml
global:
  slack_api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
```

## Дашборды

### Доступные дашборды

1. **GoldPC Overview** - Общий обзор системы
   - Request Rate
   - Error Rate
   - Response Time (p95/p99)

### Создание нового дашборда

1. Откройте Grafana UI
2. Создайте дашборд через интерфейс
3. Экспортируйте JSON
4. Сохраните в `grafana/provisioning/dashboards/`

## Метрики

### Ключевые метрики приложения

| Метрика | Описание | Порог |
|---------|----------|-------|
| `http_requests_total` | Общее количество запросов | - |
| `http_request_duration_seconds` | Время ответа | p95 < 500ms |
| `orders_created_total` | Созданные заказы | - |
| `orders_completed_total` | Завершённые заказы | - |

### SLA Targets

| Метрика | Целевое значение | Критическое |
|---------|------------------|-------------|
| Uptime | 99.9% | <99.5% |
| API Response Time (p95) | <500ms | >1s |
| API Error Rate | <0.1% | >1% |

## Алерты

### Критические алерты

- **HighErrorRate** - Error rate > 1%
- **ServiceDown** - Сервис недоступен
- **DiskSpaceLow** - Место на диске < 10%

### Предупреждения

- **HighLatency** - p95 latency > 1s
- **DatabaseConnectionsExhausted** - > 80% подключений к БД
- **MemoryUsageHigh** - Использование памяти > 90%

### Бизнес-метрики

- **NoOrdersCreated** - Нет заказов за 30 минут
- **HighCancellationRate** - > 10% отмена заказов

## Интеграция с .NET

### Добавление метрик в сервис

```csharp
// Program.cs
builder.Services.AddOpenTelemetry()
    .WithMetrics(builder => builder
        .AddAspNetCoreInstrumentation()
        .AddPrometheusExporter());

app.MapPrometheusScrapingEndpoint("/metrics");
```

### Добавление трассировки

```csharp
builder.Services.AddOpenTelemetry()
    .WithTracing(builder => builder
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddJaegerExporter(options =>
        {
            options.AgentHost = "jaeger";
            options.AgentPort = 6831;
        }));
```

## Полезные команды

```bash
# Проверка конфигурации Prometheus
docker compose exec prometheus promtool check config /etc/prometheus/prometheus.yml

# Проверка правил алертов
docker compose exec prometheus promtool check rules /etc/prometheus/rules/alerts.yml

# Перезагрузка конфигурации Prometheus
curl -X POST http://localhost:9090/-/reload

# Просмотр активных алертов
curl http://localhost:9090/api/v1/alerts

# Остановка стека
docker compose down

# Остановка с удалением данных
docker compose down -v
```

## Устранение неполадок

### Prometheus не собирает метрики

1. Проверьте, что сервисы запущены: `docker compose ps`
2. Проверьте targets: http://localhost:9090/targets
3. Убедитесь, что сервисы экспортируют метрики на `/metrics`

### Grafana не показывает данные

1. Проверьте datasource: Configuration → Data sources → Prometheus → Test
2. Проверьте логи: `docker compose logs grafana`

### Алерты не отправляются в Slack

1. Проверьте webhook URL
2. Проверьте статус Alertmanager: http://localhost:9093
3. Проверьте логи: `docker compose logs alertmanager`

## Связанные документы

- [12-monitoring-and-feedback.md](../../development-plan/12-monitoring-and-feedback.md) - Архитектура мониторинга
- [docker-compose.yml](../../docker/docker-compose.yml) - Основное приложение