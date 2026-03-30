#pragma warning disable CA1716, SA1402
using System.Text.Json.Serialization;

namespace Shared.Stubs.DTOs;

/// <summary>
/// Запрос на изменение конфигурации заглушки.
/// </summary>
public class StubConfigurationRequest
{
    /// <summary>
    /// Gets or sets новый режим работы заглушки.
    /// </summary>
    [JsonPropertyName("mode")]
    public StubMode Mode { get; set; } = StubMode.Normal;

    /// <summary>
    /// Gets or sets конфигурация Chaos Engineering (опционально).
    /// </summary>
    [JsonPropertyName("chaos")]
    public StubChaosConfigRequest? Chaos { get; set; }

    /// <summary>
    /// Gets or sets включена ли заглушка.
    /// </summary>
    [JsonPropertyName("isEnabled")]
    public bool? IsEnabled { get; set; }
}

/// <summary>
/// Запрос на настройку Chaos Engineering для заглушки.
/// </summary>
public class StubChaosConfigRequest
{
    /// <summary>
    /// Gets or sets вероятность возникновения ошибки (0.0 - 1.0).
    /// </summary>
    [JsonPropertyName("failureRate")]
    public double? FailureRate { get; set; }

    /// <summary>
    /// Gets or sets вероятность возникновения задержки (0.0 - 1.0).
    /// </summary>
    [JsonPropertyName("latencyRate")]
    public double? LatencyRate { get; set; }

    /// <summary>
    /// Gets or sets минимальная задержка в миллисекундах.
    /// </summary>
    [JsonPropertyName("minLatencyMs")]
    public int? MinLatencyMs { get; set; }

    /// <summary>
    /// Gets or sets максимальная задержка в миллисекундах.
    /// </summary>
    [JsonPropertyName("maxLatencyMs")]
    public int? MaxLatencyMs { get; set; }

    /// <summary>
    /// Gets or sets код HTTP ошибки для режима Failing.
    /// </summary>
    [JsonPropertyName("failureStatusCode")]
    public int? FailureStatusCode { get; set; }

    /// <summary>
    /// Gets or sets сообщение об ошибке для режима Failing.
    /// </summary>
    [JsonPropertyName("failureMessage")]
    public string? FailureMessage { get; set; }
}
#pragma warning restore CA1716, SA1402
