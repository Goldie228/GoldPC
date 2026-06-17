using System.Runtime.InteropServices;
using System.Security.Cryptography;

namespace GoldPC.Api.Middleware;

/// <summary>
/// Middleware для защиты от CSRF-атак через токены.
///
/// Логика:
/// 1. Генерирует криптографически стойкий токен (GUID) и сохраняет в HTTP-only cookie "XSRF-TOKEN"
/// 2. Проверяет заголовок "X-XSRF-TOKEN" при POST/PUT/DELETE/PATCH запросах
/// 3. Пропускает безопасные методы (GET/HEAD/OPTIONS)
/// 4. Пропускает запросы с JWT Bearer авторизацией (Bearer токен уже защищает от CSRF)
///
/// Токен живёт сессионно (Expires = не задано, MaxAge = 1 день для удобства).
/// </summary>
public sealed class CsrfMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<CsrfMiddleware> _logger;

    /// <summary>
    /// Имя cookie для хранения CSRF-токена.
    /// </summary>
    public const string CookieName = "XSRF-TOKEN";

    /// <summary>
    /// Имя заголовка, в котором фронтенд передаёт CSRF-токен.
    /// </summary>
    public const string HeaderName = "X-XSRF-TOKEN";

    /// <summary>
    /// HTTP-методы, требующие CSRF-проверки.
    /// </summary>
    private static readonly HashSet<string> UnsafeMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        "POST", "PUT", "DELETE", "PATCH"
    };

    public CsrfMiddleware(RequestDelegate next, ILogger<CsrfMiddleware> logger)
    {
        ArgumentNullException.ThrowIfNull(next);

        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Устанавливаем CSRF-токен в cookie, если его ещё нет
        EnsureCsrfCookie(context);

        // Проверяем CSRF-токен только для unsafe методов
        if (UnsafeMethods.Contains(context.Request.Method))
        {
            // Пропускаем запросы с JWT Bearer авторизацией — Bearer токен уже защищает от CSRF,
            // так как браузер не прикрепляет Authorization header автоматически cross-origin
            if (HasBearerToken(context))
            {
                await _next(context);
                return;
            }

            // Проверяем наличие и валидность CSRF-токена
            if (!ValidateCsrfToken(context))
            {
                _logger.LogWarning(
                    "CSRF token validation failed for {Method} {Path}",
                    context.Request.Method,
                    context.Request.Path);

                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsJsonAsync(new
                {
                    error = "CSRF token missing or invalid",
                    message = "Заголовок X-XSRF-TOKEN отсутствует или не совпадает с cookie"
                });
                return;
            }
        }

        await _next(context);
    }

    /// <summary>
    /// Устанавливает CSRF-токен в cookie, если он ещё не установлен.
    /// Токен — криптографически стойкий случайный GUID.
    /// </summary>
    private static void EnsureCsrfCookie(HttpContext context)
    {
        if (context.Request.Cookies.ContainsKey(CookieName))
            return;

        var token = GenerateToken();

        context.Response.Cookies.Append(CookieName, token, new CookieOptions
        {
            HttpOnly = false,      // JavaScript должен читать этот токен (не HTTP-only!)
            Secure = true,         // Только по HTTPS
            SameSite = SameSiteMode.Strict,
            Path = "/",
            MaxAge = TimeSpan.FromDays(1)  // Сессионный, но с разумным сроком жизни
        });
    }

    /// <summary>
    /// Генерирует криптографически стойкий CSRF-токен.
    /// </summary>
    private static string GenerateToken()
    {
        // Используем RandomNumberGenerator для криптографической стойкости
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes);
    }

    /// <summary>
    /// Проверяет CSRF-токен: заголовок X-XSRF-TOKEN должен совпадать с cookie XSRF-TOKEN.
    /// </summary>
    private static bool ValidateCsrfToken(HttpContext context)
    {
        // Получаем токен из заголовка
        if (!context.Request.Headers.TryGetValue(HeaderName, out var headerValues))
            return false;

        var headerToken = headerValues.FirstOrDefault();
        if (string.IsNullOrEmpty(headerToken))
            return false;

        // Получаем токен из cookie
        if (!context.Request.Cookies.TryGetValue(CookieName, out var cookieToken))
            return false;

        if (string.IsNullOrEmpty(cookieToken))
            return false;

        // Сравниваем токены с использованием стойкого сравнения (time-attack safe)
        return CryptographicOperations.FixedTimeEquals(
            MemoryMarshal.AsBytes(headerToken.AsSpan()),
            MemoryMarshal.AsBytes(cookieToken.AsSpan()));
    }

    /// <summary>
    /// Определяет, содержит ли запрос JWT Bearer токен.
    /// Если да — CSRF-проверка не нужна (Bearer токен не прикрепляется автоматически).
    /// </summary>
    private static bool HasBearerToken(HttpContext context)
    {
        if (!context.Request.Headers.TryGetValue("Authorization", out var authHeader))
            return false;

        var header = authHeader.FirstOrDefault();
        return !string.IsNullOrEmpty(header) && header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase);
    }
}
