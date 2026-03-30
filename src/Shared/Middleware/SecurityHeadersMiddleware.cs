#pragma warning disable CA1861, CS1591, S3878, SA1600
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Shared.Middleware;

/// <summary>
/// Middleware для добавления security headers к HTTP ответам.
/// Защищает от XSS, clickjacking и других атак на уровне заголовков.
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<SecurityHeadersMiddleware> _logger;

    public SecurityHeadersMiddleware(
        RequestDelegate next,
        ILogger<SecurityHeadersMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Content Security Policy - защита от XSS
        var csp = BuildContentSecurityPolicy();
        context.Response.Headers["Content-Security-Policy"] = csp;

        // X-Content-Type-Options - защита от MIME sniffing
        context.Response.Headers["X-Content-Type-Options"] = "nosniff";

        // X-Frame-Options - защита от clickjacking
        context.Response.Headers["X-Frame-Options"] = "DENY";

        // X-XSS-Protection - дополнительная защита от XSS (legacy browsers)
        context.Response.Headers["X-XSS-Protection"] = "1; mode=block";

        // Referrer Policy - контроль передачи referrer
        context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

        // Permissions Policy - контроль браузерных API
        context.Response.Headers["Permissions-Policy"] =
            "geolocation=(), microphone=(), camera=(), payment=(), usb=()";

        // HSTS - Strict Transport Security (только для Production с HTTPS)
        if (context.Request.IsHttps)
        {
            context.Response.Headers["Strict-Transport-Security"] =
                "max-age=31536000; includeSubDomains; preload";
        }

        _logger.LogDebug(
            "Security headers applied for {Path}",
            context.Request.Path);

        await _next(context);
    }

    /// <summary>
    /// Строит Content Security Policy строку.
    /// </summary>
    private static string BuildContentSecurityPolicy()
    {
        return string.Join("; ", new[]
        {
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: https: blob:",
            "font-src 'self' https://fonts.gstatic.com",
            "connect-src 'self' https://api.yookassa.ru https://api.sms.ru",
            "frame-ancestors 'none'",
            "form-action 'self'",
            "base-uri 'self'"
        });
    }
}
#pragma warning restore CA1861, CS1591, S3878, SA1600
