using System.Text.Json;
using PCBuilderService.DTOs;

namespace PCBuilderService.Services;

/// <summary>
/// Декларативный движок правил совместимости.
/// Загружает правила из JSON-конфигурации и применяет их к компонентам.
/// </summary>
public class CompatibilityRuleEngine
{
    private readonly RulesConfig _config;
    private readonly ILogger<CompatibilityRuleEngine> _logger;

    public CompatibilityRuleEngine(string jsonPath, ILogger<CompatibilityRuleEngine> logger)
    {
        _logger = logger;
        var json = File.ReadAllText(jsonPath);
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        _config = JsonSerializer.Deserialize<RulesConfig>(json, options)
            ?? throw new InvalidOperationException("Failed to load compatibility rules");
        _logger.LogInformation("Compatibility rules v{Version} loaded", _config.Version);
    }

    public CompatibilityRuleEngine(RulesConfig config, ILogger<CompatibilityRuleEngine> logger)
    {
        _config = config;
        _logger = logger;
    }

    public RulesConfig Config => _config;

    #region Socket Compatibility

    public SocketGroup? FindSocketGroup(string socket)
    {
        if (string.IsNullOrEmpty(socket)) return null;
        return _config.SocketCompatibility.Groups.FirstOrDefault(g =>
            g.Sockets.Any(s => string.Equals(s, socket, StringComparison.OrdinalIgnoreCase)));
    }

    public (bool match, string? primaryRamType, string? alternateRamType) CheckSocketMatch(
        string cpuSocket, string mbSocket)
    {
        var cpuGroup = FindSocketGroup(cpuSocket);
        var mbGroup = FindSocketGroup(mbSocket);
        if (cpuGroup == null || mbGroup == null) return (true, null, null);
        bool match = cpuGroup.Id == mbGroup.Id;
        return (match, mbGroup.RamType, mbGroup.RamTypeAlternate);
    }

    public BiosWarningResult CheckBiosWarning(string socket, string? chipset)
    {
        var group = FindSocketGroup(socket);
        if (group == null || !group.BiosWarning.Enabled)
            return new BiosWarningResult { HasWarning = false };

        // Если указан чипсет и есть список affectedChipsets — проверяем
        if (!string.IsNullOrEmpty(chipset) && group.BiosWarning.AffectedChipsets?.Count > 0)
        {
            bool isAffected = group.BiosWarning.AffectedChipsets.Any(c =>
                string.Equals(c, chipset, StringComparison.OrdinalIgnoreCase));
            if (!isAffected)
                return new BiosWarningResult { HasWarning = false };
        }

        return new BiosWarningResult
        {
            HasWarning = true,
            Message = group.BiosWarning.Message,
            Probability = group.BiosWarning.Probability
        };
    }

    #endregion

    #region Form Factor Compatibility

    public string NormalizeFormFactor(string formFactor)
    {
        if (string.IsNullOrEmpty(formFactor)) return formFactor;
        var upper = formFactor.ToUpperInvariant().Trim();
        if (_config.FormFactorCompatibility.Aliases.TryGetValue(upper, out var normalized))
            return normalized;
        return upper switch
        {
            "ATX" => "ATX",
            "MICROATX" => "mATX",
            "MINIITX" => "ITX",
            "EATX" => "EATX",
            _ => formFactor
        };
    }

    public bool IsFormFactorCompatible(string caseFormFactor, string mbFormFactor)
    {
        var normalizedCase = NormalizeFormFactor(caseFormFactor);
        var normalizedMb = NormalizeFormFactor(mbFormFactor);
        var rule = _config.FormFactorCompatibility.Rules.FirstOrDefault(r =>
            string.Equals(r.CaseFormFactor, normalizedCase, StringComparison.OrdinalIgnoreCase));
        if (rule == null) return true; // неизвестный форм-фактор — не блокируем
        return rule.SupportedMotherboards.Contains(normalizedMb, StringComparer.OrdinalIgnoreCase);
    }

    #endregion

    #region RAM Compatibility

    public CompatibilityIssueDto? CheckRamGenerationMismatch(string mbRamType, string ramType)
    {
        if (string.IsNullOrEmpty(mbRamType) || string.IsNullOrEmpty(ramType)) return null;
        if (!string.Equals(mbRamType, ramType, StringComparison.OrdinalIgnoreCase))
        {
            var rule = _config.RamCompatibility.GenerationMismatch;
            return new CompatibilityIssueDto
            {
                Severity = rule.Severity,
                Component1 = ramType,
                Component2 = mbRamType,
                Message = rule.MessageTemplate
                    .Replace("{motherboardRamType}", mbRamType)
                    .Replace("{ramType}", ramType),
                Suggestion = rule.SuggestionTemplate
                    .Replace("{motherboardRamType}", mbRamType)
                    .Replace("{ramType}", ramType)
            };
        }
        return null;
    }

    public CompatibilityWarningDto? CheckRamSpeed(int ramSpeed, int maxRamSpeed, string ramName)
    {
        if (ramSpeed <= 0 || maxRamSpeed <= 0 || ramSpeed <= maxRamSpeed) return null;
        var rule = _config.RamCompatibility.SpeedLimit;
        return new CompatibilityWarningDto
        {
            Severity = rule.Severity,
            Component = ramName,
            Message = rule.MessageTemplate
                .Replace("{ramSpeed}", ramSpeed.ToString())
                .Replace("{maxSpeed}", maxRamSpeed.ToString()),
            Suggestion = rule.SuggestionTemplate.Replace("{ramSpeed}", ramSpeed.ToString())
        };
    }

    public CompatibilityIssueDto? CheckRamSlots(int modules, int slots, string ramName, string mbName)
    {
        if (modules <= 0 || slots <= 0 || modules <= slots) return null;
        var rule = _config.RamCompatibility.SlotOverflow;
        return new CompatibilityIssueDto
        {
            Severity = rule.Severity,
            Component1 = ramName,
            Component2 = mbName,
            Message = rule.MessageTemplate
                .Replace("{modules}", modules.ToString())
                .Replace("{slots}", slots.ToString()),
            Suggestion = rule.SuggestionTemplate.Replace("{slots}", slots.ToString())
        };
    }

    #endregion

    #region Power Compatibility

    public int CalculateTotalTdp(int cpuTdp, int gpuTdp)
    {
        return _config.PowerCompatibility.BaseSystemPower + cpuTdp + gpuTdp;
    }

    public int CalculateRecommendedPsu(int totalTdp)
    {
        var recommended = totalTdp * (1 + _config.PowerCompatibility.PsuBufferPercent);
        var step = _config.PowerCompatibility.RoundingStep;
        return ((int)Math.Ceiling(recommended / step)) * step;
    }

    public CompatibilityIssueDto? CheckPsuInsufficient(int psuWattage, int totalTdp, string psuName)
    {
        if (psuWattage <= 0) return null;
        if (psuWattage < totalTdp)
        {
            var recommended = CalculateRecommendedPsu(totalTdp);
            var rule = _config.PowerCompatibility.Insufficient;
            return new CompatibilityIssueDto
            {
                Severity = rule.Severity,
                Component1 = psuName,
                Message = rule.MessageTemplate
                    .Replace("{psuWattage}", psuWattage.ToString())
                    .Replace("{requiredWattage}", totalTdp.ToString()),
                Suggestion = rule.SuggestionTemplate.Replace("{recommendedPsu}", recommended.ToString())
            };
        }
        return null;
    }

    public CompatibilityWarningDto? CheckPsuTightMargin(int psuWattage, int totalTdp, string psuName)
    {
        if (psuWattage <= 0 || totalTdp <= 0) return null;
        var recommended = CalculateRecommendedPsu(totalTdp);
        if (psuWattage >= totalTdp && psuWattage < recommended)
        {
            var rule = _config.PowerCompatibility.TightMargin;
            return new CompatibilityWarningDto
            {
                Severity = rule.Severity,
                Component = psuName,
                Message = rule.MessageTemplate
                    .Replace("{psuWattage}", psuWattage.ToString())
                    .Replace("{recommendedPsu}", recommended.ToString()),
                Suggestion = rule.Suggestion
            };
        }
        return null;
    }

    #endregion

    #region Dimension Compatibility

    public CompatibilityIssueDto? CheckGpuLength(int gpuLength, int maxGpuLength, string gpuName, string caseName)
    {
        if (gpuLength <= 0 || maxGpuLength <= 0) return null;
        if (gpuLength > maxGpuLength)
        {
            var rule = _config.DimensionCompatibility.GpuLength.Error;
            return new CompatibilityIssueDto
            {
                Severity = rule.Severity,
                Component1 = gpuName,
                Component2 = caseName,
                Message = rule.MessageTemplate
                    .Replace("{gpuName}", gpuName)
                    .Replace("{gpuLength}", gpuLength.ToString())
                    .Replace("{caseName}", caseName)
                    .Replace("{maxGpuLength}", maxGpuLength.ToString()),
                Suggestion = rule.SuggestionTemplate.Replace("{maxGpuLength}", maxGpuLength.ToString())
            };
        }
        return null;
    }

    public CompatibilityWarningDto? CheckGpuLengthWarning(int gpuLength, int maxGpuLength, string gpuName)
    {
        if (gpuLength <= 0 || maxGpuLength <= 0) return null;
        var threshold = _config.DimensionCompatibility.GpuLength.WarningThresholdMm;
        if (gpuLength > maxGpuLength - threshold && gpuLength <= maxGpuLength)
        {
            var rule = _config.DimensionCompatibility.GpuLength.Warning;
            return new CompatibilityWarningDto
            {
                Severity = rule.Severity,
                Component = gpuName,
                Message = rule.MessageTemplate
                    .Replace("{gpuName}", gpuName)
                    .Replace("{gpuLength}", gpuLength.ToString())
                    .Replace("{maxGpuLength}", maxGpuLength.ToString()),
                Suggestion = rule.Suggestion
            };
        }
        return null;
    }

    public CompatibilityIssueDto? CheckCoolerHeight(int coolerHeight, int maxCoolerHeight, string coolerName, string caseName, string coolerType)
    {
        if (coolerHeight <= 0 || maxCoolerHeight <= 0) return null;
        if (_config.DimensionCompatibility.CoolerHeight.AirCoolerOnly &&
            !string.Equals(coolerType, "Air", StringComparison.OrdinalIgnoreCase))
            return null;
        if (coolerHeight > maxCoolerHeight)
        {
            var rule = _config.DimensionCompatibility.CoolerHeight.Error;
            return new CompatibilityIssueDto
            {
                Severity = rule.Severity,
                Component1 = coolerName,
                Component2 = caseName,
                Message = rule.MessageTemplate
                    .Replace("{coolerName}", coolerName)
                    .Replace("{coolerHeight}", coolerHeight.ToString())
                    .Replace("{caseName}", caseName)
                    .Replace("{maxCoolerHeight}", maxCoolerHeight.ToString()),
                Suggestion = rule.SuggestionTemplate.Replace("{maxCoolerHeight}", maxCoolerHeight.ToString())
            };
        }
        return null;
    }

    #endregion

    #region Cooler Compatibility

    public CompatibilityIssueDto? CheckCoolerSocket(List<string> supportedSockets, string cpuSocket, string coolerName)
    {
        if (string.IsNullOrEmpty(cpuSocket) || supportedSockets.Count == 0) return null;
        if (!supportedSockets.Contains(cpuSocket, StringComparer.OrdinalIgnoreCase))
        {
            var rule = _config.CoolerCompatibility.SocketMismatch;
            return new CompatibilityIssueDto
            {
                Severity = rule.Severity,
                Component1 = coolerName,
                Message = rule.MessageTemplate
                    .Replace("{coolerName}", coolerName)
                    .Replace("{cpuSocket}", cpuSocket),
                Suggestion = rule.SuggestionTemplate.Replace("{cpuSocket}", cpuSocket)
            };
        }
        return null;
    }

    public CompatibilityWarningDto? CheckCoolerTdp(int coolerMaxTdp, int cpuTdp, string coolerName, string cpuName)
    {
        if (coolerMaxTdp <= 0 || cpuTdp <= 0 || cpuTdp <= coolerMaxTdp) return null;
        var rule = _config.CoolerCompatibility.TdpInsufficient;
        return new CompatibilityWarningDto
        {
            Severity = rule.Severity,
            Component = coolerName,
            Message = rule.MessageTemplate
                .Replace("{coolerName}", coolerName)
                .Replace("{coolerMaxTdp}", coolerMaxTdp.ToString())
                .Replace("{cpuName}", cpuName)
                .Replace("{cpuTdp}", cpuTdp.ToString()),
            Suggestion = rule.SuggestionTemplate.Replace("{cpuTdp}", cpuTdp.ToString())
        };
    }

    #endregion

    #region Bottleneck Detection

    /// <summary>
    /// Детекция bottleneck с учётом категории (gaming/workstation/office)
    /// </summary>
    public List<CompatibilityWarningDto> DetectBottleneck(
        int cpuScore, int gpuScore, string cpuName, string gpuName, string? purpose = null)
    {
        var warnings = new List<CompatibilityWarningDto>();
        if (cpuScore <= 0 || gpuScore <= 0) return warnings;

        var ratio = (double)cpuScore / gpuScore;
        var category = GetBottleneckCategory(purpose);
        var idealMin = category.IdealRatio.Min;
        var idealMax = category.IdealRatio.Max;

        // CPU-bound: ratio слишком высокий
        var cpuRule = _config.BottleneckDetection.CpuBound;
        if (ratio > Math.Max(cpuRule.Threshold, idealMax))
        {
            warnings.Add(new CompatibilityWarningDto
            {
                Severity = cpuRule.Severity,
                Component = cpuName,
                Message = cpuRule.MessageTemplate
                    .Replace("{cpuName}", cpuName)
                    .Replace("{gpuName}", gpuName)
                    .Replace("{ratio}", ratio.ToString("F2")),
                Suggestion = cpuRule.Suggestion
            });
        }

        // GPU-bound: ratio слишком низкий
        var gpuRule = _config.BottleneckDetection.GpuBound;
        if (ratio < Math.Min(gpuRule.Threshold, idealMin))
        {
            warnings.Add(new CompatibilityWarningDto
            {
                Severity = gpuRule.Severity,
                Component = gpuName,
                Message = gpuRule.MessageTemplate
                    .Replace("{cpuName}", cpuName)
                    .Replace("{gpuName}", gpuName)
                    .Replace("{ratio}", ratio.ToString("F2")),
                Suggestion = gpuRule.Suggestion
            });
        }

        return warnings;
    }

    private BottleneckCategory GetBottleneckCategory(string? purpose)
    {
        if (!string.IsNullOrEmpty(purpose) &&
            _config.BottleneckDetection.Categories.TryGetValue(purpose.ToLowerInvariant(), out var cat))
            return cat;
        return _config.BottleneckDetection.Categories.GetValueOrDefault("gaming")
            ?? new BottleneckCategory
            {
                CpuWeight = 0.5, GpuWeight = 0.5,
                IdealRatio = new IdealRatio { Min = 0.7, Max = 1.5 }
            };
    }

    #endregion

    #region Performance Warnings

    public CompatibilityWarningDto? CheckRamCapacity(int capacity, string ramName)
    {
        if (capacity <= 0) return null;
        foreach (var threshold in _config.PerformanceWarnings.InsufficientRam.Thresholds)
        {
            if (capacity >= threshold.MinCapacity && capacity < threshold.MaxCapacity)
            {
                return new CompatibilityWarningDto
                {
                    Severity = threshold.Severity,
                    Component = ramName,
                    Message = threshold.Message.Replace("{capacity}", capacity.ToString()),
                    Suggestion = threshold.Suggestion
                };
            }
        }
        return null;
    }

    public CompatibilityWarningDto? CheckNoIntegratedGraphics(string cpuName)
    {
        var rule = _config.PerformanceWarnings.NoIntegratedGraphics;
        return new CompatibilityWarningDto
        {
            Severity = rule.Severity,
            Component = cpuName,
            Message = rule.Message,
            Suggestion = rule.Suggestion
        };
    }

    #endregion

    #region Storage Compatibility

    /// <summary>
    /// Проверка M.2 слотов: если кол-во NVMe накопителей превышает доступные слоты
    /// </summary>
    public CompatibilityIssueDto? CheckM2Slots(int m2Count, int maxM2Slots, string mbName, string storageNames)
    {
        if (m2Count <= 0 || maxM2Slots <= 0 || m2Count <= maxM2Slots) return null;
        return new CompatibilityIssueDto
        {
            Severity = "Error",
            Component1 = storageNames,
            Component2 = mbName,
            Message = $"Недостаточно слотов M.2 на материнской плате {mbName}: требуется {m2Count}, доступно {maxM2Slots}",
            Suggestion = $"Выберите не более {maxM2Slots} M.2 накопителей или материнскую плату с большим количеством слотов M.2"
        };
    }

    /// <summary>
    /// Проверка SATA-портов: если кол-во SATA накопителей превышает доступные порты
    /// </summary>
    public CompatibilityIssueDto? CheckSataPorts(int sataCount, int maxSataPorts, string mbName, string storageNames)
    {
        if (sataCount <= 0 || maxSataPorts <= 0 || sataCount <= maxSataPorts) return null;
        return new CompatibilityIssueDto
        {
            Severity = "Error",
            Component1 = storageNames,
            Component2 = mbName,
            Message = $"Недостаточно SATA-портов на материнской плате {mbName}: требуется {sataCount}, доступно {maxSataPorts}",
            Suggestion = $"Выберите не более {maxSataPorts} SATA накопителей или материнскую плату с большим количеством SATA-портов"
        };
    }

    #endregion
}

#region Configuration Models

public class RulesConfig
{
    public string Version { get; set; } = "1.0.0";
    public SocketCompatibilityConfig SocketCompatibility { get; set; } = new();
    public FormFactorCompatibilityConfig FormFactorCompatibility { get; set; } = new();
    public RamCompatibilityConfig RamCompatibility { get; set; } = new();
    public PowerCompatibilityConfig PowerCompatibility { get; set; } = new();
    public DimensionCompatibilityConfig DimensionCompatibility { get; set; } = new();
    public CoolerCompatibilityConfig CoolerCompatibility { get; set; } = new();
    public BottleneckDetectionConfig BottleneckDetection { get; set; } = new();
    public PerformanceWarningsConfig PerformanceWarnings { get; set; } = new();
    public StorageDefaultsConfig StorageDefaults { get; set; } = new();

    public int M2Slots => StorageDefaults.MbDefaultM2Slots;
    public int SataPorts => StorageDefaults.MbDefaultSataPorts;
}

public class SocketCompatibilityConfig
{
    public List<SocketGroup> Groups { get; set; } = new();
}

public class SocketGroup
{
    public string Id { get; set; } = "";
    public List<string> Sockets { get; set; } = new();
    public List<string> Chipsets { get; set; } = new();
    public string RamType { get; set; } = "";
    public string? RamTypeAlternate { get; set; }
    public int MaxRamSpeed { get; set; }
    public BiosWarningConfig BiosWarning { get; set; } = new();
}

public class BiosWarningConfig
{
    public bool Enabled { get; set; }
    public string? Condition { get; set; }
    public string? Message { get; set; }
    public string? Probability { get; set; }
    public List<string>? AffectedChipsets { get; set; }
}

public class BiosWarningResult
{
    public bool HasWarning { get; set; }
    public string? Message { get; set; }
    public string? Probability { get; set; }
}

public class FormFactorCompatibilityConfig
{
    public List<string> Hierarchy { get; set; } = new();
    public List<FormFactorRule> Rules { get; set; } = new();
    public Dictionary<string, string> Aliases { get; set; } = new();
}

public class FormFactorRule
{
    public string CaseFormFactor { get; set; } = "";
    public List<string> SupportedMotherboards { get; set; } = new();
}

public class RamCompatibilityConfig
{
    public List<string> ValidTypes { get; set; } = new() { "DDR4", "DDR5" };
    public RuleTemplate GenerationMismatch { get; set; } = new();
    public RuleTemplate SpeedLimit { get; set; } = new();
    public RuleTemplate SlotOverflow { get; set; } = new();
}

public class PowerCompatibilityConfig
{
    public int BaseSystemPower { get; set; } = 50;
    public double PsuBufferPercent { get; set; } = 0.4;
    public double PsuMinBufferPercent { get; set; } = 0.2;
    public int RoundingStep { get; set; } = 50;
    public RuleTemplate Insufficient { get; set; } = new();
    public RuleTemplate TightMargin { get; set; } = new();
}

public class DimensionCompatibilityConfig
{
    public GpuLengthConfig GpuLength { get; set; } = new();
    public CoolerHeightConfig CoolerHeight { get; set; } = new();
}

public class GpuLengthConfig
{
    public RuleTemplate Error { get; set; } = new();
    public int WarningThresholdMm { get; set; } = 20;
    public RuleTemplate Warning { get; set; } = new();
}

public class CoolerHeightConfig
{
    public bool AirCoolerOnly { get; set; } = true;
    public RuleTemplate Error { get; set; } = new();
}

public class CoolerCompatibilityConfig
{
    public RuleTemplate SocketMismatch { get; set; } = new();
    public RuleTemplate TdpInsufficient { get; set; } = new();
}

public class BottleneckDetectionConfig
{
    public BottleneckRule CpuBound { get; set; } = new();
    public BottleneckRule GpuBound { get; set; } = new();
    public Dictionary<string, BottleneckCategory> Categories { get; set; } = new();
}

public class BottleneckRule
{
    public double Threshold { get; set; }
    public string Severity { get; set; } = "Warning";
    public string MessageTemplate { get; set; } = "";
    public string Suggestion { get; set; } = "";
}

public class BottleneckCategory
{
    public double CpuWeight { get; set; }
    public double GpuWeight { get; set; }
    public IdealRatio IdealRatio { get; set; } = new();
}

public class IdealRatio
{
    public double Min { get; set; }
    public double Max { get; set; }
}

public class PerformanceWarningsConfig
{
    public InsufficientRamConfig InsufficientRam { get; set; } = new();
    public RuleTemplate NoIntegratedGraphics { get; set; } = new();
}

public class InsufficientRamConfig
{
    public List<RamThreshold> Thresholds { get; set; } = new();
}

public class RamThreshold
{
    public int MinCapacity { get; set; }
    public int MaxCapacity { get; set; }
    public string Severity { get; set; } = "Warning";
    public string Message { get; set; } = "";
    public string Suggestion { get; set; } = "";
}

public class StorageDefaultsConfig
{
    public int MbDefaultM2Slots { get; set; } = 2;
    public int MbDefaultSataPorts { get; set; } = 4;
}

public class RuleTemplate
{
    public string Severity { get; set; } = "Error";
    public string? MessageTemplate { get; set; }
    public string? Message { get; set; }
    public string? SuggestionTemplate { get; set; }
    public string? Suggestion { get; set; }
}

#endregion
