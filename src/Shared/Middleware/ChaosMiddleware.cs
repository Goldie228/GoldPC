#pragma warning disable CA1812, CA1852, CA5394, CS1591, S3267, SA1204, SA1402, SA1600
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Shared.Middleware;

/// <summary>
/// Middleware для внедрения контролируемых сбоев (Chaos Engineering).
/// Позволяет тестировать устойчивость системы к различным видам отказов.
/// </summary>
public class ChaosMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ChaosOptions _options;
    private readonly ILogger<ChaosMiddleware> _logger;
    private readonly Random _random = new();

    // Стандартные пути для исключения из Chaos
    private static readonly string[] DefaultExcludedPaths = new[]
    {
        "/health",
        "/healthz",
        "/ready",
        "/readyz",
        "/metrics",
        "/swagger"
    };

    public ChaosMiddleware(
        RequestDelegate next,
        IOptions<ChaosOptions> options,
        ILogger<ChaosMiddleware> logger)
    {
        _next = next;
        _options = options.Value;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Если Chaos отключен глобально, пропускаем
        if (!_options.Enabled)
        {
            await _next(context);
            return;
        }

        // Проверяем, нужно ли исключить этот путь
        if (ShouldExcludePath(context.Request.Path))
        {
            await _next(context);
            return;
        }

        // Применяем Chaos-воздействия в порядке приоритета:
        // 1. Service Outage (503) - наиболее критичный
        // 2. Random Failures (исключения)
        // 3. Latency (задержки)

        // 1. Проверка Service Outage (503)
        if (_options.EnableServiceOutage && ShouldTrigger(_options.OutageRate))
        {
            await HandleServiceOutageAsync(context);
            return;
        }

        // 2. Проверка Random Failures (исключения)
        if (_options.EnableRandomFailures && ShouldTrigger(_options.FailureRate))
        {
            await HandleRandomFailureAsync(context);
            return;
        }

        // 3. Проверка Latency (задержки)
        if (_options.EnableLatency && ShouldTrigger(_options.LatencyRate))
        {
            await HandleLatencyAsync(context);
        }

        // Продолжаем обработку запроса
        await _next(context);
    }

    /// <summary>
    /// Проверяет, должен ли быть вызван Chaos-эффект на основе вероятности.
    /// </summary>
    private bool ShouldTrigger(double rate)
    {
        if (rate <= 0)
        {
            return false;
        }

        if (rate >= 1)
        {
            return true;
        }

        return _random.NextDouble() < rate;
    }

    /// <summary>
    /// Проверяет, нужно ли исключить путь из Chaos-воздействий.
    /// </summary>
    private bool ShouldExcludePath(PathString path)
    {
        var pathValue = path.Value ?? string.Empty;

        // Проверяем стандартные исключения
        foreach (var excludedPath in DefaultExcludedPaths)
        {
            if (pathValue.StartsWith(excludedPath, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        // Проверяем пользовательские исключения
        foreach (var excludedPath in _options.ExcludedPaths)
        {
            if (pathValue.StartsWith(excludedPath, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    /// <summary>
    /// Обрабатывает Service Outage - возвращает 503 Service Unavailable.
    /// </summary>
    private async Task HandleServiceOutageAsync(HttpContext context)
    {
        var retryAfter = _options.RetryAfterSeconds;

        if (_options.EnableLogging)
        {
            _logger.LogWarning(
                "[Chaos] Service Outage triggered for {Path}. Returning 503. RetryAfter: {RetryAfter}s",
                context.Request.Path,
                retryAfter);
        }

        context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
        context.Response.Headers.RetryAfter = retryAfter.ToString();
        context.Response.ContentType = "application/json";

        var response = new
        {
            Error = "Service temporarily unavailable (Chaos Engineering)",
            Message = "This is a simulated outage for resilience testing",
            RetryAfter = retryAfter,
            Timestamp = DateTime.UtcNow
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }

    /// <summary>
    /// Обрабатывает Random Failure - выбрасывает исключение.
    /// </summary>
    private Task HandleRandomFailureAsync(HttpContext context)
    {
        var errorTypes = new[]
        {
            "Database connection failed (Chaos)",
            "External service timeout (Chaos)",
            "Memory allocation error (Chaos)",
            "Disk I/O error (Chaos)",
            "Network connection reset (Chaos)",
            "Random server error (Chaos)"
        };

        var errorMessage = errorTypes[_random.Next(errorTypes.Length)];

        if (_options.EnableLogging)
        {
            _logger.LogWarning(
                "[Chaos] Random Failure triggered for {Path}. Throwing exception: {Error}",
                context.Request.Path,
                errorMessage);
        }

        throw new ChaosException(errorMessage, ChaosActionType.RandomFailure);
    }

    /// <summary>
    /// Обрабатывает Latency - добавляет задержку к ответу.
    /// </summary>
    private async Task HandleLatencyAsync(HttpContext context)
    {
        var delayMs = _random.Next(_options.MinLatencyMs, _options.MaxLatencyMs);

        if (_options.EnableLogging)
        {
            _logger.LogWarning(
                "[Chaos] Latency triggered for {Path}. Adding {Delay}ms delay",
                context.Request.Path,
                delayMs);
        }

        await Task.Delay(delayMs);
    }
}

/// <summary>
/// Модель ответа при Service Outage.
/// </summary>
internal class ChaosOutageResponse
{
    public string Error { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public int RetryAfter { get; set; }

    public DateTime Timestamp { get; set; }
}
#pragma warning restore CA1812, CA1852, CA5394, CS1591, S3267, SA1204, SA1402, SA1600
