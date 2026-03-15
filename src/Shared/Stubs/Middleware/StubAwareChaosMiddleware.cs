using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Shared.Middleware;
using Shared.Stubs;

namespace Shared.Stubs.Middleware;

/// <summary>
/// Chaos Middleware с интеграцией StubRegistry.
/// Позволяет динамически менять поведение через API.
/// </summary>
public class StubAwareChaosMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ChaosOptions _options;
    private readonly ILogger<StubAwareChaosMiddleware> _logger;
    private readonly StubRegistry _registry;
    private static readonly Random _random = new();

    /// <summary>
    /// Имя заглушки для текущего сервиса (можно переопределить при регистрации).
    /// </summary>
    public static string? ServiceStubName { get; set; }

    public StubAwareChaosMiddleware(
        RequestDelegate next,
        ILogger<StubAwareChaosMiddleware> logger,
        ChaosOptions? options = null)
    {
        _next = next;
        _logger = logger;
        _options = options ?? new ChaosOptions();
        _registry = StubRegistry.Instance;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Пропуск, если Chaos отключен глобально
        if (!_options.Enabled)
        {
            await _next(context);
            return;
        }

        // Пропуск health checks и других исключенных путей
        if (ShouldSkipPath(context.Request.Path))
        {
            await _next(context);
            return;
        }

        // Получить конфигурацию заглушки для текущего сервиса
        var stubConfig = GetStubConfiguration();

        // Применить Chaos Engineering
        if (await TryApplyChaos(context, stubConfig))
        {
            return; // Ответ уже отправлен
        }

        await _next(context);
    }

    /// <summary>
    /// Проверить, нужно ли пропустить путь.
    /// </summary>
    private bool ShouldSkipPath(PathString path)
    {
        foreach (var excludedPath in _options.ExcludedPaths)
        {
            if (path.StartsWithSegments(excludedPath, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }
        return false;
    }

    /// <summary>
    /// Получить конфигурацию заглушки из реестра.
    /// </summary>
    private StubDefinition? GetStubConfiguration()
    {
        if (string.IsNullOrEmpty(ServiceStubName))
        {
            return null;
        }

        var stub = _registry.Get(ServiceStubName);
        
        // Если заглушка отключена, вернуть null
        if (stub != null && !stub.IsEnabled)
        {
            return null;
        }

        return stub;
    }

    /// <summary>
    /// Попытаться применить Chaos-воздействие.
    /// Возвращает true, если ответ был отправлен.
    /// </summary>
    private async Task<bool> TryApplyChaos(HttpContext context, StubDefinition? stubConfig)
    {
        var chaosConfig = stubConfig?.Chaos;

        // Определить параметры Chaos на основе режима заглушки
        var (failureRate, latencyRate, minLatency, maxLatency) = GetChaosParameters(stubConfig);

        // Проверить Service Outage (503)
        if (_options.EnableServiceOutage)
        {
            if (_random.NextDouble() < _options.OutageRate)
            {
                await WriteServiceUnavailableResponse(context);
                LogChaosAction("ServiceOutage", $"503 response");
                return true;
            }
        }

        // Проверить случайную задержку
        if (_options.EnableLatency || stubConfig?.Mode == StubMode.Slow)
        {
            if (_random.NextDouble() < latencyRate)
            {
                var delay = _random.Next(minLatency, maxLatency);
                await Task.Delay(delay);
                LogChaosAction("Latency", $"{delay}ms delay");
            }
        }

        // Проверить случайную ошибку
        if (_options.EnableRandomFailures || stubConfig?.Mode == StubMode.Failing || stubConfig?.Mode == StubMode.Unstable)
        {
            if (_random.NextDouble() < failureRate)
            {
                var statusCode = chaosConfig?.FailureStatusCode ?? 500;
                var message = chaosConfig?.FailureMessage ?? "Chaos: Random failure injected";
                
                await WriteErrorResponse(context, statusCode, message);
                LogChaosAction("RandomFailure", $"{statusCode} response");
                return true;
            }
        }

        return false;
    }

    /// <summary>
    /// Получить параметры Chaos на основе конфигурации заглушки.
    /// </summary>
    private (double failureRate, double latencyRate, int minLatency, int maxLatency) GetChaosParameters(StubDefinition? stubConfig)
    {
        if (stubConfig == null || stubConfig.Chaos == null)
        {
            return (_options.FailureRate, _options.LatencyRate, _options.MinLatencyMs, _options.MaxLatencyMs);
        }

        return stubConfig.Mode switch
        {
            StubMode.Slow => (0, 1.0, stubConfig.Chaos.MinLatencyMs, stubConfig.Chaos.MaxLatencyMs),
            StubMode.Failing => (1.0, 0, _options.MinLatencyMs, _options.MaxLatencyMs),
            StubMode.Unstable => (stubConfig.Chaos.FailureRate, stubConfig.Chaos.LatencyRate, 
                stubConfig.Chaos.MinLatencyMs, stubConfig.Chaos.MaxLatencyMs),
            _ => (_options.FailureRate, _options.LatencyRate, _options.MinLatencyMs, _options.MaxLatencyMs)
        };
    }

    /// <summary>
    /// Отправить ответ с ошибкой.
    /// </summary>
    private async Task WriteErrorResponse(HttpContext context, int statusCode, string message)
    {
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";
        
        var errorResponse = new
        {
            error = "CHAOS_INJECTED",
            message,
            timestamp = DateTime.UtcNow
        };

        await context.Response.WriteAsJsonAsync(errorResponse);
    }

    /// <summary>
    /// Отправить 503 Service Unavailable.
    /// </summary>
    private async Task WriteServiceUnavailableResponse(HttpContext context)
    {
        context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
        context.Response.ContentType = "application/json";
        context.Response.Headers.RetryAfter = _options.RetryAfterSeconds.ToString();

        var errorResponse = new
        {
            error = "SERVICE_UNAVAILABLE",
            message = "Service temporarily unavailable (Chaos Engineering)",
            retryAfter = _options.RetryAfterSeconds
        };

        await context.Response.WriteAsJsonAsync(errorResponse);
    }

    /// <summary>
    /// Записать действие Chaos в лог.
    /// </summary>
    private void LogChaosAction(string action, string details)
    {
        if (_options.EnableLogging)
        {
            _logger.LogWarning("[CHAOS] {Action}: {Details}", action, details);
        }
    }
}

/// <summary>
/// Исключение для Chaos Engineering.
/// </summary>
public class ChaosException : Exception
{
    public ChaosException(string message) : base(message)
    {
    }

    public ChaosException(string message, Exception innerException) : base(message, innerException)
    {
    }
}