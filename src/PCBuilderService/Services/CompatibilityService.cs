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
    private readonly HttpClient _catalogClient;
    private readonly ILogger<CompatibilityService> _logger;
    private readonly CompatibilityRuleEngine _ruleEngine;

    public CompatibilityService(
        HttpClient catalogClient,
        ILogger<CompatibilityService> logger,
        CompatibilityRuleEngine ruleEngine)
    {
        _catalogClient = catalogClient;
        _logger = logger;
        _ruleEngine = ruleEngine;
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

    public async Task<IEnumerable<Guid>> GetCompatibleMotherboardsAsync(Guid processorId) => Enumerable.Empty<Guid>();
    public async Task<IEnumerable<Guid>> GetCompatibleRamAsync(Guid motherboardId) => Enumerable.Empty<Guid>();

    public async Task<int> CalculateTotalPowerConsumptionAsync(PCConfiguration config)
    {
        var cpuSpecs = config.ProcessorId.HasValue ? ExtractCpuSpecs(new SelectedComponentDto { ProductId = config.ProcessorId.Value, Name = "CPU" }) : new CpuSpecification();
        var gpuSpecs = config.GpuId.HasValue ? ExtractGpuSpecs(new SelectedComponentDto { ProductId = config.GpuId.Value, Name = "GPU" }) : new GpuSpecification();
        return _ruleEngine.CalculateTotalTdp(cpuSpecs.Tdp, gpuSpecs.Tdp);
    }

    #region Спецификации компонентов
    private class CpuSpecification { public string Name { get; set; } = ""; public string Socket { get; set; } = ""; public int Tdp { get; set; } public int PerformanceScore { get; set; } public bool HasIntegratedGraphics { get; set; } }
    private class MotherboardSpecification { public string Name { get; set; } = ""; public string Socket { get; set; } = ""; public string RamType { get; set; } = ""; public int RamSlots { get; set; } public int MaxRamSpeed { get; set; } public string FormFactor { get; set; } = ""; public string? Chipset { get; set; } }
    private class RamSpecification { public string Name { get; set; } = ""; public string Type { get; set; } = ""; public int Speed { get; set; } public int Capacity { get; set; } public int Modules { get; set; } }
    private class GpuSpecification { public string Name { get; set; } = ""; public int Length { get; set; } public int Tdp { get; set; } public int RecommendedPsu { get; set; } public int PerformanceScore { get; set; } }
    private class PsuSpecification { public string Name { get; set; } = ""; public int Wattage { get; set; } public string Certification { get; set; } = ""; public bool Modular { get; set; } }
    private class CaseSpecification { public string Name { get; set; } = ""; public int MaxGpuLength { get; set; } public int MaxCoolerHeight { get; set; } public List<string> SupportedFormFactors { get; set; } = new(); }
    private class CoolerSpecification { public string Name { get; set; } = ""; public string Type { get; set; } = ""; public int Height { get; set; } public int MaxTdp { get; set; } public List<string> SupportedSockets { get; set; } = new(); }
    #endregion

    #region Извлечение спецификаций
    private CpuSpecification ExtractCpuSpecs(SelectedComponentDto? cpu)
    {
        if (cpu == null) return new CpuSpecification();
        var s = cpu.Specifications;
        return new CpuSpecification
        {
            Name = cpu.Name,
            Socket = GetSpecValue(s, "socket", ""),
            Tdp = GetSpecValueInt(s, "tdp", 65),
            PerformanceScore = GetSpecValueInt(s, "performanceScore", 0),
            HasIntegratedGraphics = GetSpecValueBool(s, "integratedGraphics", false)
        };
    }

    private MotherboardSpecification ExtractMotherboardSpecs(SelectedComponentDto? mb)
    {
        if (mb == null) return new MotherboardSpecification();
        var s = mb.Specifications;
        return new MotherboardSpecification
        {
            Name = mb.Name,
            Socket = GetSpecValue(s, "socket", ""),
            RamType = GetSpecValue(s, "ramType", ""),
            RamSlots = GetSpecValueInt(s, "ramSlots", 4),
            MaxRamSpeed = GetSpecValueInt(s, "maxRamSpeed", 3200),
            FormFactor = GetSpecValue(s, "formFactor", "ATX"),
            Chipset = GetSpecValue(s, "chipset", "")
        };
    }

    private RamSpecification ExtractRamSpecs(SelectedComponentDto? ram)
    {
        if (ram == null) return new RamSpecification();
        var s = ram.Specifications;
        return new RamSpecification
        {
            Name = ram.Name,
            Type = GetSpecValue(s, "type", ""),
            Speed = GetSpecValueInt(s, "speed", 3200),
            Capacity = GetSpecValueInt(s, "capacity", 16),
            Modules = GetSpecValueInt(s, "modules", 1)
        };
    }

    private GpuSpecification ExtractGpuSpecs(SelectedComponentDto? gpu)
    {
        if (gpu == null) return new GpuSpecification();
        var s = gpu.Specifications;
        return new GpuSpecification
        {
            Name = gpu.Name,
            Length = GetSpecValueInt(s, "length", 300),
            Tdp = GetSpecValueInt(s, "tdp", 200),
            RecommendedPsu = GetSpecValueInt(s, "recommendedPsu", 550),
            PerformanceScore = GetSpecValueInt(s, "performanceScore", 0)
        };
    }

    private PsuSpecification ExtractPsuSpecs(SelectedComponentDto? psu)
    {
        if (psu == null) return new PsuSpecification();
        var s = psu.Specifications;
        return new PsuSpecification
        {
            Name = psu.Name,
            Wattage = GetSpecValueInt(s, "wattage", 550),
            Certification = GetSpecValue(s, "certification", "80+ Bronze"),
            Modular = GetSpecValueBool(s, "modular", false)
        };
    }

    private CaseSpecification ExtractCaseSpecs(SelectedComponentDto? c)
    {
        if (c == null) return new CaseSpecification();
        var s = c.Specifications;
        return new CaseSpecification
        {
            Name = c.Name,
            MaxGpuLength = GetSpecValueInt(s, "maxGpuLength", 320),
            MaxCoolerHeight = GetSpecValueInt(s, "maxCoolerHeight", 160),
            SupportedFormFactors = GetSpecValue(s, "supportedFormFactors", "ATX,mATX,ITX").Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList()
        };
    }

    private CoolerSpecification ExtractCoolerSpecs(SelectedComponentDto? cooler)
    {
        if (cooler == null) return new CoolerSpecification();
        var s = cooler.Specifications;
        return new CoolerSpecification
        {
            Name = cooler.Name,
            Type = GetSpecValue(s, "type", "Air"),
            Height = GetSpecValueInt(s, "height", 160),
            MaxTdp = GetSpecValueInt(s, "maxTdp", 150),
            SupportedSockets = GetSpecValue(s, "supportedSockets", "").Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList()
        };
    }

    private static string GetSpecValue(Dictionary<string, object>? specs, string key, string defaultValue) { if (specs == null || !specs.TryGetValue(key, out var value)) return defaultValue; return value?.ToString() ?? defaultValue; }
    private static int GetSpecValueInt(Dictionary<string, object>? specs, string key, int defaultValue) { if (specs == null || !specs.TryGetValue(key, out var value)) return defaultValue; if (value is int i) return i; if (value is long l) return (int)l; if (int.TryParse(value?.ToString(), out var p)) return p; return defaultValue; }
    private static bool GetSpecValueBool(Dictionary<string, object>? specs, string key, bool defaultValue) { if (specs == null || !specs.TryGetValue(key, out var value)) return defaultValue; if (value is bool b) return b; if (bool.TryParse(value?.ToString(), out var p)) return p; return defaultValue; }
    #endregion

    #region Проверки совместимости (делегирование движку правил)

    private void CheckSocketCompatibility(CpuSpecification cpu, MotherboardSpecification mb, CompatibilityResultDto result)
    {
        if (string.IsNullOrEmpty(cpu.Socket) || string.IsNullOrEmpty(mb.Socket)) return;
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
        }
        // BIOS warning
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
        if (string.IsNullOrEmpty(mb.RamType) || string.IsNullOrEmpty(ram.Type)) return;
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
        if (err != null) { result.IsCompatible = false; err.Component2 = "System"; result.Issues.Add(err); }
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
        if (err != null) { result.IsCompatible = false; result.Issues.Add(err); }
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
        if (err != null) { result.IsCompatible = false; err.Component2 = cpu.Name; result.Issues.Add(err); }
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
        if (err != null) { result.IsCompatible = false; result.Issues.Add(err); }
    }

    private void DetectBottleneck(CpuSpecification cpu, GpuSpecification gpu, string? purpose, CompatibilityResultDto result)
    {
        if (cpu.PerformanceScore <= 0 || gpu.PerformanceScore <= 0) return;
        var warnings = _ruleEngine.DetectBottleneck(cpu.PerformanceScore, gpu.PerformanceScore, cpu.Name, gpu.Name, purpose);
        result.Warnings.AddRange(warnings);
    }

    private void AddPerformanceWarnings(CpuSpecification cpu, GpuSpecification gpu, RamSpecification ram, CompatibilityResultDto result)
    {
        // RAM capacity warning
        var ramWarn = _ruleEngine.CheckRamCapacity(ram.Capacity, ram.Name);
        if (ramWarn != null) result.Warnings.Add(ramWarn);

        // No integrated graphics warning
        if (!cpu.HasIntegratedGraphics && gpu.Length == 0)
        {
            var igWarn = _ruleEngine.CheckNoIntegratedGraphics(cpu.Name);
            if (igWarn != null) result.Warnings.Add(igWarn);
        }
    }

    #endregion
}
