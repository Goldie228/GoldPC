# Политика безопасности GoldPC

## 🔐 Обзор

Этот документ описывает политику безопасности для проекта GoldPC. Все разработчики и контрибьюторы обязаны следовать этим правилам.

---

## 1. Управление секретами

### 🚫 Запрещено

- **Никогда** не коммитьте секреты в репозиторий:
  - Пароли
  - API ключи
  - JWT секреты
  - Строки подключения с паролями
  - Приватные ключи
  - Токены доступа

### ✅ Рекомендации

1. **Используйте `.env` файлы локально** (уже добавлены в `.gitignore`)
2. **Копируйте `.env.example`** для создания `.env`
3. **Для production** используйте HashiCorp Vault или облачные сервисы
4. **Ротация секретов** - меняйте секреты регулярно

### 🔧 Инструменты защиты

```bash
# Установка git-secrets
./scripts/setup-git-secrets.sh

# Установка pre-commit хуков
pip install pre-commit
pre-commit install
```

---

## 2. Аутентификация и авторизация

### Пароли

- **Минимум 8 символов**
- **Обязательно:** заглавные, строчные буквы, цифры, спецсимволы
- **Хэширование:** bcrypt с cost factor 12+

### JWT Токены

- **Access Token:** 15 минут
- **Refresh Token:** 7 дней
- **Алгоритм:** HS256 или RS256
- **Валидация:** обязательно проверять issuer, audience, expiration

### RBAC

Роли в системе:
- `Admin` - полный доступ
- `Manager` - управление товарами, заказами, отчёты
- `Employee` - обработка заказов
- `Customer` - просмотр и оформление заказов

---

## 3. Защита от атак

### SQL-инъекции

❌ **Неправильно:**
```csharp
var sql = $"SELECT * FROM Users WHERE Email = '{email}'";
```

✅ **Правильно:**
```csharp
var user = await _db.Users
    .Where(u => u.Email == email)
    .FirstOrDefaultAsync();
```

### XSS

- Используйте `DOMPurify` для санитизации HTML
- Никогда не используйте `dangerouslySetInnerHTML` без санитизации
- CSP headers настроены автоматически

### CSRF

- CSRF токены для всех state-changing операций
- Проверка `Origin` и `Referer` заголовков

### Rate Limiting

- **Общие запросы:** 100 запросов/минута
- **Аутентификация:** 5 попыток/15 минут

---

## 4. Валидация данных

### Обязательно для всех входных данных

1. **Тип данных** - проверка типа
2. **Длина** - минимум/максимум
3. **Формат** - regex для email, телефон и т.д.
4. **Санитизация** - удаление опасных символов

### FluentValidation пример

```csharp
RuleFor(x => x.Email)
    .NotEmpty()
    .EmailAddress()
    .MaximumLength(255);
```

---

## 5. CI/CD Security

### Автоматические проверки

1. **SAST** - SonarQube, Semgrep, CodeQL
2. **Dependency Scan** - Snyk, npm audit, dotnet list --vulnerable
3. **Container Scan** - Trivy
4. **Secret Scan** - Gitleaks, TruffleHog

### Quality Gate

PR не будет слит если:
- ❌ Critical/High уязвимости в коде
- ❌ Critical/High уязвимости в зависимостях
- ❌ Обнаружены секреты в коде
- ❌ Coverage < 70%

---

## 6. Контейнеры

### Требования безопасности

- ✅ Non-root user
- ✅ Read-only root filesystem
- ✅ Drop all capabilities
- ✅ Resource limits
- ✅ Security context в Kubernetes

### Network Policies

- Default deny all
- Явные разрешения только для необходимого трафика

---

## 7. Инциденты безопасности

### При обнаружении уязвимости

1. **Не публикуйте** информацию публично
2. **Сообщите** security team через email или приватный канал
3. **Не коммитьте** исправление в публичный репозиторий
4. **Дождитесь** подтверждения и координации релиза

### SLA для исправления

| Уровень | SLA |
|---------|-----|
| Critical | 24 часа |
| High | 7 дней |
| Medium | 30 дней |
| Low | 90 дней |

---

## 8. Контактная информация

- **Security Team:** security@goldpc.local
- **Security Engineer:** @security-lead
- **Emergency:** +375-XX-XXX-XX-XX

---

## Чек-лист для PR

- [ ] Нет секретов в коде
- [ ] Все тесты проходят
- [ ] SAST без Critical/High
- [ ] Dependencies без Critical/High
- [ ] Coverage >= 70%
- [ ] Документация обновлена
- [ ] Security review (если требуется)

---

*Последнее обновление: 2025-01-09*
</task_progress>
</write_to_file>