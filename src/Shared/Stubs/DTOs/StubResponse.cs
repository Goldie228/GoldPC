#pragma warning disable CS1591, SA1402, SA1600
using System.Text.Json.Serialization;

namespace Shared.Stubs.DTOs;

/// <summary>
/// Ответ с информацией о заглушке.
/// </summary>
public class StubResponse
{
    /// <summary>
    /// Gets or sets уникальное имя заглушки.
    /// </summary>
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets имя сервиса.
    /// </summary>
    [JsonPropertyName("serviceName")]
    public string ServiceName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets описание заглушки.
    /// </summary>
    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets текущий режим работы.
    /// </summary>
    [JsonPropertyName("mode")]
    public string Mode { get; set; } = "Normal";

    /// <summary>
    /// Gets or sets a value indicating whether включена ли заглушка.
    /// </summary>
    [JsonPropertyName("isEnabled")]
    public bool IsEnabled { get; set; }

    /// <summary>
    /// Gets or sets время последнего изменения.
    /// </summary>
    [JsonPropertyName("lastModified")]
    public DateTime LastModified { get; set; }

    /// <summary>
    /// Gets or sets конфигурация Chaos Engineering.
    /// </summary>
    [JsonPropertyName("chaos")]
    public StubChaosConfigResponse? Chaos { get; set; }
}

/// <summary>
/// Ответ с конфигурацией Chaos Engineering.
/// </summary>
public class StubChaosConfigResponse
{
    [JsonPropertyName("failureRate")]
    public double FailureRate { get; set; }

    [JsonPropertyName("latencyRate")]
    public double LatencyRate { get; set; }

    [JsonPropertyName("minLatencyMs")]
    public int MinLatencyMs { get; set; }

    [JsonPropertyName("maxLatencyMs")]
    public int MaxLatencyMs { get; set; }

    [JsonPropertyName("failureStatusCode")]
    public int FailureStatusCode { get; set; }

    [JsonPropertyName("failureMessage")]
    public string FailureMessage { get; set; } = string.Empty;
}

/// <summary>
/// Ответ со статистикой реестра заглушек.
/// </summary>
public class StubRegistryStatsResponse
{
    [JsonPropertyName("totalCount")]
    public int TotalCount { get; set; }

    [JsonPropertyName("normalCount")]
    public int NormalCount { get; set; }

    [JsonPropertyName("slowCount")]
    public int SlowCount { get; set; }

    [JsonPropertyName("failingCount")]
    public int FailingCount { get; set; }

    [JsonPropertyName("unstableCount")]
    public int UnstableCount { get; set; }

    [JsonPropertyName("disabledCount")]
    public int DisabledCount { get; set; }
}

/// <summary>
/// Ответ с ошибкой.
/// </summary>
public class StubErrorResponse
{
    [JsonPropertyName("error")]
    public string Error { get; set; } = string.Empty;

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;
}
#pragma warning restore CS1591, SA1402, SA1600
