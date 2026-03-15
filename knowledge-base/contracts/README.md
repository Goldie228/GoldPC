# Контракты в Базе Знаний

## 📋 Назначение

Эта директория содержит символические ссылки на API контракты проекта GoldPC для удобного внедрения в контекст агентов.

## 📁 Структура

```
contracts/
├── openapi/         # OpenAPI спецификации REST API
│   ├── auth.yaml
│   ├── catalog.yaml
│   ├── orders.yaml
│   ├── services.yaml
│   └── pc-builder.yaml
├── asyncapi/        # AsyncAPI спецификации событий
│   └── events.yaml
└── pacts/           # Pact контрактные тесты
    ├── frontend-catalog.json
    └── frontend-orders.json
```

## 🔗 Источник контрактов

Основные контракты находятся в директории `/contracts/` проекта:

- OpenAPI: `/contracts/openapi/v1/`
- AsyncAPI: `/contracts/asyncapi/v1/`
- Pacts: `/contracts/pacts/`

## 📝 Использование

Контракты внедряются в контекст агентов согласно конфигурации `knowledge-injection.yaml`:

```yaml
agent_a:
  injected_knowledge:
    contracts:
      - path: "contracts/openapi/catalog.yaml"
        priority: "high"
```

---

*Документ базы знаний GoldPC.*