#pragma warning disable SA1204, SA1402, SA1651
using System.Diagnostics;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Shared.Middleware;

/// <summary>
/// Middleware для управления Correlation ID в распределённых системах.
/// Извлекает или генерирует X-Correlation-ID и добавляет его в заголовки ответа и Activity tags.
/// </summary>
public class CorrelationIdMiddleware
{
    private const string CorrelationIdHeader = "X-Correlation-ID";
    private readonly RequestDelegate _next;
    private readonly ILogger<CorrelationIdMiddleware> _logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="CorrelationIdMiddleware"/> class.
    /// Инициализирует новый экземпляр <see cref="CorrelationIdMiddleware"/>.
    /// </summary>
    /// <param name="next">Следующий делегат в pipeline.</param>
    /// <param name="logger">Логгер.</param>
    public CorrelationIdMiddleware(RequestDelegate next, ILogger<CorrelationIdMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    /// <summary>
    /// Обрабатывает HTTP запрос, извлекая или генерируя Correlation ID.
    /// </summary>
    /// <param name="context">Контекст HTTP запроса.</param>
    /// <returns><placeholder>A <see cref="Task"/> representing the asynchronous operation.</placeholder></returns>
    public async Task Invoke(HttpContext context)
    {
        // Извлекаем Correlation ID из заголовков или генерируем новый
        var correlationId = context.Request.Headers[CorrelationIdHeader].FirstOrDefault()
                          ?? Guid.NewGuid().ToString();

        // Сохраняем в Items для доступа в других частях приложения
        context.Items[CorrelationIdHeader] = correlationId;

        // Добавляем в заголовки ответа
        context.Response.Headers[CorrelationIdHeader] = correlationId;

        // Добавляем в текущий Activity для распределённой трассировки
        var activity = Activity.Current;
        if (activity != null)
        {
            activity.SetTag("correlation.id", correlationId);
            activity.SetTag("http.request.path", context.Request.Path.Value);
        }

        // Создаём scope для логирования с Correlation ID
        using (_logger.BeginScope(new Dictionary<string, object>
        {
            ["CorrelationId"] = correlationId
        }))
        {
            try
            {
                await _next(context);
            }
            finally
            {
                // Добавляем статус код в Activity
                if (activity != null)
                {
                    activity.SetTag("http.status_code", context.Response.StatusCode);
                }
            }
        }
    }
}

/// <summary>
/// Extension методы для регистрации CorrelationIdMiddleware.
/// </summary>
public static class CorrelationIdMiddlewareExtensions
{
    /// <summary>
    /// Добавляет CorrelationIdMiddleware в pipeline.
    /// </summary>
    /// <param name="builder">Билдер приложения.</param>
    /// <returns>Билдер приложения для chaining.</returns>
    public static IApplicationBuilder UseCorrelationId(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<CorrelationIdMiddleware>();
    }
}
#pragma warning restore SA1204, SA1402, SA1651
