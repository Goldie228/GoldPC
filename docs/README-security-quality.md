# 🔐 Quality & Security Tools Setup

## Обзор

Этот проект настроен для обеспечения качества кода и безопасности на всех этапах разработки.

---

## 📁 Структура файлов

```
kursovaya/
├── .github/
│   ├── workflows/
│   │   ├── quality-gate.yml      # Основные проверки качества
│   │   ├── sast.yml              # Статический анализ безопасности
│   │   ├── dependency-scan.yml   # Сканирование зависимостей
│   │   └── container-scan.yml    # Сканирование контейнеров
│   └── dependabot.yml            # Автообновление зависимостей
├── scripts/
│   ├── neuroslop-check.js        # Детекция ИИ-сгенерированного кода
│   ├── validate-all-dependencies.js # Проверка существования пакетов
│   └── setup-git-secrets.sh      # Установка защиты от секретов
├── docker/
│   ├── backend/Dockerfile        # Безопасный Dockerfile backend
│   └── frontend/Dockerfile       # Безопасный Dockerfile frontend
├── kubernetes/network-policies/
│   ├── default-deny.yaml         # Default deny all traffic
│   └── allow-rules.yaml          # Разрешённый трафик
├── vault/policies/
│   └── goldpc-app.hcl            # Политика Vault для приложения
├── docs/
│   ├── security-policy.md        # Политика безопасности
│   └── quality-assurance.md      # Руководство по качеству
├── .semgrep.yml                  # Правила Semgrep для SAST
├── .pre-commit-config.yaml       # Pre-commit хуки
├── .env.example                  # Шаблон переменных окружения
├── .gitignore                    # Игнорируемые файлы
├── .editorconfig                 # Настройки редактора
├── .snyk                         # Конфигурация Snyk
└── sonar-project.properties      # Конфигурация SonarQube
```

---

## 🚀 Быстрый старт

### 1. Установка pre-commit hooks

```bash
# Установка pre-commit (требуется Python)
pip install pre-commit

# Установка хуков в репозиторий
pre-commit install

# Ручной запуск проверок
pre-commit run --all-files
```

### 2. Установка git-secrets

```bash
# Запуск скрипта установки
chmod +x scripts/setup-git-secrets.sh
./scripts/setup-git-secrets.sh
```

### 3. Копирование .env

```bash
cp .env.example .env
# Отредактируйте .env с реальными значениями
```

---

## ✅ Автоматические проверки

### При каждом коммите (pre-commit)

- 🔍 Поиск секретов (gitleaks, trufflehog)
- 🔍 Приватные ключи
- 🔍 Статический анализ (semgrep)
- 🔍 Детекция нейрослопа
- 🔍 Пробелы в конце строк
- 🔍 Форматирование файлов

### При каждом push/PR (GitHub Actions)

- ✅ ESLint (frontend)
- ✅ dotnet format (backend)
- ✅ Semgrep SAST
- ✅ CodeQL Analysis
- ✅ SonarQube Analysis
- ✅ Snyk dependency scan
- ✅ npm audit
- ✅ dotnet vulnerable packages
- ✅ Trivy container scan
- ✅ Trivy filesystem scan

---

## 🛡️ Detectors

### Semgrep Rules (.semgrep.yml)

Обнаруживает:
- Захардкоженные пароли, API ключи, JWT секреты
- SQL-инъекции
- XSS уязвимости
- Слабую криптографию (MD5, SHA1, DES)
- Проблемы аутентификации
- Ошибки валидации

### Anti-Neuroslop Shield (scripts/neuroslop-check.js)

Обнаруживает:
- Очевидные комментарии
- Over-engineering (тривиальные фабрики, пустые интерфейсы)
- Галлюцинированные зависимости
- Подозрительные паттерны (console.log, debugger, eval)

---

## 📊 Качество кода

### Метрики

| Метрика | Цель | Порог |
|---------|------|-------|
| Code Coverage | ≥70% | <50% блокировка |
| Cyclomatic Complexity | ≤10 | >15 блокировка |
| Cognitive Complexity | ≤15 | >25 блокировка |
| Duplications | <3% | >5% блокировка |
| Security Rating | A | C блокировка |

### Локальные команды

```bash
# Frontend lint
cd src/frontend && npm run lint

# Backend format
dotnet format --verify-no-changes

# Semgrep
semgrep --config .semgrep.yml

# Нейрослоп
node scripts/neuroslop-check.js

# Зависимости
node scripts/validate-all-dependencies.js

# Snyk
snyk test --severity-threshold=high

# Trivy
trivy fs . --severity HIGH,CRITICAL
```

---

## 🔒 Безопасность

### Управление секретами

❌ **Запрещено:**
- Коммитить пароли, ключи, токены
- Использовать реальные секреты в тестах

✅ **Рекомендовано:**
- `.env` файлы локально (добавлены в .gitignore)
- HashiCorp Vault для production
- GitHub Secrets для CI/CD

### SLA исправления уязвимостей

| Уровень | SLA |
|---------|-----|
| Critical | 24 часа |
| High | 7 дней |
| Medium | 30 дней |
| Low | 90 дней |

---

## 📝 Чек-лист для PR

Перед созданием PR убедитесь:

- [ ] Нет секретов в коде (git-secrets, gitleaks)
- [ ] ESLint без ошибок
- [ ] dotnet format без изменений
- [ ] Semgrep без ERROR
- [ ] Coverage ≥ 70%
- [ ] Нет Critical/High уязвимостей
- [ ] Зависимости проверены
- [ ] Документация обновлена

---

## 🆘 Контакты

- **Security Team:** security@goldpc.local
- **QA Engineer:** qa@goldpc.local

---

## 📚 Документация

- [Политика безопасности](docs/security-policy.md)
- [Руководство по качеству](docs/quality-assurance.md)
- [Требования безопасности (ТЗ)](development-plan/appendices/ТЗ_GoldPC.md)
- [Этап 06: Quality Checks](development-plan/06-quality-checks.md)
- [Этап 07: Security](development-plan/07-security.md)
</task_progress>
</write_to_file>