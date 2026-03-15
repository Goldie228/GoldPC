# 📚 База знаний GoldPC

## Назначение

База знаний проекта GoldPC предназначена для внедрения контекста в ИИ-агентов, участвующих в параллельной разработке. Структура и содержимое базы знаний позволяют агентам получать релевантную информацию о паттернах, контрактах и извлечённых уроках.

---

## 📁 Структура

```
knowledge-base/
├── patterns/                    # Паттерны проектирования и best practices
│   ├── repository-pattern.md    # Generic Repository pattern (C#)
│   ├── react-best-practices.md  # React hooks и компоненты
│   ├── cqrs.md                  # CQRS паттерн (планируется)
│   ├── domain-events.md         # Domain Events (планируется)
│   └── saga.md                  # Saga pattern (планируется)
│
├── contracts/                   # API контракты
│   └── README.md               # Описание структуры контрактов
│
├── lessons-learned/             # Уроки, извлечённые из разработки
│   ├── README.md               # Шаблоны и категории уроков
│   ├── frontend/               # Уроки Frontend разработки
│   ├── backend/                # Уроки Backend разработки
│   ├── testing/                # Уроки тестирования
│   └── devops/                 # Уроки DevOps
│
├── architecture/                # Архитектурные документы (планируется)
│   ├── c4/                     # C4 диаграммы
│   └── adr/                    # Architecture Decision Records
│
└── knowledge-injection.yaml     # Конфигурация внедрения знаний
```

---

## 🤖 Агенты и их знания

| Агент | Роль | Основные документы |
|-------|------|-------------------|
| **Agent A** | Frontend Developer | `react-best-practices.md`, OpenAPI контракты |
| **Agent B** | Backend Core | `repository-pattern.md`, Auth/Catalog API |
| **Agent C** | Backend Services | `domain-events.md`, `saga.md`, Orders API |
| **Agent D** | QA Engineer | `testing-strategies.md`, Pact контракты |
| **Coordinator** | Архитектор | Все документы, ADR |

---

## 🔧 Использование

### Внедрение в контекст агента

Конфигурация внедрения определяется в файле `knowledge-injection.yaml`:

```yaml
agents:
  agent_a:
    role: "Frontend Developer"
    injected_knowledge:
      patterns:
        - path: "patterns/react-best-practices.md"
          priority: "high"
      contracts:
        - path: "contracts/openapi/catalog.yaml"
          priority: "high"
```

### Обновление базы знаний

1. **Паттерны** — добавляются при внедрении новых архитектурных решений
2. **Контракты** — обновляются при изменении API (автоматически)
3. **Уроки** — добавляются по результатам ретроспектив

---

## 📋 Доступные документы

### Patterns

| Документ | Описание | Статус |
|----------|----------|--------|
| [repository-pattern.md](./patterns/repository-pattern.md) | Generic Repository pattern для C# | ✅ Готов |
| [react-best-practices.md](./patterns/react-best-practices.md) | React hooks и компоненты | ✅ Готов |
| cqrs.md | CQRS паттерн | 📝 Планируется |
| domain-events.md | Domain Events паттерн | 📝 Планируется |
| saga.md | Saga pattern для распределённых транзакций | 📝 Планируется |

### Contracts

См. [contracts/README.md](./contracts/README.md)

### Lessons Learned

См. [lessons-learned/README.md](./lessons-learned/README.md)

---

## 🔄 Поддержка

База знаний поддерживается Координатором (TIER-1) и обновляется:

- При изменении архитектурных решений
- По результатам ретроспектив спринтов
- При выявлении новых best practices

---

*База знаний GoldPC — версия 1.0*