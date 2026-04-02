using System.Text.Json.Serialization;

namespace PCBuilderService.DTOs;

/// <summary>
/// Запрос для расчёта FPS по CPU/GPU/ram
/// </summary>
public record FpsCalculationRequest
{
    /// <summary>ID процессора (опционально)</summary>
    public string? CpuId { get; init; }

    /// <summary>ID видеокарты (опционально)</summary>
    public string? GpuId { get; init; }

    /// <summary>Объём RAM в ГБ</summary>
    public double? RamCapacity { get; init; }

    /// <summary>Частота RAM в МГц</summary>
    public double? RamFrequency { get; init; }
}

/// <summary>
/// Оценка FPS для одной игры по разным разрешениям
/// </summary>
public record GameFpsEstimate
{
    [JsonPropertyName("gameId")]
    public string GameId { get; init; } = string.Empty;

    [JsonPropertyName("gameName")]
    public string GameName { get; init; } = string.Empty;

    [JsonPropertyName("resolutions")]
    public FpsResolutions Resolutions { get; init; } = new();
}

/// <summary>
/// FPS по разрешениям
/// </summary>
public record FpsResolutions
{
    [JsonPropertyName("resolution1080p")]
    public int Resolution1080p { get; init; }

    [JsonPropertyName("resolution1440p")]
    public int Resolution1440p { get; init; }

    [JsonPropertyName("resolution4k")]
    public int Resolution4k { get; init; }
}

/// <summary>
/// Ответ с расчётом FPS
/// </summary>
public record FpsCalculationResponse
{
    [JsonPropertyName("cpuScore")]
    public double CpuScore { get; init; }

    [JsonPropertyName("gpuScore")]
    public double GpuScore { get; init; }

    [JsonPropertyName("overallScore")]
    public double OverallScore { get; init; }

    [JsonPropertyName("bottleneck")]
    public string? Bottleneck { get; init; }

    [JsonPropertyName("games")]
    public List<GameFpsEstimate> Games { get; init; } = new();

    [JsonPropertyName("ramFactor")]
    public double RamFactor { get; init; } = 1.0;
}
