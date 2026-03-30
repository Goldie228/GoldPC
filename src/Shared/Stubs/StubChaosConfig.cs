#pragma warning disable SA1204
namespace Shared.Stubs;

/// <summary>
/// Конфигурация Chaos Engineering для заглушки.
/// </summary>
public class StubChaosConfig
{
    /// <summary>
    /// Gets or sets вероятность возникновения ошибки (0.0 - 1.0).
    /// </summary>
    public double FailureRate { get; set; } = 0.05;

    /// <summary>
    /// Gets or sets вероятность возникновения задержки (0.0 - 1.0).
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
    /// Gets or sets код HTTP ошибки для режима Failing.
    /// </summary>
    public int FailureStatusCode { get; set; } = 500;

    /// <summary>
    /// Gets or sets сообщение об ошибке для режима Failing.
    /// </summary>
    public string FailureMessage { get; set; } = "Service temporarily unavailable";

    /// <summary>
    /// Gets создает конфигурацию по умолчанию.
    /// </summary>
    public static StubChaosConfig Default => new();

    /// <summary>
    /// Gets создает конфигурацию для медленных ответов.
    /// </summary>
    public static StubChaosConfig Slow => new()
    {
        LatencyRate = 1.0,
        MinLatencyMs = 2000,
        MaxLatencyMs = 5000
    };

    /// <summary>
    /// Gets создает конфигурацию для возврата ошибок.
    /// </summary>
    public static StubChaosConfig Failing => new()
    {
        FailureRate = 1.0,
        FailureStatusCode = 503,
        FailureMessage = "Service unavailable (Stub mode: Failing)"
    };

    /// <summary>
    /// Gets создает конфигурацию для нестабильной работы.
    /// </summary>
    public static StubChaosConfig Unstable => new()
    {
        FailureRate = 0.3,
        LatencyRate = 0.5,
        MinLatencyMs = 500,
        MaxLatencyMs = 3000
    };
}
#pragma warning restore SA1204
