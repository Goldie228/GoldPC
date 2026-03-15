# ADR-0004: Аутентификация через JWT

## Статус
Принято

## Контекст
Для проекта GoldPC необходимо выбрать стратегию аутентификации и авторизации пользователей.

### Требования
- Stateless аутентификация (масштабируемость)
- Поддержка ролей (Client, Manager, Master, Admin, Accountant)
- Безопасное хранение паролей
- Поддержка refresh токенов
- Интеграция с ASP.NET Core

### Ограничения
- REST API без сессий
- Один фронтенд-клиент
- Соответствие OWASP рекомендациям

### Текущее состояние проекта
Проект уже реализует JWT аутентификацию в AuthService:

```csharp
// AuthService/Program.cs
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"] ?? "GoldPC",
        ValidAudience = jwtSettings["Audience"] ?? "GoldPC",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero
    };
});
```

## Решение
Выбрана **JWT (JSON Web Token)** аутентификация с refresh токенами.

### Обоснование
1. **Stateless** — сервер не хранит сессии, легко масштабировать
2. **Self-contained** — токен содержит все необходимые данные
3. **Стандарт** — широко поддерживается в .NET и JavaScript
4. **RBAC** — роли встроены в токен (claims)

### Архитектура аутентификации

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  Auth API   │────▶│  Database   │
│  (React)    │     │ (JWT Issue) │     │ (Users)     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │   Access Token    │
       │   (15 минут)      │
       │◀──────────────────│
       │                   │
       │   Refresh Token   │
       │   (7 дней)        │
       │◀──────────────────│
       │
       │  API Request + Bearer Token
       │
       ▼
┌─────────────┐
│  Resource   │
│   Services  │
│ (Catalog,   │
│  Orders...) │
└─────────────┘
```

### Токены

| Токен | Срок жизни | Назначение | Хранение |
|-------|------------|------------|----------|
| **Access Token** | 15 минут | Доступ к API | Memory (React state) |
| **Refresh Token** | 7 дней | Обновление access | HttpOnly Cookie |

### Роли пользователей

```csharp
public enum UserRole
{
    Client,      // Клиент — просмотр каталога, заказы
    Manager,     // Менеджер — обработка заказов
    Master,      // Мастер — ремонт, сервис
    Admin,       // Администратор — управление
    Accountant   // Бухгалтер — отчёты
}
```

## Последствия

### Положительные
- ✅ Stateless — легко масштабировать горизонтально
- ✅ Стандартный подход — много библиотек и документации
- ✅ Интеграция с Swagger (Bearer authentication)
- ✅ Claims-based авторизация (роли в токене)
- ✅ Короткий срок access токена — безопасность

### Отрицательные
- ⚠️ Невозможность отзыва access токена (решается коротким сроком)
- ⚠️ Требуется хранение refresh токенов
- ⚠️ XSRF риск для refresh токена в cookie (решается HttpOnly + SameSite)

### Риски
- **Средний риск** — кража токена при компрометации клиента
- Митигация: короткий срок жизни, secure cookies, HTTPS

## Реализация в проекте

### Backend (AuthService)

```csharp
// Services/JwtService.cs
public class JwtService : IJwtService
{
    public string GenerateAccessToken(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };
        
        // Генерация токена с 15-минутным сроком
    }
    
    public string GenerateRefreshToken()
    {
        // Криптографически безопасный random токен
    }
}
```

### Frontend (React)

```typescript
// api/auth.ts
const api = axios.create({
  baseURL: '/api',
});

// Interceptor для добавления токена
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor для обновления токена
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Попытка обновить токен через refresh endpoint
    }
    return Promise.reject(error);
  }
);
```

## Альтернативы

| Альтернатива | Плюсы | Минусы | Причина отклонения |
|--------------|-------|--------|---------------------|
| **Session-based** | Простота, отзыв сессии | Не масштабируется, состояние на сервере | Stateless архитектура |
| **OAuth 2.0 / OIDC** | Внешние провайдеры, SSO | Сложность, внешний сервис | Нет требования к внешней аутентификации |
| **API Keys** | Простота | Нет разграничения прав, нет истечения | Не подходит для пользователей |

## Безопасность

### Рекомендации OWASP (реализовано)
- ✅ Пароли хранятся в хешированном виде (bcrypt/Argon2id)
- ✅ HTTPS обязателен для всех запросов
- ✅ Access токен имеет короткий срок жизни
- ✅ Refresh токен хранится в HttpOnly cookie
- ✅ Валидация всех параметров токена (issuer, audience, signature)

### Защита от атак
| Атака | Защита |
|-------|--------|
| XSS | HttpOnly cookies для refresh токена |
| CSRF | SameSite cookies, CSRF токены |
| Token Theft | Короткий срок жизни, detection механизмы |
| Brute Force | Rate limiting на auth endpoints |

## Ссылки
- [JWT.io](https://jwt.io/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Microsoft: JWT Authentication in ASP.NET Core](https://docs.microsoft.com/en-us/aspnet/core/security/authentication/)
- [AuthService/Program.cs](../../src/AuthService/Program.cs) — реализация

## История изменений
| Дата | Автор | Изменение |
|------|-------|-----------|
| 2026-03-15 | GoldPC Team | Создание |