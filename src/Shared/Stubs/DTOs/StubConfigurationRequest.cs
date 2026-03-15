using System.Text.Json.Serialization;

namespace Shared.Stubs.DTOs;

/// <summary>
/// Запрос на изменение конфигурации заглушки.
/// </summary>
public class StubConfigurationRequest
{
    /// <summary>
    /// Новый режим работы заглушки.
    /// </summary>
    [JsonPropertyName("mode")]
    public StubMode Mode { get; set; } = StubMode.Normal;

    /// <summary>
    /// Конфигурация Chaos Engineering (опционально).
    /// </summary>
    [JsonPropertyName("chaos")]
    public StubChaosConfigRequest? Chaos { get; set; }

    /// <summary>
    /// Включена ли заглушка.
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
    /// Вероятность возникновения ошибки (0.0 - 1.0).
    /// </summary>
    [JsonPropertyName("failureRate")]
    public double? FailureRate { get; set; }

    /// <summary>
    /// Вероятность возникновения задержки (0.0 - 1.0).
    /// </summary>
    [JsonPropertyName("latencyRate")]
    public double? LatencyRate { get; set; }

    /// <summary>
    /// Минимальная задержка в миллисекундах.
    /// </summary>
    [JsonPropertyName("minLatencyMs")]
    public int? MinLatencyMs { get; set; }

    /// <summary>
    /// Максимальная задержка в миллисекундах.
    /// </summary>
    [JsonPropertyName("maxLatencyMs")]
    public int? MaxLatencyMs { get; set; }

    /// <summary>
    /// Код HTTP ошибки для режима Failing.
    /// </summary>
    [JsonPropertyName("failureStatusCode")]
    public int? FailureStatusCode { get; set; }

    /// <summary>
    /// Сообщение об ошибке для режима Failing.
    /// </summary>
    [JsonPropertyName("failureMessage")]
    public string? FailureMessage { get; set; }
}