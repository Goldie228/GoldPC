using Microsoft.EntityFrameworkCore;
using PCBuilderService.Data;
using PCBuilderService.DTOs;
using PCBuilderService.Models;

namespace PCBuilderService.Services;

/// <summary>
/// Сервис проверки совместимости компонентов ПК.
/// Делегирует проверки декларативному движку правил CompatibilityRuleEngine.
/// </summary>
public interface ICompatibilityService
{
    Task<CompatibilityResult> CheckCompatibilityAsync(PCConfiguration config);
    Task<CompatibilityCheckResponse> CheckCompatibilityAsync(CompatibilityCheckRequest request);
    Task<IEnumerable<Guid>> GetCompatibleMotherboardsAsync(Guid processorId);
    Task<IEnumerable<Guid>> GetCompatibleRamAsync(Guid motherboardId);
    Task<int> CalculateTotalPowerConsumptionAsync(PCConfiguration config);
}

/// <summary>
/// Реализация сервиса проверки совместимости
/// </summary>
public class CompatibilityService : ICompatibilityService
{
    private readonly ILogger<CompatibilityService> _logger;
    private readonly CompatibilityRuleEngine _ruleEngine;
    private readonly PCBuilderDbContext _dbContext;

    public CompatibilityService(
        ILogger<CompatibilityService> logger,
        CompatibilityRuleEngine ruleEngine,
        PCBuilderDbContext dbContext)
    {
        _logger = logger;
        _ruleEngine = ruleEngine;
        _dbContext = dbContext;
    }

    public async Task<CompatibilityCheckResponse> CheckCompatibilityAsync(CompatibilityCheckRequest request)
    {
        var result = new CompatibilityCheckResponse
        {
            Result = new CompatibilityResultDto { IsCompatible = true }
        };

        try
        {
            var components = request.Components;
            var cpuSpecs = ExtractCpuSpecs(components.Cpu);
            var mbSpecs = ExtractMotherboardSpecs(components.Motherboard);
            var ramSpecs = ExtractRamSpecs(components.Ram);
            var gpuSpecs = ExtractGpuSpecs(components.Gpu);
            var psuSpecs = ExtractPsuSpecs(components.Psu);
            var caseSpecs = ExtractCaseSpecs(components.Case);
            var coolerSpecs = ExtractCoolerSpecs(components.Cooling);

            CheckSocketCompatibility(cpuSpecs, mbSpecs, result.Result);
            CheckRamCompatibility(mbSpecs, ramSpecs, result.Result);
            var totalTdp = _ruleEngine.CalculateTotalTdp(cpuSpecs.Tdp, gpuSpecs.Tdp);
            result.PowerConsumption = totalTdp;
            result.RecommendedPsu = _ruleEngine.CalculateRecommendedPsu(totalTdp);
            CheckPsuCompatibility(psuSpecs, totalTdp, result.Result);
            CheckFormFactorCompatibility(mbSpecs, caseSpecs, result.Result);
            CheckGpuDimensions(gpuSpecs, caseSpecs, result.Result);
            CheckCoolerCompatibility(cpuSpecs, coolerSpecs, result.Result);
            CheckCoolerHeight(coolerSpecs, caseSpecs, result.Result);
            DetectBottleneck(cpuSpecs, gpuSpecs, request.Purpose, result.Result);
            AddPerformanceWarnings(cpuSpecs, gpuSpecs, ramSpecs, result.Result);

            // ===== НОВЫЕ ПРОВЕРКИ =====
            CheckEpsAndPciePower(cpuSpecs, mbSpecs, gpuSpecs, psuSpecs, result.Result);
            CheckVrmAndRamClearance(cpuSpecs, mbSpecs, coolerSpecs, ramSpecs, result.Result);
            CheckUsbCAndGpuSlot(mbSpecs, caseSpecs, gpuSpecs, result.Result);
            CheckStorageM2(caseSpecs, components.Storage, mbSpecs, result.Result);
            CheckPsuBrandAndCable(psuSpecs, caseSpecs, result.Result);
            CheckCpuOverclock(cpuSpecs, mbSpecs, result.Result);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при проверке совместимости");
            throw;
        }
    }

    public async Task<CompatibilityResult> CheckCompatibilityAsync(PCConfiguration config)
    {
        var request = new CompatibilityCheckRequest
        {
            Components = new PCComponentsDto
            {
                Cpu = config.ProcessorId.HasValue ? new SelectedComponentDto { ProductId = config.ProcessorId.Value, Name = "CPU" } : null,
                Motherboard = config.MotherboardId.HasValue ? new SelectedComponentDto { ProductId = config.MotherboardId.Value, Name = "Motherboard" } : null,
                Ram = config.RamId.HasValue ? new SelectedComponentDto { ProductId = config.RamId.Value, Name = "RAM" } : null,
                Gpu = config.GpuId.HasValue ? new SelectedComponentDto { ProductId = config.GpuId.Value, Name = "GPU" } : null,
                Psu = config.PsuId.HasValue ? new SelectedComponentDto { ProductId = config.PsuId.Value, Name = "PSU" } : null,
                Case = config.CaseId.HasValue ? new SelectedComponentDto { ProductId = config.CaseId.Value, Name = "Case" } : null,
                Cooling = config.CoolerId.HasValue ? new SelectedComponentDto { ProductId = config.CoolerId.Value, Name = "Cooler" } : null
            }
        };
        var response = await CheckCompatibilityAsync(request);
        return new CompatibilityResult
        {
            IsCompatible = response.Result.IsCompatible,
            Issues = response.Result.Issues.Select(i => new CompatibilityIssue { ComponentType = i.Component1, Message = i.Message, Details = i.Suggestion ?? "" }).ToList(),
            Warnings = response.Result.Warnings.Select(w => new CompatibilityWarning { ComponentType = w.Component, Message = w.Message, Recommendation = w.Suggestion ?? "" }).ToList()
        };
    }

    #region BUG-14: Compatible component lookups

    public async Task<IEnumerable<Guid>> GetCompatibleMotherboardsAsync(Guid processorId)
    {
        // 1. Try explicit compatibility rules first
        var ruleBased = await _dbContext.CompatibilityRules
            .Where(r => r.RuleType == "cpu_motherboard" && r.IsCompatible)
            .Where(r => r.Component1Id == processorId || r.Component2Id == processorId)
            .Select(r => r.Component1Id == processorId ? r.Component2Id : r.Component1Id)
            .ToListAsync();

        if (ruleBased.Count > 0)
            return ruleBased;

        // 2. Fallback: find processor socket from any rule that mentions it, then match motherboards by socket
        var processorSocket = await _dbContext.CompatibilityRules
            .Where(r => (r.Component1Id == processorId || r.Component2Id == processorId) && r.Socket != null)
            .Select(r => r.Socket)
            .FirstOrDefaultAsync();

        if (string.IsNullOrEmpty(processorSocket))
            return ruleBased;

        _logger.LogInformation("No cpu_motherboard rules for {ProcessorId}, falling back to socket match: {Socket}", processorId, processorSocket);

        var socketBased = await _dbContext.CompatibilityRules
            .Where(r => r.Socket == processorSocket && r.IsCompatible)
            .Where(r => r.Component1Type == "motherboard" || r.Component2Type == "motherboard")
            .Select(r => r.Component1Type == "motherboard" ? r.Component1Id : r.Component2Id)
            .Distinct()
            .ToListAsync();

        return socketBased;
    }

    public async Task<IEnumerable<Guid>> GetCompatibleRamAsync(Guid motherboardId)
    {
        return await _dbContext.CompatibilityRules
            .Where(r => r.RuleType == "motherboard_ram" && r.IsCompatible)
            .Where(r => r.Component1Id == motherboardId || r.Component2Id == motherboardId)
            .Select(r => r.Component1Id == motherboardId ? r.Component2Id : r.Component1Id)
            .ToListAsync();
    }

    #endregion

    public async Task<int> CalculateTotalPowerConsumptionAsync(PCConfiguration config)
    {
        var cpuSpecs = config.ProcessorId.HasValue ? ExtractCpuSpecs(new SelectedComponentDto { ProductId = config.ProcessorId.Value, Name = "CPU" }) : new CpuSpecification();
        var gpuSpecs = config.GpuId.HasValue ? ExtractGpuSpecs(new SelectedComponentDto { ProductId = config.GpuId.Value, Name = "GPU" }) : new GpuSpecification();
        return _ruleEngine.CalculateTotalTdp(cpuSpecs.Tdp, gpuSpecs.Tdp);
    }

    #region Спецификации компонентов
    private sealed class CpuSpecification { public string Name { get; set; } = ""; public string? Socket { get; set; } public int Tdp { get; set; } public int PerformanceScore { get; set; } public bool HasIntegratedGraphics { get; set; } public bool Overclockable { get; set; } }
    private sealed class MotherboardSpecification { public string Name { get; set; } = ""; public string? Socket { get; set; } public string? RamType { get; set; } public int RamSlots { get; set; } public int MaxRamSpeed { get; set; } public string FormFactor { get; set; } = ""; public string? Chipset { get; set; } public int VrmPhases { get; set; } public int? VrmMaxTdp { get; set; } public bool HasUsbCHeader { get; set; } public int RequiredEps { get; set; } public int MaxM2Generation { get; set; } public bool M2SataSupport { get; set; } public int FanHeaders { get; set; } public string? RgbHeaderType { get; set; } }
    private sealed class RamSpecification { public string Name { get; set; } = ""; public string? Type { get; set; } public int Speed { get; set; } public int Capacity { get; set; } public int Modules { get; set; } public int? Height { get; set; } public string? EccType { get; set; } }
    private sealed class GpuSpecification { public string Name { get; set; } = ""; public int Length { get; set; } public int Tdp { get; set; } public int RecommendedPsu { get; set; } public int PerformanceScore { get; set; } public int PcieConnectors { get; set; } public bool Has12Vhpwr { get; set; } public double SlotWidth { get; set; } }
    private sealed class PsuSpecification { public string Name { get; set; } = ""; public int Wattage { get; set; } public string Certification { get; set; } = ""; public bool Modular { get; set; } public int EpsCables { get; set; } public int PcieCables { get; set; } public bool Atx3 { get; set; } public string? Brand { get; set; } public int EpsCableLength { get; set; } }
    private sealed class CaseSpecification { public string Name { get; set; } = ""; public int MaxGpuLength { get; set; } public int MaxCoolerHeight { get; set; } public List<string> SupportedFormFactors { get; set; } = new(); public bool HasUsbCFront { get; set; } public int ExpansionSlots { get; set; } public int? Depth { get; set; } }
    private sealed class CoolerSpecification { public string Name { get; set; } = ""; public string Type { get; set; } = ""; public int Height { get; set; } public int MaxTdp { get; set; } public List<string> SupportedSockets { get; set; } = new(); public int RamClearance { get; set; } }
    #endregion

    /// <summary>
    /// Detects RAM type from chipset name.
    /// B250/B350/H110/H310 → DDR4, B660/H670/Z690 → DDR4 or DDR5, B760/Z790 → DDR5
    /// </summary>
    private static string? DetectRamTypeFromChipset(string chipset)
    {
        if (string.IsNullOrWhiteSpace(chipset)) return null;
        var upper = chipset.ToUpperInvariant();

        // DDR5 chipsets
        if (System.Text.RegularExpressions.Regex.IsMatch(upper, @"^(B760|H770|Z790|B860|H870|Z890|X670|B650|X870)"))
            return "DDR5";

        // DDR4 chipsets (includes B660/Z690/H670 which can be DDR4 or DDR5 — default DDR4)
        if (System.Text.RegularExpressions.Regex.IsMatch(upper, @"^(B250|B350|B450|B550|B660|H110|H310|H370|H410|H470|H510|H570|H610|H660|H670|Z170|Z270|Z370|Z390|Z490|Z590|Z690|X370|X470|X570)"))
            return "DDR4";

        return null;
    }

    /// <summary>
    /// Extracts chipset name from product name. E.g. "Arktek AK-H310M EG" → "H310"
    /// Works even when specifications are empty.
    /// </summary>
    private static string ExtractChipsetNameFromProduct(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return "";
        var match = System.Text.RegularExpressions.Regex.Match(name, @"([A-Z]\d{3}[A-Z]?)");
        return match.Success ? match.Value : "";
    }

    private static bool IsLGA1151Family(string? socket)
    {
        return socket != null && socket.ToUpperInvariant().Contains("LGA1151");
    }

    /// <summary>
    /// Determines LGA1151 generation (v1 vs v2) from chipset.
    /// 100/200-series = v1 (Skylake/Kaby Lake), 300-series = v2 (Coffee Lake)
    /// </summary>
    private static string? DetectLGA1151Generation(CpuSpecification cpu)
    {
        var nameUpper = (cpu.Name ?? "").ToUpperInvariant();

        // 8th/9th gen = v2 (Coffee Lake): i3-8xxx, i5-8xxx/9xxx, i7-8xxx/9xxx, i9-9xxx
        if (System.Text.RegularExpressions.Regex.IsMatch(nameUpper, @"\bI[3579]-[89]\d{3}")) return "v2";

        // 6th/7th gen = v1 (Skylake/Kaby Lake): i3-6xxx/7xxx, i5-6xxx/7xxx, i7-6xxx/7xxx
        if (System.Text.RegularExpressions.Regex.IsMatch(nameUpper, @"\bI[3579]-[67]\d{3}")) return "v1";

        // Celeron/Pentium on LGA1151 — mostly v1
        if (nameUpper.Contains("CELERON") || nameUpper.Contains("PENTIUM"))
        {
            if (System.Text.RegularExpressions.Regex.IsMatch(nameUpper, @"\bG\d{4}\b"))
            {
                var match = System.Text.RegularExpressions.Regex.Match(nameUpper, @"\bG(\d)\d{3}\b");
                if (match.Success)
                {
                    var gen = int.Parse(match.Groups[1].Value);
                    // G4xxx/G5xxx = v1 (Kaby Lake), G5xxx = v1
                    if (gen <= 5) return "v1";
                    // G6xxx+ = v2 (Coffee Lake)
                    if (gen >= 6) return "v2";
                }
            }
        }

        return null;
    }

    private static string? DetectLGA1151Generation(MotherboardSpecification mb)
    {
        var chipset = (mb.Chipset ?? "").ToUpperInvariant();

        // 300-series = v2
        if (System.Text.RegularExpressions.Regex.IsMatch(chipset, @"^(B360|H310|H370|Z370|Z390)")) return "v2";
        // 100/200-series = v1
        if (System.Text.RegularExpressions.Regex.IsMatch(chipset, @"^(H110|B150|H170|Z170|B250|H270|Z270)")) return "v1";

        return null;
    }

    /// <summary>
    /// Detects socket from product name when specs are empty.
    /// E.g. "Arktek AK-H310M EG" → "LGA1151", "ASUS PRIME B550M" → "AM4"
    /// </summary>
    private static string? DetectSocketFromProductName(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return null;

        // Match chipset number from name (e.g. H310M → H310, B650E → B650E)
        var match = System.Text.RegularExpressions.Regex.Match(name, @"([ABHX])(\d{3}[E]?)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        if (!match.Success) return null;

        var prefix = match.Groups[1].Value.ToUpperInvariant();
        var num = match.Groups[2].Value.ToUpperInvariant();

        // AMD AM5 chipsets: A620, B650, X670, X870, B850
        if (num is "620" or "650" or "670" or "850" or "870" && prefix is "A" or "B" or "X")
            return "AM5";

        // AMD AM4 chipsets: A320, B350, X370, B450, X470, A520, B550, X570
        if (num is "320" or "350" or "370" or "450" or "470" or "520" or "550" or "570" && prefix is "A" or "B" or "X")
            return "AM4";

        // Intel LGA1851: B860, Z890
        if (num is "860" or "890") return "LGA1851";

        // Intel LGA1700: H610, B660, H670, Z690, B760, H770, Z790
        if (num is "610" or "660" or "670" or "690" or "760" or "770" or "790") return "LGA1700";

        // Intel LGA1200: H410, B460, H470, B470, Z490, H510, B560, H570, Z590
        if (num is "410" or "460" or "470" or "490" or "510" or "560" or "570" or "590") return "LGA1200";

        // Intel LGA1151: H110, B150, H170, Z170, B250, H270, Z270, B360, H310, H370, Z370, Z390
        if (num is "110" or "150" or "170" or "250" or "270" or "310" or "360" or "370" or "390") return "LGA1151";

        return null;
    }

    #region Извлечение спецификаций

    /// <summary>
    /// Detects integrated graphics from CPU name.
    /// Intel: all Core i3/i5/i7/i9, Celeron, Pentium have iGPU unless suffix is "F".
    /// AMD: APUs have "G" suffix (e.g. 5600G), Ryzen without G has no iGPU (except 8000G series).
    /// </summary>
    private static bool HasIntegratedGraphicsByName(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return false;
        var upper = name.ToUpperInvariant();

        // Intel: Core i3/i5/i7/i9, Celeron, Pentium — have iGPU unless model ends with "F"
        if (System.Text.RegularExpressions.Regex.IsMatch(upper, @"INTEL\s+(CORE\s+)?(I[3579]|CELERON|PENTIUM)"))
        {
            // F-suffix CPUs (e.g. i5-8400F, i9-13900KF) lack iGPU
            if (System.Text.RegularExpressions.Regex.IsMatch(upper, @"\b\d{4,5}F\b")) return false;
            return true;
        }

        // AMD: "G" suffix = APU with iGPU (e.g. Ryzen 5 5600G, Ryzen 7 8700G)
        if (System.Text.RegularExpressions.Regex.IsMatch(upper, @"RYZEN\s+\d+\s+\d{4}G"))
            return true;

        return false;
    }

    private CpuSpecification ExtractCpuSpecs(SelectedComponentDto? cpu)
    {
        if (cpu == null) return new CpuSpecification { Socket = "" };
        var s = cpu.Specifications;
        var name = cpu.Name;
        return new CpuSpecification
        {
            Name = name,
            Socket = GetSpecValueOrNull(s, "socket", componentName: name),
            Tdp = GetSpecValueInt(s, "tdp", 65, componentName: name),
            PerformanceScore = GetSpecValueInt(s, "performanceScore", 0, componentName: name),
            HasIntegratedGraphics = GetSpecValueBool(s, "integratedGraphics", false, componentName: name) || HasIntegratedGraphicsByName(name),
            Overclockable = GetSpecValueBool(s, "unlockedMultiplier", false, componentName: name) || 
                GetSpecValue(s, "model_series", "", componentName: name).ToUpperInvariant().Contains("K")
        };
    }

    private MotherboardSpecification ExtractMotherboardSpecs(SelectedComponentDto? mb)
    {
        if (mb == null) return new MotherboardSpecification { Socket = "", RamType = "" };
        var s = mb.Specifications;
        var name = mb.Name;
        return new MotherboardSpecification
        {
            Name = name,
            Socket = GetSpecValueOrNull(s, "socket", componentName: name)
                ?? DetectSocketFromProductName(name),
            RamType = GetSpecValueOrNull(s, "ramType")
                ?? DetectRamTypeFromChipset(GetSpecValue(s, "chipset", ""))
                ?? DetectRamTypeFromChipset(ExtractChipsetNameFromProduct(name)),
            RamSlots = GetSpecValueInt(s, "ramSlots", 4, componentName: name),
            MaxRamSpeed = GetSpecValueInt(s, "maxRamSpeed", 3200, componentName: name),
            FormFactor = GetSpecValue(s, "formFactor", "ATX", componentName: name),
            Chipset = GetSpecValue(s, "chipset", "") is { Length: > 0 } c
                ? c
                : ExtractChipsetNameFromProduct(name),
            VrmPhases = GetSpecValueInt(s, "vrmPhases", 0, componentName: name),
            VrmMaxTdp = GetSpecValueInt(s, "vrmMaxTdp", 0, componentName: name) > 0 ? GetSpecValueInt(s, "vrmMaxTdp", 0, componentName: name) : null,
            HasUsbCHeader = GetSpecValueBool(s, "usbCHeader", false, componentName: name),
            RequiredEps = GetSpecValueInt(s, "cpuPowerConnectors", 1, componentName: name),
            MaxM2Generation = GetSpecValueInt(s, "pcieVersion", 4, componentName: name),
            M2SataSupport = GetSpecValueBool(s, "m2SataSupport", true, componentName: name),
            FanHeaders = GetSpecValueInt(s, "fanHeaders", 3, componentName: name),
            RgbHeaderType = GetSpecValue(s, "rgbHeaders", "", componentName: name)
        };
    }

    private RamSpecification ExtractRamSpecs(SelectedComponentDto? ram)
    {
        if (ram == null) return new RamSpecification();
        var s = ram.Specifications;
        var name = ram.Name;
        return new RamSpecification
        {
            Name = name,
            Type = GetSpecValueOrNull(s, "type", componentName: name),
            Speed = GetSpecValueInt(s, "speed", 3200, componentName: name),
            Capacity = GetSpecValueInt(s, "capacity", 16, componentName: name),
            Modules = GetSpecValueInt(s, "modules", 1, componentName: name),
            Height = GetSpecValueInt(s, "height", 0, componentName: name) > 0 ? GetSpecValueInt(s, "height", 0, componentName: name) : null,
            EccType = GetSpecValue(s, "ecc", "", componentName: name)
        };
    }

    private GpuSpecification ExtractGpuSpecs(SelectedComponentDto? gpu)
    {
        if (gpu == null) return new GpuSpecification();
        var s = gpu.Specifications;
        var name = gpu.Name;
        return new GpuSpecification
        {
            Name = name,
            Length = GetSpecValueInt(s, "length", 300, componentName: name),
            Tdp = GetSpecValueInt(s, "tdp", 200, componentName: name),
            RecommendedPsu = GetSpecValueInt(s, "recommendedPsu", 550, componentName: name),
            PerformanceScore = GetSpecValueInt(s, "performanceScore", 0, componentName: name),
            PcieConnectors = GetSpecValueInt(s, "pcieConnectors", 0, componentName: name),
            Has12Vhpwr = GetSpecValueBool(s, "powerConnectors", false, componentName: name) || 
                         (GetSpecValue(s, "powerConnectors", "", componentName: name).ToUpperInvariant().Contains("12VHPWR")),
            SlotWidth = GetSpecValueInt(s, "slotWidth", 2, componentName: name)
        };
    }

    private PsuSpecification ExtractPsuSpecs(SelectedComponentDto? psu)
    {
        if (psu == null) return new PsuSpecification();
        var s = psu.Specifications;
        var name = psu.Name;
        return new PsuSpecification
        {
            Name = name,
            Wattage = GetSpecValueInt(s, "wattage", 550, componentName: name),
            Certification = GetSpecValue(s, "certification", "80+ Bronze", componentName: name),
            Modular = GetSpecValueBool(s, "modular", false, componentName: name),
            EpsCables = GetSpecValueInt(s, "epsCables", 1, componentName: name),
            PcieCables = GetSpecValueInt(s, "pcieCables", 2, componentName: name),
            Atx3 = GetSpecValueBool(s, "atx3", false, componentName: name),
            Brand = GetSpecValue(s, "brand", "", componentName: name),
            EpsCableLength = GetSpecValueInt(s, "epsLength", 0, componentName: name)
        };
    }

    private CaseSpecification ExtractCaseSpecs(SelectedComponentDto? c)
    {
        if (c == null) return new CaseSpecification();
        var s = c.Specifications;
        var name = c.Name;
        return new CaseSpecification
        {
            Name = name,
            MaxGpuLength = GetSpecValueInt(s, "maxGpuLength", 320, componentName: name),
            MaxCoolerHeight = GetSpecValueInt(s, "maxCoolerHeight", 160, componentName: name),
            SupportedFormFactors = GetSpecValue(s, "supportedFormFactors", "ATX,mATX,ITX", componentName: name).Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList(),
            HasUsbCFront = GetSpecValueBool(s, "hasUsbc", false, componentName: name),
            ExpansionSlots = GetSpecValueInt(s, "expansionSlots", 7, componentName: name),
            Depth = GetSpecValueInt(s, "depth", 0, componentName: name) > 0 ? GetSpecValueInt(s, "depth", 0, componentName: name) : null
        };
    }

    private CoolerSpecification ExtractCoolerSpecs(SelectedComponentDto? cooler)
    {
        if (cooler == null) return new CoolerSpecification();
        var s = cooler.Specifications;
        var name = cooler.Name;
        return new CoolerSpecification
        {
            Name = name,
            Type = GetSpecValue(s, "type", "Air", componentName: name),
            Height = GetSpecValueInt(s, "height", 160, componentName: name),
            MaxTdp = GetSpecValueInt(s, "maxTdp", 150, componentName: name),
            SupportedSockets = GetSpecValue(s, "supportedSockets", "", componentName: name).Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList(),
            RamClearance = GetSpecValueInt(s, "maxRamHeight", 0, componentName: name)
        };
    }

    #endregion

    #region BUG-22: Spec value helpers with logging

    private string GetSpecValue(Dictionary<string, object>? specs, string key, string defaultValue, string componentName = "")
    {
        if (specs == null || !specs.TryGetValue(key, out var value))
        {
            if (!string.IsNullOrEmpty(defaultValue) && !string.IsNullOrEmpty(componentName))
            {
                _logger.LogWarning("Spec '{Key}' not found for {Component}, defaulting to '{Default}'", key, componentName, defaultValue);
            }
            return defaultValue;
        }
        return value?.ToString() ?? defaultValue;
    }

    private int GetSpecValueInt(Dictionary<string, object>? specs, string key, int defaultValue, string componentName = "")
    {
        if (specs == null || !specs.TryGetValue(key, out var value))
        {
            if (defaultValue != 0 && !string.IsNullOrEmpty(componentName))
            {
                _logger.LogWarning("Spec '{Key}' not found for {Component}, defaulting to {Default}", key, componentName, defaultValue);
            }
            return defaultValue;
        }
        if (value is int i) return i;
        if (value is long l) return (int)l;
        if (int.TryParse(value?.ToString(), out var p)) return p;
        if (defaultValue != 0 && !string.IsNullOrEmpty(componentName))
        {
            _logger.LogWarning("Spec '{Key}' for {Component} has unparseable value, defaulting to {Default}", key, componentName, defaultValue);
        }
        return defaultValue;
    }

    private bool GetSpecValueBool(Dictionary<string, object>? specs, string key, bool defaultValue, string componentName = "")
    {
        if (specs == null || !specs.TryGetValue(key, out var value))
        {
            if (defaultValue && !string.IsNullOrEmpty(componentName))
            {
                _logger.LogWarning("Spec '{Key}' not found for {Component}, defaulting to {Default}", key, componentName, defaultValue);
            }
            return defaultValue;
        }
        if (value is bool b) return b;
        if (bool.TryParse(value?.ToString(), out var p)) return p;
        return defaultValue;
    }

    /// <summary>
    /// Gets a spec value as nullable string. Returns null (not default) when missing.
    /// Use this for critical compatibility fields where missing data should stop checks.
    /// </summary>
    private string? GetSpecValueOrNull(Dictionary<string, object>? specs, string key, string componentName = "")
    {
        if (specs == null || !specs.TryGetValue(key, out var value))
        {
            if (!string.IsNullOrEmpty(componentName))
                _logger.LogWarning("Spec '{Key}' not found for {Component}, returning null", key, componentName);
            return null;
        }
        return value?.ToString();
    }

    /// <summary>
    /// Gets a spec value as nullable int. Returns null (not 0) when missing.
    /// Use this for critical compatibility fields where missing data should stop checks.
    /// </summary>
    private int? GetSpecValueIntOrNull(Dictionary<string, object>? specs, string key, string componentName = "")
    {
        if (specs == null || !specs.TryGetValue(key, out var value))
        {
            if (!string.IsNullOrEmpty(componentName))
                _logger.LogWarning("Spec '{Key}' not found for {Component}, returning null", key, componentName);
            return null;
        }
        if (value is int i) return i;
        if (value is long l) return (int)l;
        if (int.TryParse(value?.ToString(), out var p)) return p;
        if (!string.IsNullOrEmpty(componentName))
            _logger.LogWarning("Spec '{Key}' for {Component} has unparseable value, returning null", key, componentName);
        return null;
    }

    #endregion

    #region Проверки совместимости (делегирование движку правил)

    private void CheckSocketCompatibility(CpuSpecification cpu, MotherboardSpecification mb, CompatibilityResultDto result)
    {
        // Empty string means component not selected → skip
        if (cpu.Socket == "" || mb.Socket == "")
            return;

        if (cpu.Socket == null || mb.Socket == null)
        {
            // Both unknown or one unknown — skip (don't block build for undetectable sockets)
            return;
        }
        var (match, _, _) = _ruleEngine.CheckSocketMatch(cpu.Socket, mb.Socket);
        if (!match)
        {
            result.IsCompatible = false;
            result.Issues.Add(new CompatibilityIssueDto
            {
                Severity = "Error",
                Component1 = cpu.Name,
                Component2 = mb.Name,
                Message = $"Несовместимый сокет: CPU ({cpu.Socket}) и материнская плата ({mb.Socket})",
                Suggestion = $"Выберите материнскую плату с сокетом {cpu.Socket} или CPU с сокетом {mb.Socket}"
            });
            return;
        }

        // LGA1151 v1/v2 refinement — substring match passes, but chipsets are incompatible
        if (IsLGA1151Family(cpu.Socket) && IsLGA1151Family(mb.Socket))
        {
            var cpuGen = DetectLGA1151Generation(cpu);
            var mbGen = DetectLGA1151Generation(mb);
            if (cpuGen != null && mbGen != null && cpuGen != mbGen)
            {
                result.IsCompatible = false;
                result.Issues.Add(new CompatibilityIssueDto
                {
                    Severity = "Error",
                    Component1 = cpu.Name,
                    Component2 = mb.Name,
                    Message = $"Процессор {cpu.Name} ({cpuGen}) несовместим с материнской платой {mb.Name} ({mbGen}): разные поколения LGA1151",
                    Suggestion = cpuGen == "v2"
                        ? "Процессоры Coffee Lake (v2) совместимы только с материнскими платами 300-серии (B360, H310, H370, Z370, Z390)"
                        : "Процессоры Skylake/Kaby Lake (v1) совместимы только с материнскими платами 100/200-серии (H110, B150, H170, Z170, B250, H270, Z270)"
                });
                return;
            }
        }

        var biosWarning = _ruleEngine.CheckBiosWarning(cpu.Socket, mb.Chipset);
        if (biosWarning.HasWarning)
        {
            result.Warnings.Add(new CompatibilityWarningDto
            {
                Severity = "Warning",
                Component = mb.Name,
                Message = biosWarning.Message ?? "Возможно потребуется обновление BIOS",
                Suggestion = biosWarning.Probability != null ? $"Вероятность: {biosWarning.Probability}" : null
            });
        }
    }

    private void CheckRamCompatibility(MotherboardSpecification mb, RamSpecification ram, CompatibilityResultDto result)
    {
        // Empty string means component not selected → skip
        if (mb.RamType == "" || ram.Type == "")
            return;

        if (mb.RamType == null || ram.Type == null)
        {
            return; // unknown type, skip check
        }
        var issue = _ruleEngine.CheckRamGenerationMismatch(mb.RamType, ram.Type);
        if (issue != null)
        {
            result.IsCompatible = false;
            issue.Component2 = mb.Name;
            result.Issues.Add(issue);
        }
        if (issue == null && ram.Speed > 0 && mb.MaxRamSpeed > 0)
        {
            var speedWarn = _ruleEngine.CheckRamSpeed(ram.Speed, mb.MaxRamSpeed, ram.Name);
            if (speedWarn != null) result.Warnings.Add(speedWarn);
        }
        if (ram.Modules > 0 && mb.RamSlots > 0 && ram.Modules > mb.RamSlots)
        {
            result.IsCompatible = false;
            var slotIssue = _ruleEngine.CheckRamSlots(ram.Modules, mb.RamSlots, ram.Name, mb.Name);
            if (slotIssue != null) result.Issues.Add(slotIssue);
        }
    }

    private void CheckPsuCompatibility(PsuSpecification psu, int totalTdp, CompatibilityResultDto result)
    {
        if (psu.Wattage == 0) return;
        var err = _ruleEngine.CheckPsuInsufficient(psu.Wattage, totalTdp, psu.Name);
        if (err != null)
        {
            result.IsCompatible = false;
            err.Component2 = "System";
            result.Issues.Add(err);
        }
        else
        {
            var warn = _ruleEngine.CheckPsuTightMargin(psu.Wattage, totalTdp, psu.Name);
            if (warn != null) result.Warnings.Add(warn);
        }
    }

    private void CheckFormFactorCompatibility(MotherboardSpecification mb, CaseSpecification caseSpec, CompatibilityResultDto result)
    {
        if (string.IsNullOrEmpty(mb.FormFactor) || caseSpec.SupportedFormFactors.Count == 0) return;
        var mbFF = _ruleEngine.NormalizeFormFactor(mb.FormFactor);
        var supported = caseSpec.SupportedFormFactors.Select(f => _ruleEngine.NormalizeFormFactor(f)).ToList();
        if (!supported.Contains(mbFF, StringComparer.OrdinalIgnoreCase))
        {
            result.IsCompatible = false;
            result.Issues.Add(new CompatibilityIssueDto
            {
                Severity = "Error",
                Component1 = mb.Name,
                Component2 = caseSpec.Name,
                Message = $"Материнская плата форм-фактора {mb.FormFactor} не подходит для корпуса {caseSpec.Name}",
                Suggestion = $"Поддерживаемые форм-факторы: {string.Join(", ", caseSpec.SupportedFormFactors)}"
            });
        }
    }

    private void CheckGpuDimensions(GpuSpecification gpu, CaseSpecification caseSpec, CompatibilityResultDto result)
    {
        if (gpu.Length == 0 || caseSpec.MaxGpuLength == 0) return;
        var err = _ruleEngine.CheckGpuLength(gpu.Length, caseSpec.MaxGpuLength, gpu.Name, caseSpec.Name);
        if (err != null)
        {
            result.IsCompatible = false;
            result.Issues.Add(err);
        }
        else
        {
            var warn = _ruleEngine.CheckGpuLengthWarning(gpu.Length, caseSpec.MaxGpuLength, gpu.Name);
            if (warn != null) result.Warnings.Add(warn);
        }
    }

    private void CheckCoolerCompatibility(CpuSpecification cpu, CoolerSpecification cooler, CompatibilityResultDto result)
    {
        if (string.IsNullOrEmpty(cpu.Socket) || cooler.SupportedSockets.Count == 0) return;
        var err = _ruleEngine.CheckCoolerSocket(cooler.SupportedSockets, cpu.Socket, cooler.Name);
        if (err != null)
        {
            result.IsCompatible = false;
            err.Component2 = cpu.Name;
            result.Issues.Add(err);
        }
        else if (cooler.MaxTdp > 0 && cpu.Tdp > cooler.MaxTdp)
        {
            var warn = _ruleEngine.CheckCoolerTdp(cooler.MaxTdp, cpu.Tdp, cooler.Name, cpu.Name);
            if (warn != null) result.Warnings.Add(warn);
        }
    }

    private void CheckCoolerHeight(CoolerSpecification cooler, CaseSpecification caseSpec, CompatibilityResultDto result)
    {
        if (cooler.Height == 0 || caseSpec.MaxCoolerHeight == 0) return;
        var err = _ruleEngine.CheckCoolerHeight(cooler.Height, caseSpec.MaxCoolerHeight, cooler.Name, caseSpec.Name, cooler.Type);
        if (err != null)
        {
            result.IsCompatible = false;
            result.Issues.Add(err);
        }
    }

    private void DetectBottleneck(CpuSpecification cpu, GpuSpecification gpu, string? purpose, CompatibilityResultDto result)
    {
        if (cpu.PerformanceScore <= 0 || gpu.PerformanceScore <= 0) return;
        var warnings = _ruleEngine.DetectBottleneck(cpu.PerformanceScore, gpu.PerformanceScore, cpu.Name, gpu.Name, purpose);
        result.Warnings.AddRange(warnings);
    }

    private void AddPerformanceWarnings(CpuSpecification cpu, GpuSpecification gpu, RamSpecification ram, CompatibilityResultDto result)
    {
        var ramWarn = _ruleEngine.CheckRamCapacity(ram.Capacity, ram.Modules, ram.Name);
        if (ramWarn != null) result.Warnings.Add(ramWarn);

        if (!cpu.HasIntegratedGraphics && gpu.Length == 0)
        {
            var igWarn = _ruleEngine.CheckNoIntegratedGraphics(cpu.Name);
            if (igWarn != null) result.Warnings.Add(igWarn);
        }
    }

    private void CheckEpsAndPciePower(CpuSpecification cpu, MotherboardSpecification mb, GpuSpecification gpu, PsuSpecification psu, CompatibilityResultDto result)
    {
        if (psu.Wattage <= 0) return;
        
        // EPS check
        int requiredEps = Math.Max(1, mb.RequiredEps);
        var epsIssue = _ruleEngine.CheckEpsSupply(requiredEps, psu.EpsCables, mb.Name, psu.Name);
        if (epsIssue != null) { result.IsCompatible = false; result.Issues.Add(epsIssue); }
        
        // PCIe power check
        if (gpu.PcieConnectors > 0 || gpu.Has12Vhpwr)
        {
            var pcieIssue = _ruleEngine.CheckPciePowerSupply(gpu.PcieConnectors, psu.PcieCables, gpu.Has12Vhpwr, psu.Atx3, gpu.Name, psu.Name, out var pcieWarnings);
            if (pcieIssue != null) { result.IsCompatible = false; result.Issues.Add(pcieIssue); }
            result.Warnings.AddRange(pcieWarnings);
        }
    }

    private void CheckVrmAndRamClearance(CpuSpecification cpu, MotherboardSpecification mb, CoolerSpecification cooler, RamSpecification ram, CompatibilityResultDto result)
    {
        if (mb.VrmPhases > 0)
        {
            var vrmWarn = _ruleEngine.CheckVrmCapacity(cpu.Tdp, mb.VrmPhases, mb.VrmMaxTdp, mb.Name, cpu.Name);
            if (vrmWarn != null) result.Warnings.Add(vrmWarn);
        }
    }

    private void CheckUsbCAndGpuSlot(MotherboardSpecification mb, CaseSpecification caseSpec, GpuSpecification gpu, CompatibilityResultDto result)
    {
        if (!string.IsNullOrEmpty(caseSpec.Name))
        {
            var usbWarn = _ruleEngine.CheckUsbCHeader(caseSpec.HasUsbCFront, mb.HasUsbCHeader, mb.Name, caseSpec.Name);
            if (usbWarn != null) result.Warnings.Add(usbWarn);
            
            if (gpu.SlotWidth > 0 && caseSpec.ExpansionSlots > 0)
            {
                var slotWarn = _ruleEngine.CheckGpuSlotWidth(gpu.SlotWidth, caseSpec.ExpansionSlots, gpu.Name, caseSpec.Name);
                if (slotWarn != null) result.Warnings.Add(slotWarn);
            }
        }
    }

    private void CheckStorageM2(CaseSpecification caseSpec, List<SelectedComponentDto>? storageComponents, MotherboardSpecification mb, CompatibilityResultDto result)
    {
        if (storageComponents == null) return;
        foreach (var storage in storageComponents)
        {
            if (storage.Specifications == null) continue;
            var iface = GetSpecValue(storage.Specifications, "interface", "");
            var storageType = GetSpecValue(storage.Specifications, "type", "");
            
            // M.2 SATA in NVMe slot
            if (string.Equals(storageType, "sata", StringComparison.OrdinalIgnoreCase) || 
                string.Equals(iface, "sata", StringComparison.OrdinalIgnoreCase))
            {
                if (!mb.M2SataSupport)
                {
                    result.Issues.Add(new CompatibilityIssueDto
                    {
                        Severity = "Error",
                        Component1 = storage.Name,
                        Component2 = mb.Name,
                        Message = "M.2 SATA SSD несовместим со слотами материнской платы (только NVMe/PCIe).",
                        Suggestion = "Выберите NVMe SSD или SATA SSD 2.5\""
                    });
                    result.IsCompatible = false;
                }
            }
            
            // M.2 PCIe gen check
            var pcieVersion = GetSpecValueInt(storage.Specifications, "pcieVersion", 0, storage.Name);
            if (pcieVersion >= 5 && mb.MaxM2Generation >= 4 && pcieVersion > mb.MaxM2Generation)
            {
                var genWarn = _ruleEngine.CheckM2PcieGen(pcieVersion, mb.MaxM2Generation, storage.Name);
                if (genWarn != null) result.Warnings.Add(genWarn);
            }
        }
    }

    private void CheckPsuBrandAndCable(PsuSpecification psu, CaseSpecification caseSpec, CompatibilityResultDto result)
    {
        var brandWarn = _ruleEngine.CheckPsuBrand(psu.Name, psu.Brand);
        if (brandWarn != null) result.Warnings.Add(brandWarn);
        
        if (psu.EpsCableLength > 0 && caseSpec.Depth.HasValue && caseSpec.Depth.Value > 0)
        {
            var epsLenWarn = _ruleEngine.CheckEpsCableLength(psu.EpsCableLength, caseSpec.Depth.Value, psu.Name, caseSpec.Name);
            if (epsLenWarn != null) result.Warnings.Add(epsLenWarn);
        }
    }

    private void CheckCpuOverclock(CpuSpecification cpu, MotherboardSpecification mb, CompatibilityResultDto result)
    {
        if (cpu.Overclockable && !string.IsNullOrEmpty(mb.Chipset))
        {
            var ocWarn = _ruleEngine.CheckCpuOverclock(mb.Chipset, cpu.Name, mb.Name);
            if (ocWarn != null) result.Warnings.Add(ocWarn);
        }
    }

    private List<SelectedComponentDto> ExtractStorageList(List<SelectedComponentDto>? storage)
    {
        return storage ?? new List<SelectedComponentDto>();
    }

    #endregion
}
