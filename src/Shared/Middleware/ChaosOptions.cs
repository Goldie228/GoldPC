#pragma warning disable CA1805, CA1819
namespace Shared.Middleware;

/// <summary>
/// Опции конфигурации для Chaos Middleware.
/// Позволяет контролировать вероятности различных типов сбоев.
/// </summary>
public class ChaosOptions
{
    /// <summary>
    /// Gets or sets a value indicating whether включить или отключить Chaos Engineering.
    /// </summary>
    public bool Enabled { get; set; } = false;

    /// <summary>
    /// Gets or sets a value indicating whether включить случайные исключения (simulate server errors).
    /// </summary>
    public bool EnableRandomFailures { get; set; } = false;

    /// <summary>
    /// Gets or sets вероятность возникновения случайного исключения (0.0 - 1.0).
    /// По умолчанию 5% (0.05).
    /// </summary>
    public double FailureRate { get; set; } = 0.05;

    /// <summary>
    /// Gets or sets a value indicating whether включить случайные задержки (simulate slow network).
    /// </summary>
    public bool EnableLatency { get; set; } = false;

    /// <summary>
    /// Gets or sets вероятность возникновения задержки (0.0 - 1.0).
    /// По умолчанию 10% (0.1).
    /// </summary>
    public double LatencyRate { get; set; } = 0.1;

    /// <summary>
    /// Gets or sets минимальная задержка в миллисекундах.
    /// </summary>
    public int MinLatencyMs { get; set; } = 100;

    /// <summary>
    /// Gets or sets максимальная задержка в миллисекундах.
    /// </summary>
    public int MaxLatencyMs { get; set; } = 3000;

    /// <summary>
    /// Gets or sets a value indicating whether включить возврат 503 Service Unavailable.
    /// </summary>
    public bool EnableServiceOutage { get; set; } = false;

    /// <summary>
    /// Gets or sets вероятность возврата 503 (0.0 - 1.0).
    /// По умолчанию 1% (0.01).
    /// </summary>
    public double OutageRate { get; set; } = 0.01;

    /// <summary>
    /// Gets or sets время в секундах для заголовка Retry-After при 503 ответе.
    /// </summary>
    public int RetryAfterSeconds { get; set; } = 30;

    /// <summary>
    /// Gets or sets исключить определенные пути из Chaos (например, health checks, swagger).
    /// </summary>
    public string[] ExcludedPaths { get; set; } = Array.Empty<string>();

    /// <summary>
    /// Gets or sets a value indicating whether включить логирование всех Chaos-воздействий.
    /// </summary>
    public bool EnableLogging { get; set; } = true;
}
#pragma warning restore CA1805, CA1819
