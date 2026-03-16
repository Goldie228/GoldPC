# Hardcoded JWT Secret в конфигурации AuthService

## 📋 Метаданные

| Поле | Значение |
|------|----------|
| **Дата** | 2024-03-15 |
| **PR Link** | https://github.com/Goldie228/GoldPC/pull/42 |
| **Категория** | security |
| **Серьёзность** | 🔴 critical |
| **Автор находки** | Human Security Reviewer |
| **Модуль** | AuthService |

---

## 🔴 Problem

### Описание проблемы

В Pull Request #42 был обнаружен захардкоженный JWT секретный ключ непосредственно в файле конфигурации `appsettings.json`. Это критическая уязвимость безопасности, которая позволяет любому, имеющему доступ к репозиторию, получить полный контроль над системой аутентификации.

### Пример кода с проблемой

```json
// src/AuthService/appsettings.json
{
  "JwtSettings": {
    "SecretKey": "MySuperSecretKey123!@#",
    "Issuer": "GoldPC",
    "Audience": "GoldPC.Users",
    "ExpirationInMinutes": 60
  }
}
```

### Местоположение

- **Файл**: `src/AuthService/appsettings.json`
- **Строка**: 3

### Почему это проблема

1. **Утечка секрета**: Файл `appsettings.json` коммитится в репозиторий и становится доступен всем с доступом к коду
2. **Подделка токенов**: Зная секрет, атакующий может создавать валидные JWT токены для любого пользователя
3. **Невозможность ротации**: Смена ключа требует изменения кода и передеплоя
4. **Нарушение compliance**: Нарушает принципы безопасной разработки (OWASP A07:2021 - Identification and Authentication Failures)

---

## ✅ Solution

### Описание решения

Секретный ключ был перемещён в переменные окружения. В конфигурации используется placeholder, который заменяется значением из environment variables при запуске.

### Исправленный код

```json
// src/AuthService/appsettings.json
{
  "JwtSettings": {
    "SecretKey": "${JWT_SECRET_KEY}",
    "Issuer": "GoldPC",
    "Audience": "GoldPC.Users",
    "ExpirationInMinutes": 60
  }
}
```

```csharp
// src/AuthService/Program.cs - загрузка конфигурации
var jwtSettings = new JwtSettings();
configuration.GetSection("JwtSettings").Bind(jwtSettings);

// Переопределение из переменной окружения
var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY");
if (!string.IsNullOrEmpty(secretKey))
{
    jwtSettings.SecretKey = secretKey;
}
```

```yaml
# docker/docker-compose.yml
services:
  auth-service:
    environment:
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
```

```bash
# .env (не коммитится в репозиторий!)
JWT_SECRET_KEY=your-secure-random-key-at-least-32-characters-long
```

### Альтернативные решения

1. **Azure Key Vault / AWS Secrets Manager**: Использование облачного хранилища секретов
2. **HashiCorp Vault**: Централизованное управление секретами
3. **Kubernetes Secrets**: Для развёртывания в K8s

---

## 📊 Impact

### Влияние на проект

| Аспект | Оценка |
|--------|--------|
| **Безопасность** | 🔴 Критическое улучшение - предотвращена потенциальная утечка данных пользователей |
| **Производительность** | ✅ Нет влияния |
| **Поддерживаемость** | ✅ Улучшена - теперь возможна ротация ключей без изменения кода |

### Потенциальные последствия без исправления

- Атакующий мог бы получить административный доступ к системе
- Возможность кражи персональных данных пользователей
- Компрометация всей системы аутентификации
- Юридические последствия (GDPR, нарушение условий использования)

---

## 📚 Lessons Learned

### Ключевой урок

**Никогда не хранить секреты в коде или конфигурационных файлах, коммитящихся в репозиторий. Использовать переменные окружения или специализированные хранилища секретов.**

### Как предотвратить в будущем

- [x] Добавить линтер правило (semgrep rule for hardcoded secrets)
- [x] Добавить unit тест (проверка на placeholder в конфиге)
- [x] Обновить документацию (README.md с инструкцией по настройке окружения)
- [x] Добавить code review чек-лист (пункт о проверке секретов)
- [x] Настроить pre-commit hook с detect-secrets

### Связанные ресурсы

- [OWASP A07:2021](https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/)
- [ADR-0004: Authentication JWT](../../../contracts/adr/0004-authentication-jwt.md)
- [Security Policy](../../../docs/security-policy.md)
- [Git Secrets Setup](../../../scripts/setup-git-secrets.sh)

---

## 🏷️ Теги

`#security` `#code-review` `#lesson-learned` `#jwt` `#secrets` `#critical` `#auth`

---

*Документ урока code review GoldPC.*