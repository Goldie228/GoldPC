# Quality Assurance для GoldPC

## 📋 Обзор

Этот документ описывает систему обеспечения качества кода для проекта GoldPC.

---

## 1. Статический анализ

### ESLint (Frontend)

ESLint настроен для TypeScript/React с правилами:
- `eslint:recommended` - базовые правила
- `@typescript-eslint/recommended` - TypeScript правила
- `plugin:react/recommended` - React правила
- `plugin:react-hooks/recommended` - Hooks правила
- `plugin:jsx-a11y/recommended` - Доступность

**Запуск:**
```bash
cd src/frontend
npm run lint
```

### StyleCop + Roslyn Analyzers (Backend)

C# статический анализ с StyleCop и Roslyn анализаторами.

**Запуск:**
```bash
dotnet format --verify-no-changes --severity warn
dotnet build --warnaserror
```

### Semgrep

Быстрый статический анализ с кастомными правилами безопасности.

**Запуск:**
```bash
semgrep --config .semgrep.yml
```

---

## 2. Детекция нейрослопа

### Anti-Neuroslop Shield

Скрипт `scripts/neuroslop-check.js` обнаруживает:

- **Очевидные комментарии** - комментарии к тривиальному коду
- **Over-engineering** - избыточные паттерны (тривиальные фабрики, пустые интерфейсы)
- **Галлюцинации** - несуществующие пакеты и API
- **Подозрительные паттерны** - console.log, debugger, eval

**Запуск:**
```bash
node scripts/neuroslop-check.js
```

---

## 3. Метрики качества

### Пороговые значения

| Метрика | Целевое | Мин. допустимое | Блокировка |
|---------|---------|-----------------|------------|
| Code Coverage | ≥70% | 60% | <50% |
| Cyclomatic Complexity | ≤10 | ≤15 | >15 |
| Cognitive Complexity | ≤15 | ≤20 | >25 |
| Duplications | <3% | <5% | >5% |
| Technical Debt Ratio | <5% | <10% | >10% |

### SonarQube

Интеграция с SonarQube для комплексного анализа.

**Запуск:**
```bash
sonar-scanner
```

---

## 4. Сканирование зависимостей

### npm audit

```bash
cd src/frontend
npm audit --audit-level=high
```

### dotnet list --vulnerable

```bash
cd src/backend
dotnet list package --vulnerable --include-transitive
```

### Snyk

```bash
snyk test --severity-threshold=high
```

### Dependabot

Автоматические обновления зависимостей настроены в `.github/dependabot.yml`.

---

## 5. Архитектурные тесты

### NetArchTest (Backend)

Тесты архитектуры для проверки:
- Отсутствия циклических зависимостей
- Правильности слоёв (Core не зависит от Infrastructure)
- Именования и конвенций

```bash
dotnet test --filter "FullyQualifiedName~ArchitectureTests"
```

### Dependency Cruiser (Frontend)

Проверка зависимостей между модулями.

```bash
cd src/frontend
npx depcruise src --config .dependency-cruiser.js
```

---

## 6. CI/CD Pipeline

### Quality Gate Workflow

Автоматически запускается на каждый push и PR:

1. **Lint** - ESLint + dotnet format
2. **SAST** - Semgrep + CodeQL
3. **Dependency Scan** - npm audit + Snyk
4. **Architecture Tests** - NetArchTest + Dependency Cruiser
5. **Coverage** - не менее 70%

---

## 7. Pre-commit Hooks

Установка:
```bash
pip install pre-commit
pre-commit install
```

Проверки при коммите:
- gitleaks - поиск секретов
- detect-private-key - приватные ключи
- semgrep - статический анализ
- neuroslop-check - детекция нейрослопа
- trailing-whitespace - пробелы в конце строк
- end-of-file-fixer - пустая строка в конце файла
- check-yaml / check-json - валидация YAML/JSON

---

## 8. Команды для локальной проверки

```bash
# Все проверки качества
npm run lint                    # ESLint для frontend
dotnet format --verify-no-changes  # dotnet format
node scripts/neuroslop-check.js    # Детекция нейрослопа
node scripts/validate-all-dependencies.js  # Проверка зависимостей

# Безопасность
semgrep --config .semgrep.yml   # SAST
git secrets --scan              # Поиск секретов
trivy fs . --severity HIGH,CRITICAL  # Сканирование файлов

# Тесты
dotnet test --collect:"XPlat Code Coverage"  # Backend tests + coverage
npm run test:coverage           # Frontend tests + coverage

# Архитектура
dotnet test --filter "ArchitectureTests"
npx depcruise src --config .dependency-cruiser.js
```

---

## 9. Критерии готовности (DoD)

Для каждого PR:

- [ ] ESLint без ошибок и warnings
- [ ] StyleCop без ошибок
- [ ] Semgrep без ERROR
- [ ] Нет Critical/High уязвимостей
- [ ] Coverage ≥ 70%
- [ ] Нет галлюцинированных зависимостей
- [ ] Архитектурные тесты проходят
- [ ] Нет секретов в коде

---

*Документ подготовлен: QA Engineer*
*Дата: 2025-01-09*
</task_progress>
</write_to_file>