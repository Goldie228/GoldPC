using Microsoft.AspNetCore.Builder;

namespace Shared.Middleware;

/// <summary>
/// Extension методы для регистрации Security Headers Middleware.
/// </summary>
public static class SecurityHeadersMiddlewareExtensions
{
    /// <summary>
    /// Добавляет Security Headers Middleware в pipeline запросов.
    /// Middleware должен быть добавлен как можно раньше в pipeline.
    /// </summary>
    /// <param name="builder">Builder приложения.</param>
    /// <returns>Builder приложения для chaining.</returns>
    /// <remarks>
    /// Добавляет следующие заголовки безопасности:
    /// - Content-Security-Policy (защита от XSS)
    /// - X-Content-Type-Options: nosniff
    /// - X-Frame-Options: DENY (защита от clickjacking)
    /// - Strict-Transport-Security (HSTS, только для HTTPS)
    /// - X-XSS-Protection
    /// - Referrer-Policy
    /// - Permissions-Policy
    /// </remarks>
    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<SecurityHeadersMiddleware>();
    }
}
