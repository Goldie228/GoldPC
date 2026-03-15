namespace Shared.Middleware;

/// <summary>
/// Опции конфигурации для Chaos Middleware.
/// Позволяет контролировать вероятности различных типов сбоев.
/// </summary>
public class ChaosOptions
{
    /// <summary>
    /// Включить или отключить Chaos Engineering.
    /// </summary>
    public bool Enabled { get; set; } = false;

    /// <summary>
    /// Включить случайные исключения (simulate server errors).
    /// </summary>
    public bool EnableRandomFailures { get; set; } = false;

    /// <summary>
    /// Вероятность возникновения случайного исключения (0.0 - 1.0).
    /// По умолчанию 5% (0.05).
    /// </summary>
    public double FailureRate { get; set; } = 0.05;

    /// <summary>
    /// Включить случайные задержки (simulate slow network).
    /// </summary>
    public bool EnableLatency { get; set; } = false;

    /// <summary>
    /// Вероятность возникновения задержки (0.0 - 1.0).
    /// По умолчанию 10% (0.1).
    /// </summary>
    public double LatencyRate { get; set; } = 0.1;

    /// <summary>
    /// Минимальная задержка в миллисекундах.
    /// </summary>
    public int MinLatencyMs { get; set; } = 100;

    /// <summary>
    /// Максимальная задержка в миллисекундах.
    /// </summary>
    public int MaxLatencyMs { get; set; } = 3000;

    /// <summary>
    /// Включить возврат 503 Service Unavailable.
    /// </summary>
    public bool EnableServiceOutage { get; set; } = false;

    /// <summary>
    /// Вероятность возврата 503 (0.0 - 1.0).
    /// По умолчанию 1% (0.01).
    /// </summary>
    public double OutageRate { get; set; } = 0.01;

    /// <summary>
    /// Время в секундах для заголовка Retry-After при 503 ответе.
    /// </summary>
    public int RetryAfterSeconds { get; set; } = 30;

    /// <summary>
    /// Исключить определенные пути из Chaos (например, health checks, swagger).
    /// </summary>
    public string[] ExcludedPaths { get; set; } = Array.Empty<string>();

    /// <summary>
    /// Включить логирование всех Chaos-воздействий.
    /// </summary>
    public bool EnableLogging { get; set; } = true;
}