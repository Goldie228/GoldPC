# Quality Assurance для GoldPC

## 📋 Обзор

Этот документ описывает систему обеспечения качества кода для проекта GoldPC. Руководство для разработчиков по стандартам качества и способам их достижения.

---

## 🎯 Definition of Done (DoD)

### Обязательный чек-лист для каждого PR

Перед слиянием кода в основную ветку **все** следующие критерии должны быть выполнены:

#### Статический анализ

- [ ] **ESLint** — 0 ошибок, 0 warnings
- [ ] **StyleCop** — 0 ошибок
- [ ] **Prettier** — форматирование применено ко всем файлам
- [ ] **Semgrep** — 0 ERROR, только INFO/WARNING допустимы

#### Покрытие тестами

- [ ] **Code Coverage ≥ 70%** — минимум 70% кода покрыто тестами
- [ ] Все новые функции покрыты тестами
- [ ] Критические пути имеют 100% покрытие

#### Метрики качества

- [ ] **Cyclomatic Complexity ≤ 10** — на каждый метод
- [ ] **Cognitive Complexity ≤ 15** — на каждый метод
- [ ] **Дублирование кода < 3%** — не более 3% дублирующегося кода
- [ ] **Maintainability Index ≥ 20** — индекс поддерживаемости

#### Архитектура

- [ ] **Нет циклических зависимостей** — проверено NetArchTest и Dependency Cruiser
- [ ] Архитектурные тесты проходят
- [ ] Соблюдены правила слоёв (Core → Infrastructure → API)

#### Безопасность

- [ ] Нет Critical/High уязвимостей в зависимостях
- [ ] Нет секретов в коде (gitleaks, git-secrets)
- [ ] Нет галлюцинированных/несуществующих зависимостей

#### SonarQube

- [ ] **Quality Gate пройден**
- [ ] Нет новых Bugs и Vulnerabilities
- [ ] Technical Debt Ratio < 5%

---

## 📊 Пороговые значения метрик

### Сводная таблица

| Метрика | ✅ Целевое | ⚠️ Мин. допустимое | ❌ Блокировка | Инструмент |
|---------|-----------|-------------------|---------------|------------|
| Code Coverage | ≥70% | 60% | <50% | Coverlet / Jest |
| Cyclomatic Complexity | ≤10 | ≤15 | >15 | SonarQube, ESLint |
| Cognitive Complexity | ≤15 | ≤20 | >25 | SonarQube |
| Duplications | <3% | <5% | >5% | SonarQube, CPD |
| Technical Debt Ratio | <5% | <10% | >10% | SonarQube |
| Maintainability Index | ≥20 | ≥10 | <10 | CodeClimate |
| Security Rating | A | B | C | SonarQube |
| Reliability Rating | A | B | C | SonarQube |
| Nesting Depth | ≤3 | 4 | >4 | ESLint |
| Function Length | ≤50 строк | 80 строк | >100 строк | ESLint |
| Parameters Count | ≤4 | 5 | >5 | ESLint |

### Детальное описание метрик

#### Cyclomatic Complexity (Цикломатическая сложность)

**Определение:** Количество независимых путей выполнения в коде.

| Значение | Оценка | Действие |
|----------|--------|----------|
| 1-5 | ✅ Отлично | Код простой и понятный |
| 6-10 | ✅ Хорошо | Приемлемая сложность |
| 11-15 | ⚠️ Warning | Требует рефакторинга |
| >15 | ❌ Error | Блокировка, обязателен рефакторинг |

**Пример:**
```csharp
// ✅ Complexity = 1 - идеально
public string GetStatus(bool isActive) 
    => isActive ? "Active" : "Inactive";

// ⚠️ Complexity = 8 - на грани
public decimal CalculateDiscount(
    CustomerType type, 
    decimal amount, 
    bool isLoyal,
    bool hasCoupon)
{
    if (type == CustomerType.VIP)
    {
        if (isLoyal) return amount * 0.3m;
        return amount * 0.2m;
    }
    // ... больше условий
}
```

#### Code Coverage (Покрытие кода)

**Определение:** Процент кода, исполненного во время тестов.

| Значение | Оценка | Действие |
|----------|--------|----------|
| ≥80% | ✅ Отлично | Высокое качество тестов |
| 70-79% | ✅ Норма | Соответствует стандарту |
| 60-69% | ⚠️ Warning | Требуется добавить тесты |
| 50-59% | ⚠️ Warning | Критический уровень |
| <50% | ❌ Error | Блокировка слияния |

**Исключения из покрытия:**
- Миграции Entity Framework
- generated/ код
- DTO классы
- Program.cs (точка входа)

#### No Circular Dependencies (Отсутствие циклических зависимостей)

**Определение:** Модули не должны иметь циклических ссылок друг на друга.

```
❌ Неправильно:
ModuleA → ModuleB → ModuleC → ModuleA (цикл!)

✅ Правильно:
ModuleA → ModuleB → ModuleC
                  ↘ ModuleD
```

**Почему это важно:**
- Циклы усложняют понимание кода
- Проблемы с тестированием
- Сложности при рефакторинге
- Риск бесконечной рекурсии

---

## 🔧 Запуск проверок локально

### Быстрая проверка (рекомендуется перед каждым коммитом)

```bash
# Frontend - линтер и форматирование
cd src/frontend
npm run lint
npm run format

# Backend - форматирование и сборка
dotnet format --verify-no-changes
dotnet build --warnaserror

# Pre-commit (если установлен)
pre-commit run --all-files
```

### Полная проверка качества

#### 1. Статический анализ

```bash
# Frontend ESLint
cd src/frontend
npm run lint -- --max-warnings 0

# Frontend Prettier
npx prettier --check "src/**/*.{ts,tsx,css,json}"

# Backend dotnet format
dotnet format --verify-no-changes --severity warn

# Backend сборка с ошибками warnings
dotnet build --configuration Release --warnaserror

# Semgrep (SAST)
semgrep --config .semgrep.yml
```

#### 2. Детекция нейрослопа

```bash
# Проверка на ИИ-сгенерированный проблемный код
node scripts/neuroslop-check.js

# Валидация всех зависимостей
node scripts/validate-all-dependencies.js
```

#### 3. Метрики покрытия

```bash
# Backend - запуск тестов с покрытием
dotnet test --configuration Release --collect:"XPlat Code Coverage"

# Посмотреть отчёт о покрытии
# Файл: src/*/TestResults/*/coverage.cobertura.xml

# Frontend - запуск тестов с покрытием
cd src/frontend
npm run test:coverage

# Посмотреть отчёт
# Файл: src/frontend/coverage/lcov-report/index.html
```

#### 4. Архитектурные проверки

```bash
# Backend - NetArchTest
dotnet test --filter "FullyQualifiedName~ArchitectureTests"

# Frontend - Dependency Cruiser
cd src/frontend
npx depcruise src --config .dependency-cruiser.js

# С HTML отчётом
npx depcruise src --config .dependency-cruiser.js --output-type err-html > dep-report.html
```

#### 5. Сканирование безопасности

```bash
# npm audit
cd src/frontend
npm audit --audit-level=high

# dotnet vulnerable packages
dotnet list package --vulnerable --include-transitive

# Snyk
snyk test --severity-threshold=high

# Поиск секретов
git secrets --scan
gitleaks detect --source . --verbose

# Trivy сканирование
trivy fs . --severity HIGH,CRITICAL
```

#### 6. SonarQube (при наличии сервера)

```bash
# Сканирование
sonar-scanner \
  -Dsonar.projectKey=goldpc \
  -Dsonar.sources=src \
  -Dsonar.host.url=${SONAR_HOST_URL} \
  -Dsonar.login=${SONAR_TOKEN}

# Или через Docker
docker run --rm \
  -e SONAR_TOKEN=${SONAR_TOKEN} \
  -v "$(pwd):/usr/src" \
  sonarsource/sonar-scanner-cli
```

### Полный скрипт проверки

```bash
#!/bin/bash
# scripts/run-all-quality-checks.sh

echo "🔍 Запуск всех проверок качества..."

echo "\n📋 1. Статический анализ (Frontend)..."
cd src/frontend && npm run lint -- --max-warnings 0 || exit 1

echo "\n📋 2. Статический анализ (Backend)..."
cd ../.. && dotnet format --verify-no-changes --severity warn || exit 1

echo "\n📋 3. Детекция нейрослопа..."
node scripts/neuroslop-check.js || exit 1

echo "\n📋 4. Тесты с покрытием (Backend)..."
dotnet test --collect:"XPlat Code Coverage" || exit 1

echo "\n📋 5. Тесты с покрытием (Frontend)..."
cd src/frontend && npm run test:coverage || exit 1

echo "\n📋 6. Архитектурные тесты..."
cd ../.. && dotnet test --filter "ArchitectureTests" || exit 1

echo "\n📋 7. Dependency Cruiser..."
cd src/frontend && npx depcruise src --config .dependency-cruiser.js || exit 1

echo "\n📋 8. Семантический анализ API..."
spectral lint docs/api/openapi/*.yaml || exit 1

echo "\n✅ Все проверки качества пройдены!"
```

---

## 🛠️ Инструменты анализа

### ESLint (Frontend)

**Конфигурация:** `.eslintrc.cjs`

**Правила сложности:**
```javascript
rules: {
  'complexity': ['error', 10],           // Cyclomatic Complexity
  'max-depth': ['error', 3],             // Nesting Depth
  'max-lines-per-function': ['warn', 50], // Function Length
  'max-lines': ['warn', 300],            // File Length
  'max-params': ['error', 4]             // Parameters Count
}
```

**Запуск:**
```bash
cd src/frontend
npm run lint
npm run lint -- --fix  # автоисправление
```

### StyleCop + Roslyn Analyzers (Backend)

**Конфигурация:** `stylecop.json`, `.editorconfig`

**Установленные анализаторы:**
- `StyleCop.Analyzers` — стиль кода
- `Microsoft.CodeAnalysis.NetAnalyzers` — статический анализ .NET
- `Roslynator.Analyzers` — расширенный анализ
- `SonarAnalyzer.CSharp` — правила SonarQube

**Запуск:**
```bash
dotnet format --verify-no-changes --severity warn
dotnet build --warnaserror
```

### SonarQube

**Конфигурация:** `sonar-project.properties`

```properties
sonar.projectKey=goldpc
sonar.sources=src/backend,src/frontend/src
sonar.csharp.minCoverage=70
sonar.cognitive_complexity.threshold=15
sonar.function.complexity.threshold=10
```

**Запуск:**
```bash
sonar-scanner
```

### NetArchTest (Архитектура)

**Расположение:** `tests/ArchitectureTests/`

**Проверки:**
- Циклические зависимости
- Правильность слоёв
- Именование типов

**Запуск:**
```bash
dotnet test --filter "FullyQualifiedName~ArchitectureTests"
```

### Dependency Cruiser (Frontend)

**Конфигурация:** `.dependency-cruiser.js`

**Правила:**
- Запрет циклических зависимостей
- Проверка слоёв (components не импортирует store напрямую)
- API только из services

**Запуск:**
```bash
cd src/frontend
npx depcruise src --config .dependency-cruiser.js
```

---

## 🔄 CI/CD Pipeline

### Quality Gate Workflow

Автоматически запускается на каждый push и PR:

```yaml
# .github/workflows/quality-gate.yml
jobs:
  quality-check:
    steps:
      # 1. Статический анализ
      - Lint Backend (dotnet format)
      - Lint Frontend (ESLint)
      
      # 2. Детекция нейрослопа
      - Validate Dependencies
      - Validate API Contracts
      
      # 3. Метрики качества
      - Run Tests with Coverage (≥70%)
      
      # 4. SonarQube
      - SonarQube Scan
      - Quality Gate Check
      
      # 5. Архитектура
      - Architecture Tests (NetArchTest)
      - Dependency Cruiser
```

### Pre-commit Hooks

**Установка:**
```bash
pip install pre-commit
pre-commit install
```

**Проверки при коммите:**
- `gitleaks` — поиск секретов
- `detect-private-key` — приватные ключи
- `semgrep` — статический анализ
- `neuroslop-check` — детекция нейрослопа
- `trailing-whitespace` — пробелы в конце строк
- `end-of-file-fixer` — пустая строка в конце файла
- `check-yaml` / `check-json` — валидация YAML/JSON

---

## ⚠️ Частые проблемы и решения

### Cyclomatic Complexity > 10

**Проблема:** Метод слишком сложный.

**Решение:**
```csharp
// ❌ Complexity = 12
public decimal CalculateDiscount(Customer customer, Order order)
{
    if (customer.Type == CustomerType.VIP)
    {
        if (order.Total > 1000)
        {
            if (customer.IsLoyal)
                return 0.3m;
            else
                return 0.2m;
        }
        // ... ещё условия
    }
    // ... ещё условия
}

// ✅ Complexity = 3 (после рефакторинга)
public decimal CalculateDiscount(Customer customer, Order order)
{
    var strategy = _discountStrategyFactory.GetStrategy(customer.Type);
    return strategy.Calculate(customer, order);
}
```

### Code Coverage < 70%

**Проблема:** Недостаточное покрытие тестами.

**Решение:**
1. Запустить отчёт о покрытии
2. Найти непокрытые строки
3. Добавить unit-тесты для критических путей

```bash
# Генерация отчёта
dotnet test --collect:"XPlat Code Coverage"

# Просмотр непокрытых строк
reportgenerator -reports:**/coverage.cobertura.xml -targetdir:coverage-report
```

### Циклические зависимости

**Проблема:** Модули ссылаются друг на друга.

**Решение:**
1. Вынести общий код в отдельный модуль
2. Использовать dependency injection
3. Применить паттерн Mediator

```csharp
// ❌ Цикл: ServiceA → ServiceB → ServiceA

// ✅ Решение: вынести интерфейс в Shared
public interface ISharedInterface { }
// ServiceA реализует ISharedInterface
// ServiceB зависит только от ISharedInterface
```

---

## 📚 Связанные документы

- [06-quality-checks.md](../development-plan/06-quality-checks.md) — План проверок качества
- [07-security.md](../development-plan/07-security.md) — Безопасность
- [security-policy.md](./security-policy.md) — Политика безопасности
- [API-Documentation.md](./API-Documentation.md) — Документация API

---

*Документ обновлён: QA Engineer*  
*Дата: 2025-03-15*