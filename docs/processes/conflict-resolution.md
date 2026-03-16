# Протокол разрешения конфликтов

**Версия документа:** 1.1  
**Последнее обновление:** 2026-03-16  
**Статус:** Активный  

---

## Цель документа

Данный документ определяет правила и процедуры разрешения:
1. **Технических разногласий между ИИ-агентами** — Agent Duel Protocol, Architect Decision
2. **Git merge конфликтов** — стратегии слияния, команды для локального разрешения

Это "Закон", которому следуют агенты при возникновении блокеров и конфликтов.

---

## Типы конфликтов

### Классификация конфликтов

| Тип | Описание | Уровень срочности | Метод разрешения |
|-----|----------|-------------------|------------------|
| **API контракт** | Изменение сигнатуры endpoint'а, структуры данных | 🔴 Высокий | Agent Duel + Peer Vote |
| **Database schema** | Конфликт миграций, изменения структуры БД | 🔴 Высокий | Architect Decision |
| **Frontend/Backend** | Несоответствие данных между клиентом и сервером | 🟡 Средний | Pact tests + Consensus |
| **Shared код** | Дублирование кода, конфликты владения | 🟢 Низкий | Code ownership |
| **Зависимости** | Несовместимые версии пакетов | 🟡 Средний | Architect Decision |
| **Архитектурный** | Разногласия по архитектурным решениям | 🔴 Высокий | ADR + Agent Duel |
| **Именование** | Конфликты имён переменных, классов, файлов | 🟢 Низкий | Consensus |

---

## Процесс разрешения конфликтов

### Общий процесс

```mermaid
flowchart TD
    A["🚨 Обнаружен конфликт"] --> B["📋 Идентификация типа"]
    B --> C["📢 Уведомление координатора"]
    C --> D{Анализ координатором}
    
    D -->|API контракт| E1["⚔️ Agent Duel"]
    D -->|Database schema| E2["👨‍💼 Architect Decision"]
    D -->|Frontend/Backend| E3["🧪 Pact Tests"]
    D -->|Shared код| E4["📝 Code Ownership"]
    D -->|Зависимости| E5["👨‍💼 Architect Decision"]
    D -->|Архитектурный| E6["📜 ADR + Duel"]
    D -->|Именование| E7["🤝 Consensus"]
    
    E1 --> F["✅ Решение принято"]
    E2 --> F
    E3 --> F
    E4 --> F
    E5 --> F
    E6 --> F
    E7 --> F
    
    F --> G["📚 Документирование урока"]
    G --> H["🔔 Уведомление агентов"]
```

### Пошаговый процесс

```yaml
conflict_resolution_process:
  step_1_identification:
    actor: "Агент"
    action: "Определение конфликта"
    output: "Conflict Report"
    template: "docs/templates/conflict-report.md"
    
  step_2_notification:
    actor: "Агент"
    action: "Уведомление координатора"
    output: "Notification to Coordinator"
    channel: "#conflicts Slack channel"
    
  step_3_analysis:
    actor: "Координатор"
    action: "Анализ конфликта"
    questions:
      - "Каков тип конфликта?"
      - "Каково влияние на другие модули?"
      - "Какова срочность решения?"
      - "Сколько агентов затронуто?"
      
  step_4_resolution:
    actor: "Координатор"
    action: "Выбор метода решения"
    methods:
      agent_duel: "Для технических решений с несколькими вариантами"
      architect_decision: "Для архитектурных решений"
      consensus: "Для несущественных разногласий"
      
  step_5_implementation:
    actor: "Агенты"
    action: "Реализация принятого решения"
    output: "Updated Code"
    
  step_6_documentation:
    actor: "Координатор"
    action: "Документирование урока"
    output: "Lesson Learned"
    location: "knowledge-base/lessons-learned/"
```

---

## Agent Duel Protocol

### Описание

**Agent Duel Protocol** — это структурированный процесс разрешения технических разногласий, при котором два или более агента предлагают альтернативные решения, и выбор осуществляется путём голосования.

### Когда применяется

- Изменения API контрактов
- Архитектурные решения с несколькими вариантами
- Выбор технологий или библиотек
- Дизайн-решения, затрагивающие несколько модулей

### Диаграмма процесса

```mermaid
sequenceDiagram
    participant A as Агент A
    participant C as Координатор
    participant B as Агент B
    participant V as Peer Voters
    
    Note over A,B: Фаза 1: Инициация
    A->>C: Предлагает решение X
    B->>C: Предлагает решение Y
    
    Note over C: Фаза 2: Анализ
    C->>C: Проверка на критичность
    C->>C: Определение избирателей
    
    Note over C,V: Фаза 3: Голосование
    C->>V: Отправляет оба решения на голосование
    V->>V: Анализ предложений
    V->>C: Голосуют за лучшее решение
    
    Note over C,A,B: Фаза 4: Результат
    C->>A,B: Объявляет победителя
    C->>C: Документирует решение
    
    Note over C: Фаза 5: Обучение
    C->>KB: Сохраняет урок в базу знаний
```

### Детальные шаги

#### Фаза 1: Инициация (30 минут)

1. **Обнаружение конфликта**
   - Агент выявляет невозможность достичь соглашения
   - Создаётся Conflict Report

2. **Подготовка предложений**
   - Каждый агент готовит своё предложение по форме RFC
   - Предложение должно содержать:
     - Описание проблемы
     - Предлагаемое решение
     - Обоснование (плюсы/минусы)
     - Оценка влияния на другие модули

#### Фаза 2: Анализ (1 час)

1. **Проверка координатором**
   - Определение типа конфликта
   - Оценка критичности
   - Определение круга избирателей

2. **Критерии выбора избирателей**
   ```yaml
   voter_selection:
     required_voters:
       - "TIER-1 архитекторы (всегда)"
       - "Агенты, чьи модули затронуты"
     optional_voters:
       - "TIER-2 разработчики (при необходимости)"
       - "TIER-3 специалисты (по запросу)"
     minimum_voters: 3
     quorum: "50% + 1 голос"
   ```

#### Фаза 3: Голосование (2-4 часа)

1. **Презентация решений**
   - Каждый агент представляет своё решение (в текстовом виде)
   - Ответы на вопросы избирателей

2. **Критерии оценки**
   | Критерий | Вес | Описание |
   |----------|-----|----------|
   | Техническая корректность | 30% | Решение технически обосновано |
   | Совместимость | 25% | Не ломает существующий код |
   | Расширяемость | 20% | Учитывает будущие изменения |
   | Простота | 15% | Минимальная сложность |
   | Сроки реализации | 10% | Быстрота внедрения |

3. **Процесс голосования**
   ```yaml
   voting_process:
     method: "ranked_choice"  # или "simple_majority"
     anonymity: false  # голоса открыты для прозрачности
     tie_breaker: "coordinator_decision"
     deadline: "4 часа с начала голосования"
   ```

#### Фаза 4: Результат (30 минут)

1. **Объявление победителя**
   - Координатор объявляет результат
   - Все агенты обязаны принять решение

2. **Действия при поражении**
   ```yaml
   losing_agent_actions:
     - "Принять решение без обид"
     - "Обновить код в соответствии с решением"
     - "Не создавать новые RFC по тому же вопросу без новых аргументов"
   ```

#### Фаза 5: Обучение (30 минут)

1. **Документирование урока**
   - Что вызвало конфликт
   - Какие решения рассматривались
   - Почему победившее решение лучше
   - Рекомендации на будущее

2. **Сохранение в базе знаний**
   ```
   knowledge-base/lessons-learned/
   └── conflicts/
       └── YYYY-MM-DD-conflict-name.md
   ```

### Шаблоны документов

#### Шаблон Conflict Report

```markdown
# Conflict Report

**ID:** CONFLICT-XXX
**Дата:** YYYY-MM-DD
**Инициатор:** [Имя агента]
**Тип конфликта:** [API контракт | Database schema | ...]

## Описание конфликта

[Подробное описание ситуации]

## Участники

| Агент | Позиция | Модуль |
|-------|---------|--------|
| Agent A | Решение X | Frontend |
| Agent B | Решение Y | Backend |

## Влияние

- Затронутые модули: [...]
- Блокируемые задачи: [...]

## Предлагаемые решения

### Решение A (Agent A)

[Описание решения]

**Плюсы:**
- ...

**Минусы:**
- ...

### Решение B (Agent B)

[Описание решения]

**Плюсы:**
- ...

**Минусы:**
- ...
```

---

## Architect Decision

### Описание

Метод, при котором решение принимает TIER-1 архитектор без голосования. Применяется для:

- Критических архитектурных решений
- Конфликтов миграций базы данных
- Вопросов безопасности

### Процесс

```mermaid
flowchart LR
    A["Конфликт"] --> B["Назначение архитектора"]
    B --> C["Анализ"]
    C --> D["Решение"]
    D --> E["ADR документ"]
    E --> F["Уведомление"]
```

### Шаблон ADR

Используется стандартный шаблон ADR из `contracts/adr/template.md`.

---

## Consensus Protocol

### Описание

Метод для разрешения несущественных разногласий через прямое согласование между агентами.

### Когда применяется

- Именование переменных, функций
- Форматирование кода
- Несущественные UI решения

### Процесс

1. Агенты обсуждают напрямую
2. Пытаются достичь согласия
3. При неудаче — эскалация координатору

```mermaid
flowchart TD
    A["Разногласие"] --> B{"Прямое обсуждение"}
    B -->|Согласие| C["✅ Решение"]
    B -->|Нет согласия 30 мин| D["Эскалация"]
    D --> E["Agent Duel или Architect Decision"]
```

---

## Примеры конфликтов и их решения

### Пример 1: Изменение API контракта

**Конфликт:** Agent A (Frontend) хочет добавить поле `discount` в ответ `/api/products`, Agent B (Backend) считает это избыточным.

**Решение через Agent Duel:**

| Критерий | Решение A | Решение B |
|----------|-----------|-----------|
| Тех. корректность | ✅ Полезно для UI | ✅ Не перегружает API |
| Совместимость | ✅ Additive change | ✅ Без изменений |
| Расширяемость | ✅ Готово к будущему | ⚠️ Потребует изменений позже |

**Результат:** Победило Решение A (голоса 3:1)

**Урок:** Additive changes в API предпочтительнее, когда они решают реальную бизнес-задачу.

### Пример 2: Конфликт миграций БД

**Конфликт:** Agent B создал миграцию, добавляющую колонку `price`, Agent C создал миграцию, переименовывающую таблицу `Products` → `Items`.

**Решение:** Architect Decision

**Решение архитектора:**
1. Отклонить переименование таблицы (breaking change)
2. Принять добавление колонки
3. Создать единый план миграций

**Урок:** Переименование таблиц — критическое изменение, требующее отдельного ADR.

---

## Ответственность и роли

| Роль | Ответственность |
|------|-----------------|
| **Координатор** | Организация процесса, определение метода, объявление результатов |
| **Архитектор (TIER-1)** | Принятие архитектурных решений, участие в голосовании |
| **Агенты (TIER-2/3)** | Предлагание решений, участие в голосовании, выполнение решений |
| **Peer Voters** | Голосование за лучшее решение |

---

## Метрики эффективности

| Метрика | Целевое значение | Измерение |
|---------|------------------|-----------|
| Время разрешения конфликта | < 8 часов | От обнаружения до решения |
| Количество эскалаций | < 10% конфликтов | Duel → Architect |
| Повторяемость конфликтов | 0% | Новые RFC по закрытым вопросам |
| Принятие решений | 100% | Все конфликты должны быть решены |

---

## Git Merge Конфликты

### Стратегии слияния

В проекте GoldPC используются различные стратегии слияния в зависимости от типа ветки:

| Стратегия | Когда использовать | Команда | Плюсы | Минусы |
|-----------|-------------------|---------|-------|--------|
| **Rebase** | Feature branch → develop | `git rebase develop` | Чистая история, линейный граф | Переписывает историю, сложнее при множестве коммитов |
| **Merge commit** | develop → main | `git merge --no-ff develop` | Сохраняет историю, явная точка слияния | "Мёртвые" ветки в истории |
| **Squash** | Мелкие feature branches | `git merge --squash` | Один чистый коммит | Потеря детальной истории |

### Flowchart: Процесс разрешения конфликтов слияния

```mermaid
flowchart TD
    subgraph Detection["🔍 Обнаружение конфликта"]
        A[Попытка слияния] --> B{Конфликт?}
        B -- Нет --> C[✅ Merge успешен]
        B -- Да --> D[🚨 Конфликт обнаружен]
    end
    
    subgraph Classification["📊 Классификация конфликта"]
        D --> E{Тип конфликта?}
        E -- Комментарии/Форматирование --> F[🔧 Автоматическое разрешение]
        E -- Код разных модулей --> G[🖥️ Полуавтоматическое в IDE]
        E -- Код одного модуля --> H[👥 Ручное разрешение]
        E -- Общие зависимости --> I[📦 Architect Decision]
    end
    
    subgraph Resolution["⚙️ Разрешение"]
        F --> J[git checkout --ours/--theirs]
        J --> K[✅ Разрешён]
        
        G --> L[Открыть в VS Code / Rider]
        L --> M[Визуальный выбор изменений]
        M --> N[Тестирование]
        N --> K
        
        H --> O{Кто автор конфликтующего кода?}
        O -- Другой агент --> P[Обсуждение в PR]
        O -- Тот же агент --> Q[Самостоятельное разрешение]
        P --> R[Agent Duel при необходимости]
        R --> S[Принятие решения]
        S --> K
        Q --> K
        
        I --> T[Эскалация архитектору]
        T --> U[ADR решение]
        U --> K
    end
    
    subgraph Verification["✅ Верификация"]
        K --> V[Сборка проекта]
        V --> W{Build OK?}
        W -- Нет --> X[Исправление ошибок]
        X --> V
        W -- Да --> Y[Запуск тестов]
        Y --> Z{Tests OK?}
        Z -- Нет --> X
        Z -- Да --> AA[Commit разрешения]
        AA --> AB[Push и продолжение PR]
    end
```

### Процедура разрешения конфликта (пошагово)

#### Сценарий 1: Rebase для feature branch

Когда ваша feature branch отстаёт от develop, используйте rebase:

```bash
# Шаг 1: Получить последние изменения из develop
git checkout develop
git pull origin develop

# Шаг 2: Переключиться на feature branch
git checkout feature/my-feature

# Шаг 3: Выполнить rebase на develop
git rebase develop

# Шаг 4: При возникновении конфликта Git покажет список конфликтующих файлов
# CONFLICT (content): Merge conflict in src/Services/CatalogService/Controllers/ProductsController.cs
# error: could not apply a1b2c3d... feat: add product filtering

# Шаг 5: Проверить статус конфликтов
git status

# Вывод покажет:
# Unmerged paths:
#   (use "git restore --staged <file>..." to unstage)
#   (use "git add <file>..." to mark resolution)
#         both modified:   src/Services/CatalogService/Controllers/ProductsController.cs

# Шаг 6: Открыть конфликтующий файл и разрешить конфликт
# Файл будет содержать маркеры:
# <<<<<<< HEAD
#     // Ваши изменения
# =======
#     // Изменения из develop
# >>>>>>> a1b2c3d (feat: upstream changes)

# Шаг 7: После разрешения конфликтов добавить файлы
git add src/Services/CatalogService/Controllers/ProductsController.cs

# Шаг 8: Продолжить rebase
git rebase --continue

# Если нужно пропустить текущий коммит:
# git rebase --skip

# Если нужно отменить rebase:
# git rebase --abort

# Шаг 9: После успешного rebase - force push (история переписана!)
git push origin feature/my-feature --force-with-lease
```

#### Сценарий 2: Merge commit для develop → main

При слиянии develop в main используем merge commit:

```bash
# Шаг 1: Получить последние изменения
git checkout main
git pull origin main

# Шаг 2: Слить develop с явным merge commit
git merge --no-ff develop

# При конфликте:
# Auto-merging src/SharedKernel/Entities/BaseEntity.cs
# CONFLICT (content): Merge conflict in src/SharedKernel/Entities/BaseEntity.cs
# Automatic merge failed; fix conflicts and then commit the result.

# Шаг 3: Разрешить конфликты
git status
# Редактировать конфликтующие файлы

# Шаг 4: Добавить разрешённые файлы
git add .

# Шаг 5: Завершить merge commit
git commit -m "Merge develop into main - release v1.2.0"

# Шаг 6: Push в main
git push origin main
```

### Команды для локального разрешения конфликтов

#### Просмотр конфликтов

```bash
# Список конфликтующих файлов
git diff --name-only --diff-filter=U

# Детальный просмотр конфликта
git diff src/Services/CatalogService/Controllers/ProductsController.cs

# Просмотр с контекстом (3 строки до/после)
git diff -U3 src/Services/CatalogService/Controllers/ProductsController.cs
```

#### Автоматическое разрешение

```bash
# Принять свою версию (ваши изменения приоритетны)
git checkout --ours src/path/to/file.cs

# Принять версию из ветки, с которой сливаем
git checkout --theirs src/path/to/file.cs

# Для бинарных файлов
git checkout --ours images/logo.png
git checkout --theirs images/logo.png
```

#### Использование git mergetool

```bash
# Запуск визуального инструмента слияния
git mergetool

# Использование конкретного инструмента
git mergetool --tool=vscode
git mergetool --tool=rider
git mergetool --tool=vimdiff

# Список доступных инструментов
git mergetool --tool-help
```

#### Проверка после разрешения

```bash
# Проверка, все ли конфликты разрешены
git diff --check

# Поиск оставшихся маркеров конфликта
grep -r "<<<<<<< HEAD" src/

# Сборка проекта для проверки
dotnet build

# Запуск тестов
dotnet test
```

### Инструменты разрешения конфликтов

| Инструмент | Назначение | Когда использовать |
|------------|------------|-------------------|
| **Git CLI** | Базовые операции | Простые конфликты, скрипты |
| **VS Code** | Визуальное разрешение | Сложные конфликты в коде |
| **GitHub Web UI** | Простые конфликты | Когда под рукой нет IDE |
| **IntelliJ IDEA / Rider** | Продвинутое разрешение | C# проекты, рефакторинг |

### Настройка VS Code для разрешения конфликтов

```json
// .vscode/settings.json
{
    "git.mergeEditor": true,
    "git.openRepositoryInParentFolders": "always",
    "merge-conflict.autoCheckoutNext": true,
    "merge-conflict.codeLens.enabled": true
}
```

### Типичные сценарии конфликтов

#### Сценарий: Оба агента изменили одну функцию

```csharp
// Ваши изменения (HEAD)
<<<<<<< HEAD
public async Task<IActionResult> GetProducts(int page = 1, int pageSize = 10)
{
    var products = await _productService.GetPagedAsync(page, pageSize);
    return Ok(products);
}
// Изменения из develop
public async Task<IActionResult> GetProducts(ProductFilter filter)
{
    var products = await _productService.GetFilteredAsync(filter);
    return Ok(products);
}
>>>>>>> develop
```

**Решение:** Объединить функциональность:

```csharp
public async Task<IActionResult> GetProducts([FromQuery] ProductFilter filter, int page = 1, int pageSize = 10)
{
    var products = await _productService.GetFilteredPagedAsync(filter, page, pageSize);
    return Ok(products);
}
```

#### Сценарий: Конфликт в lock-файле (package-lock.json)

```bash
# Обычно принимаем версию из develop и переустанавливаем
git checkout --theirs package-lock.json
npm install

# Или регенерируем lock-файл
rm package-lock.json
npm install
```

### Чек-лист разрешения конфликта

```markdown
## Чек-лист разрешения конфликта слияния

### До разрешения
- [ ] Понять природу конфликта (какие изменения конфликтуют)
- [ ] Связаться с автором конфликтующего кода (если возможно)
- [ ] Определить приоритет: какие изменения важнее

### Во время разрешения
- [ ] Не удалять код без понимания последствий
- [ ] Сохранить функциональность обеих сторон если возможно
- [ ] Следовать coding conventions проекта

### После разрешения
- [ ] `dotnet build` — сборка без ошибок
- [ ] `dotnet test` — все тесты проходят
- [ ] Проверить на наличие оставшихся маркеров `<<<<<<<`
- [ ] Code review разрешения конфликта (при сложных случаях)
- [ ] Обновить документацию если необходимо
```

---

## Связанные документы

- [RFC Template](../templates/RFC.md) — Шаблон для предложения изменений
- [ADR Template](../../contracts/adr/template.md) — Шаблон архитектурных решений
- [Development Plan 5.10](../../development-plan/05-parallel-development.md#510-управление-конфликтами) — Исходный раздел
- [Development Plan 9.5](../../development-plan/09-code-review-and-integration.md#95-разрешение-конфликтов-слияния) — Раздел о merge конфликтах

---

*Документ является частью системы управления процессами GoldPC.*
</task_progress>
<task_progress>- [x] Прочитать раздел 5.10 из 05-parallel-development.md
- [x] Создать директорию docs/processes/
- [x] Создать docs/processes/conflict-resolution.md
- [x] Документировать "Agent Duel Protocol"
- [ ] Создать директорию docs/templates/
- [ ] Создать docs/templates/RFC.md
- [ ] Проверить созданную документацию</task_progress>
</write_to_file>