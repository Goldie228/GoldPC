namespace Shared.Stubs;

/// <summary>
/// Конфигурация Chaos Engineering для заглушки.
/// </summary>
public class StubChaosConfig
{
    /// <summary>
    /// Вероятность возникновения ошибки (0.0 - 1.0).
    /// </summary>
    public double FailureRate { get; set; } = 0.05;

    /// <summary>
    /// Вероятность возникновения задержки (0.0 - 1.0).
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
    /// Код HTTP ошибки для режима Failing.
    /// </summary>
    public int FailureStatusCode { get; set; } = 500;

    /// <summary>
    /// Сообщение об ошибке для режима Failing.
    /// </summary>
    public string FailureMessage { get; set; } = "Service temporarily unavailable";

    /// <summary>
    /// Создает конфигурацию по умолчанию.
    /// </summary>
    public static StubChaosConfig Default => new();

    /// <summary>
    /// Создает конфигурацию для медленных ответов.
    /// </summary>
    public static StubChaosConfig Slow => new()
    {
        LatencyRate = 1.0,
        MinLatencyMs = 2000,
        MaxLatencyMs = 5000
    };

    /// <summary>
    /// Создает конфигурацию для возврата ошибок.
    /// </summary>
    public static StubChaosConfig Failing => new()
    {
        FailureRate = 1.0,
        FailureStatusCode = 503,
        FailureMessage = "Service unavailable (Stub mode: Failing)"
    };

    /// <summary>
    /// Создает конфигурацию для нестабильной работы.
    /// </summary>
    public static StubChaosConfig Unstable => new()
    {
        FailureRate = 0.3,
        LatencyRate = 0.5,
        MinLatencyMs = 500,
        MaxLatencyMs = 3000
    };
}