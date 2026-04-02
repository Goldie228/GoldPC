using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using PCBuilderService.DTOs;

namespace PCBuilderService.Services;

/// <summary>
/// Модели данных из fps-benchmarks.json
/// </summary>
internal class FpsBenchmarkConfig
{
    public List<GpuTierEntry> GpuTiers { get; init; } = new();
    public List<CpuTierEntry> CpuTiers { get; init; } = new();
    public List<GameEntry> Games { get; init; } = new();
    public ResolutionMultipliers ResolutionMultipliers { get; init; } = new();
    public RamFactorConfig RamFactor { get; init; } = new();
}

internal record GpuTierEntry(string Pattern, int Tier, int Relative3dmark);
internal record CpuTierEntry(string Pattern, double SingleCore, double MultiCore);

internal record GameEntry
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public double Base1080p { get; init; }
    public double GpuWeight { get; init; }
    public double CpuWeight { get; init; }
}

internal record ResolutionMultipliers
{
    public double Res1080p { get; init; } = 1.0;
    public double Res1440p { get; init; } = 0.7;
    public double Res4k { get; init; } = 0.45;
}

internal record RamFactorConfig
{
    public double LowMemoryThreshold { get; init; } = 8;
    public double NormalMemoryThreshold { get; init; } = 16;
    public double LowFactor { get; init; } = 0.85;
    public double NormalFactor { get; init; } = 1.0;
    public double HighFactor { get; init; } = 1.05;
}

/// <summary>
/// Сервис расчёта примерного FPS для конфигурации ПК.
/// Использует эвристические данные из fps-benchmarks.json (без внешних вызовов).
/// </summary>
public interface IFpsCalculationService
{
    Task<FpsCalculationResponse> CalculateFpsAsync(FpsCalculationRequest request);
    GpuTierMatch? MatchGpuTier(string name);
    CpuTierMatch? MatchCpuTier(string name);
    double CalculateRamFactor(double? capacity);
}

public record GpuTierMatch(string Name, int Tier, int Relative3dmark);
public record CpuTierMatch(string Name, double SingleCore, double MultiCore);

public class FpsCalculationService : IFpsCalculationService
{
    private readonly FpsBenchmarkConfig _config;
    private readonly ILogger<FpsCalculationService> _logger;

    public FpsCalculationService(string configPath, ILogger<FpsCalculationService> logger)
    {
        _logger = logger;
        _config = LoadConfig(configPath);
    }

    public async Task<FpsCalculationResponse> CalculateFpsAsync(FpsCalculationRequest request)
    {
        // Если ни CPU ни GPU не указаны — возвращаем нули
        if (string.IsNullOrWhiteSpace(request.CpuId) && string.IsNullOrWhiteSpace(request.GpuId))
        {
            return new FpsCalculationResponse
            {
                CpuScore = 0,
                GpuScore = 0,
                OverallScore = 0,
                Bottleneck = null,
                Games = _config.Games.Select(g => new GameFpsEstimate
                {
                    GameId = g.Id,
                    GameName = g.Name,
                    Resolutions = new FpsResolutions { Resolution1080p = 0, Resolution1440p = 0, Resolution4k = 0 }
                }).ToList(),
                RamFactor = CalculateRamFactor(request.RamCapacity)
            };
        }

        // Определяем CPU/GPU tier по именам
        var gpuTier = MatchGpuTier(request.GpuId ?? "");
        var cpuTier = MatchCpuTier(request.CpuId ?? "");

        double gpuScore = gpuTier?.Tier ?? 0;
        double cpuScore = cpuTier?.SingleCore ?? 0;

        // Если tier не найден, но есть относительный балл 3DMark — используем его
        // (входная точка может передать название, содержащее числовую оценку)
        var gpuFallbackScore = gpuScore > 0 ? (gpuTier?.Relative3dmark ?? 0) : 0;
        var ramFactor = CalculateRamFactor(request.RamCapacity);

        // Базовый множитель GPU (нормализация к 10000 = 1.0)
        var gpuMultiplier = gpuFallbackScore > 0 ? gpuFallbackScore / 10000.0 : 1.0;
        // Если GPU не указан — только CPU влияет (и наоборот)
        if (gpuTier == null && cpuTier != null)
            gpuMultiplier = 0.5; // нейтральный GPU для частичного расчёта
        if (gpuTier != null && cpuTier == null)
            cpuScore = 1.0; // нейтральный CPU

        var resolutionMultipliers = _config.ResolutionMultipliers;

        var games = new List<GameFpsEstimate>();
        foreach (var game in _config.Games)
        {
            // fps = game.base1080p * (gpuTier.relative3dmark / 10000) * cpuMultiplier * ramFactor * resolutionMultiplier
            var cpuContribution = cpuScore * game.CpuWeight + 1.0 * (1.0 - game.CpuWeight);

            var baseFps = game.Base1080p * gpuMultiplier * cpuContribution * ramFactor;

            // Ограничиваем снизу 0, сверху base1080p * reasonable ceiling
            baseFps = Math.Max(0, Math.Round(baseFps));

            var fps1080p = (int)Math.Max(0, Math.Round(baseFps * resolutionMultipliers.Res1080p));
            var fps1440p = (int)Math.Max(0, Math.Round(baseFps * resolutionMultipliers.Res1440p));
            var fps4k = (int)Math.Max(0, Math.Round(baseFps * resolutionMultipliers.Res4k));

            games.Add(new GameFpsEstimate
            {
                GameId = game.Id,
                GameName = game.Name,
                Resolutions = new FpsResolutions
                {
                    Resolution1080p = fps1080p,
                    Resolution1440p = fps1440p,
                    Resolution4k = fps4k
                }
            });
        }

        // Определяем bottleneck
        string? bottleneck = null;
        if (gpuTier != null && cpuTier != null)
        {
            var gpuNorm = gpuTier.Relative3dmark / 100.0;
            var cpuNorm = cpuTier.SingleCore * 100;
            var ratio = gpuNorm / Math.Max(cpuNorm, 1);

            if (ratio > 1.5)
                bottleneck = "gpu"; // GPU значительно мощнее — CPU bottleneck
            else if (ratio < 0.6)
                bottleneck = "cpu"; // CPU значительно мощнее — GPU bottleneck
        }
        else if (gpuTier != null)
        {
            bottleneck = "cpu_partial"; // только GPU, CPU не указан
        }
        else if (cpuTier != null)
        {
            bottleneck = "gpu_partial"; // только CPU, GPU не указан
        }

        // Overall score: взвешенная комбинация
        var gpuNormScore = gpuTier != null ? (gpuTier.Tier / 1000.0) * 100 : 0;
        var cpuNormScore = cpuTier != null ? cpuTier.SingleCore * 100 : 0;
        var overallScore = Math.Round(gpuNormScore * 0.6 + cpuNormScore * 0.4, 1);

        return new FpsCalculationResponse
        {
            CpuScore = Math.Round(cpuScore * 100, 1),
            GpuScore = Math.Round(gpuScore, 1),
            OverallScore = overallScore,
            Bottleneck = bottleneck,
            Games = games,
            RamFactor = ramFactor
        };
    }

    public GpuTierMatch? MatchGpuTier(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return null;

        var lower = name.ToLowerInvariant();
        foreach (var tier in _config.GpuTiers)
        {
            var regex = new Regex(tier.Pattern, RegexOptions.IgnoreCase | RegexOptions.Compiled);
            if (regex.IsMatch(lower))
                return new GpuTierMatch(tier.Pattern, tier.Tier, tier.Relative3dmark);
        }
        return null;
    }

    public CpuTierMatch? MatchCpuTier(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return null;

        var lower = name.ToLowerInvariant();
        foreach (var tier in _config.CpuTiers)
        {
            var regex = new Regex(tier.Pattern, RegexOptions.IgnoreCase | RegexOptions.Compiled);
            if (regex.IsMatch(lower))
                return new CpuTierMatch(tier.Pattern, tier.SingleCore, tier.MultiCore);
        }
        return null;
    }

    public double CalculateRamFactor(double? capacity)
    {
        if (capacity == null || capacity == 0)
            return _config.RamFactor.NormalFactor;

        var rf = _config.RamFactor;
        if (capacity <= rf.LowMemoryThreshold) return rf.LowFactor;
        if (capacity <= rf.NormalMemoryThreshold) return rf.NormalFactor;
        return rf.HighFactor;
    }

    private static FpsBenchmarkConfig LoadConfig(string configPath)
    {
        var json = File.ReadAllText(configPath);
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        var config = new FpsBenchmarkConfig
        {
            GpuTiers = root.GetProperty("gpuTiers").EnumerateArray()
                .Select(e => new GpuTierEntry(
                    e.GetProperty("pattern").GetString() ?? "",
                    e.GetProperty("tier").GetInt32(),
                    e.GetProperty("relative3dmark").GetInt32()))
                .ToList(),

            CpuTiers = root.GetProperty("cpuTiers").EnumerateArray()
                .Select(e => new CpuTierEntry(
                    e.GetProperty("pattern").GetString() ?? "",
                    e.GetProperty("singleCore").GetDouble(),
                    e.GetProperty("multiCore").GetDouble()))
                .ToList(),

            Games = root.GetProperty("games").EnumerateArray()
                .Select(e => new GameEntry
                {
                    Id = e.GetProperty("id").GetString() ?? "",
                    Name = e.GetProperty("name").GetString() ?? "",
                    Base1080p = e.GetProperty("base1080p").GetDouble(),
                    GpuWeight = e.GetProperty("gpuWeight").GetDouble(),
                    CpuWeight = e.GetProperty("cpuWeight").GetDouble()
                })
                .ToList(),

            ResolutionMultipliers = ParseResolutionMultipliers(root, "resolutionMultipliers"),
            RamFactor = ParseRamFactor(root, "ramFactor")
        };

        return config;
    }

    private static ResolutionMultipliers ParseResolutionMultipliers(JsonElement root, string propertyName)
    {
        if (!root.TryGetProperty(propertyName, out var obj))
            return new ResolutionMultipliers();

        return new ResolutionMultipliers
        {
            Res1080p = GetPropertyDouble(obj, "1080p", 1.0),
            Res1440p = GetPropertyDouble(obj, "1440p", 0.7),
            Res4k = GetPropertyDouble(obj, "4k", 0.45)
        };
    }

    private static RamFactorConfig ParseRamFactor(JsonElement root, string propertyName)
    {
        if (!root.TryGetProperty(propertyName, out var obj))
            return new RamFactorConfig();

        return new RamFactorConfig
        {
            LowMemoryThreshold = GetPropertyDouble(obj, "lowMemoryThreshold", 8),
            NormalMemoryThreshold = GetPropertyDouble(obj, "normalMemoryThreshold", 16),
            LowFactor = GetPropertyDouble(obj, "lowFactor", 0.85),
            NormalFactor = GetPropertyDouble(obj, "normalFactor", 1.0),
            HighFactor = GetPropertyDouble(obj, "highFactor", 1.05)
        };
    }

    private static double GetPropertyDouble(JsonElement obj, string key, double defaultValue)
    {
        if (obj.TryGetProperty(key, out var prop))
            return prop.GetDouble();
        return defaultValue;
    }
}

/// <summary>
/// Кастомный JsonConverter для ResolutionMultipliers, парсит объект вида {"1080p": 1.0, "1440p": 0.7, "4k": 0.45}
/// </summary>
internal class ResolutionMultipliersConverter : System.Text.Json.Serialization.JsonConverter<ResolutionMultipliers>
{
    public override ResolutionMultipliers? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var result = new ResolutionMultipliers();
        if (reader.TokenType != JsonTokenType.StartObject)
            throw new JsonException();

        while (reader.Read())
        {
            if (reader.TokenType == JsonTokenType.EndObject) break;
            var key = reader.GetString() ?? "";
            reader.Read();
            var value = reader.GetDouble();

            switch (key)
            {
                case "1080p": result = result with { Res1080p = value }; break;
                case "1440p": result = result with { Res1440p = value }; break;
                case "4k": result = result with { Res4k = value }; break;
            }
        }
        return result;
    }

    public override void Write(Utf8JsonWriter writer, ResolutionMultipliers value, JsonSerializerOptions options)
    {
        writer.WriteStartObject();
        writer.WriteNumber("1080p", value.Res1080p);
        writer.WriteNumber("1440p", value.Res1440p);
        writer.WriteNumber("4k", value.Res4k);
        writer.WriteEndObject();
    }
}

/// <summary>
/// Кастомный JsonConverter для RamFactorConfig
/// </summary>
internal class RamFactorConfigConverter : System.Text.Json.Serialization.JsonConverter<RamFactorConfig>
{
    public override RamFactorConfig? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var config = new RamFactorConfig
        {
            LowMemoryThreshold = 8,
            NormalMemoryThreshold = 16,
            LowFactor = 0.85,
            NormalFactor = 1.0,
            HighFactor = 1.05
        };

        if (reader.TokenType != JsonTokenType.StartObject)
            throw new JsonException();

        while (reader.Read())
        {
            if (reader.TokenType == JsonTokenType.EndObject) break;
            var key = reader.GetString() ?? "";
            reader.Read();

            switch (key)
            {
                case "lowMemoryThreshold": config = config with { LowMemoryThreshold = reader.GetDouble() }; break;
                case "normalMemoryThreshold": config = config with { NormalMemoryThreshold = reader.GetDouble() }; break;
                case "lowFactor": config = config with { LowFactor = reader.GetDouble() }; break;
                case "normalFactor": config = config with { NormalFactor = reader.GetDouble() }; break;
                case "highFactor": config = config with { HighFactor = reader.GetDouble() }; break;
            }
        }
        return config;
    }

    public override void Write(Utf8JsonWriter writer, RamFactorConfig value, JsonSerializerOptions options)
    {
        writer.WriteStartObject();
        writer.WriteNumber("lowMemoryThreshold", value.LowMemoryThreshold);
        writer.WriteNumber("normalMemoryThreshold", value.NormalMemoryThreshold);
        writer.WriteNumber("lowFactor", value.LowFactor);
        writer.WriteNumber("normalFactor", value.NormalFactor);
        writer.WriteNumber("highFactor", value.HighFactor);
        writer.WriteEndObject();
    }
}
