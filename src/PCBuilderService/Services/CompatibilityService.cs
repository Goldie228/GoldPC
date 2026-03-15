using PCBuilderService.DTOs;
using PCBuilderService.Models;

namespace PCBuilderService.Services;

/// <summary>
/// Сервис проверки совместимости компонентов ПК
/// </summary>
public interface ICompatibilityService
{
    /// <summary>
    /// Проверить совместимость конфигурации (старый метод для обратной совместимости)
    /// </summary>
    Task<CompatibilityResult> CheckCompatibilityAsync(PCConfiguration config);
    
    /// <summary>
    /// Проверить совместимость компонентов по DTO
    /// </summary>
    Task<CompatibilityCheckResponse> CheckCompatibilityAsync(CompatibilityCheckRequest request);
    
    /// <summary>
    /// Получить совместимые материнские платы для процессора
    /// </summary>
    Task<IEnumerable<Guid>> GetCompatibleMotherboardsAsync(Guid processorId);
    
    /// <summary>
    /// Получить совместимую память для материнской платы
    /// </summary>
    Task<IEnumerable<Guid>> GetCompatibleRamAsync(Guid motherboardId);
    
    /// <summary>
    /// Рассчитать общую потребляемую мощность
    /// </summary>
    Task<int> CalculateTotalPowerConsumptionAsync(PCConfiguration config);
}

/// <summary>
/// Реализация сервиса проверки совместимости
/// </summary>
public class CompatibilityService : ICompatibilityService
{
    private readonly HttpClient _catalogClient;
    private readonly ILogger<CompatibilityService> _logger;

    // Константы для расчёта мощности
    private const int BASE_SYSTEM_POWER = 50; // Базовое потребление системы (RAM, SSD, вентиляторы)
    private const double PSU_BUFFER_PERCENT = 0.3; // 30% запас мощности
    private const double PSU_MIN_BUFFER_PERCENT = 0.2; // 20% минимальный запас

    public CompatibilityService(HttpClient catalogClient, ILogger<CompatibilityService> logger)
    {
        _catalogClient = catalogClient;
        _logger = logger;
    }

    /// <summary>
    /// Проверка совместимости по DTO (новый метод)
    /// </summary>
    public async Task<CompatibilityCheckResponse> CheckCompatibilityAsync(CompatibilityCheckRequest request)
    {
        var result = new CompatibilityCheckResponse
        {
            Result = new CompatibilityResultDto { IsCompatible = true }
        };

        try
        {
            var components = request.Components;

            // Извлекаем спецификации из DTO
            var cpuSpecs = ExtractCpuSpecs(components.Cpu);
            var motherboardSpecs = ExtractMotherboardSpecs(components.Motherboard);
            var ramSpecs = ExtractRamSpecs(components.Ram);
            var gpuSpecs = ExtractGpuSpecs(components.Gpu);
            var psuSpecs = ExtractPsuSpecs(components.Psu);
            var caseSpecs = ExtractCaseSpecs(components.Case);
            var coolerSpecs = ExtractCoolerSpecs(components.Cooling);

            // 1. Проверка сокета процессор-материнская плата
            CheckSocketCompatibility(cpuSpecs, motherboardSpecs, result.Result);

            // 2. Проверка типа памяти (RAM generation matching)
            CheckRamCompatibility(motherboardSpecs, ramSpecs, result.Result);

            // 3. Проверка мощности блока питания
            var totalTdp = CalculateTotalTdp(cpuSpecs, gpuSpecs);
            result.PowerConsumption = totalTdp;
            result.RecommendedPsu = CalculateRecommendedPsu(totalTdp);
            CheckPsuCompatibility(psuSpecs, totalTdp, result.Result);

            // 4. Проверка форм-фактора материнской платы и корпуса
            CheckFormFactorCompatibility(motherboardSpecs, caseSpecs, result.Result);

            // 5. Проверка габаритов видеокарты и корпуса
            CheckGpuDimensions(gpuSpecs, caseSpecs, result.Result);

            // 6. Проверка системы охлаждения
            CheckCoolerCompatibility(cpuSpecs, coolerSpecs, result.Result);

            // 7. Проверка высоты кулера и корпуса
            CheckCoolerHeight(coolerSpecs, caseSpecs, result.Result);

            // 8. Дополнительные предупреждения
            AddPerformanceWarnings(cpuSpecs, gpuSpecs, ramSpecs, result.Result);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при проверке совместимости");
            throw;
        }
    }

    /// <summary>
    /// Старый метод для обратной совместимости
    /// </summary>
    public async Task<CompatibilityResult> CheckCompatibilityAsync(PCConfiguration config)
    {
        // Конвертируем старый формат в новый
        var request = new CompatibilityCheckRequest
        {
            Components = new PCComponentsDto
            {
                Cpu = config.ProcessorId.HasValue ? new SelectedComponentDto 
                { 
                    ProductId = config.ProcessorId.Value, 
                    Name = "CPU" 
                } : null,
                Motherboard = config.MotherboardId.HasValue ? new SelectedComponentDto 
                { 
                    ProductId = config.MotherboardId.Value, 
                    Name = "Motherboard" 
                } : null,
                Ram = config.RamId.HasValue ? new SelectedComponentDto 
                { 
                    ProductId = config.RamId.Value, 
                    Name = "RAM" 
                } : null,
                Gpu = config.GpuId.HasValue ? new SelectedComponentDto 
                { 
                    ProductId = config.GpuId.Value, 
                    Name = "GPU" 
                } : null,
                Psu = config.PsuId.HasValue ? new SelectedComponentDto 
                { 
                    ProductId = config.PsuId.Value, 
                    Name = "PSU" 
                } : null,
                Case = config.CaseId.HasValue ? new SelectedComponentDto 
                { 
                    ProductId = config.CaseId.Value, 
                    Name = "Case" 
                } : null,
                Cooling = config.CoolerId.HasValue ? new SelectedComponentDto 
                { 
                    ProductId = config.CoolerId.Value, 
                    Name = "Cooler" 
                } : null
            }
        };

        var response = await CheckCompatibilityAsync(request);

        // Конвертируем результат
        return new CompatibilityResult
        {
            IsCompatible = response.Result.IsCompatible,
            Issues = response.Result.Issues.Select(i => new CompatibilityIssue
            {
                ComponentType = i.Component1,
                Message = i.Message,
                Details = i.Suggestion ?? ""
            }).ToList(),
            Warnings = response.Result.Warnings.Select(w => new CompatibilityWarning
            {
                ComponentType = w.Component,
                Message = w.Message,
                Recommendation = w.Suggestion ?? ""
            }).ToList()
        };
    }

    public async Task<IEnumerable<Guid>> GetCompatibleMotherboardsAsync(Guid processorId)
    {
        // Заглушка - в реальности будет запрос к Catalog Service
        // для получения списка материнских плат с совместимым сокетом
        return Enumerable.Empty<Guid>();
    }

    public async Task<IEnumerable<Guid>> GetCompatibleRamAsync(Guid motherboardId)
    {
        // Заглушка - в реальности будет запрос к Catalog Service
        return Enumerable.Empty<Guid>();
    }

    public async Task<int> CalculateTotalPowerConsumptionAsync(PCConfiguration config)
    {
        var request = new CompatibilityCheckRequest
        {
            Components = new PCComponentsDto
            {
                Cpu = config.ProcessorId.HasValue ? new SelectedComponentDto 
                { 
                    ProductId = config.ProcessorId.Value, 
                    Name = "CPU" 
                } : null,
                Gpu = config.GpuId.HasValue ? new SelectedComponentDto 
                { 
                    ProductId = config.GpuId.Value, 
                    Name = "GPU" 
                } : null
            }
        };

        var cpuSpecs = ExtractCpuSpecs(request.Components.Cpu);
        var gpuSpecs = ExtractGpuSpecs(request.Components.Gpu);
        
        return CalculateTotalTdp(cpuSpecs, gpuSpecs);
    }

    #region Спецификации компонентов

    /// <summary>
    /// Спецификации процессора для проверки совместимости
    /// </summary>
    private class CpuSpecification
    {
        public string Name { get; set; } = "";
        public string Socket { get; set; } = "";
        public int Tdp { get; set; }
        public int PerformanceScore { get; set; }
    }

    /// <summary>
    /// Спецификации материнской платы
    /// </summary>
    private class MotherboardSpecification
    {
        public string Name { get; set; } = "";
        public string Socket { get; set; } = "";
        public string RamType { get; set; } = "";
        public int RamSlots { get; set; }
        public int MaxRamSpeed { get; set; }
        public string FormFactor { get; set; } = "";
    }

    /// <summary>
    /// Спецификации оперативной памяти
    /// </summary>
    private class RamSpecification
    {
        public string Name { get; set; } = "";
        public string Type { get; set; } = "";
        public int Speed { get; set; }
        public int Capacity { get; set; }
        public int Modules { get; set; }
    }

    /// <summary>
    /// Спецификации видеокарты
    /// </summary>
    private class GpuSpecification
    {
        public string Name { get; set; } = "";
        public int Length { get; set; }
        public int Tdp { get; set; }
        public int RecommendedPsu { get; set; }
        public int PerformanceScore { get; set; }
    }

    /// <summary>
    /// Спецификации блока питания
    /// </summary>
    private class PsuSpecification
    {
        public string Name { get; set; } = "";
        public int Wattage { get; set; }
        public string Certification { get; set; } = "";
        public bool Modular { get; set; }
    }

    /// <summary>
    /// Спецификации корпуса
    /// </summary>
    private class CaseSpecification
    {
        public string Name { get; set; } = "";
        public int MaxGpuLength { get; set; }
        public int MaxCoolerHeight { get; set; }
        public List<string> SupportedFormFactors { get; set; } = new();
    }

    /// <summary>
    /// Спецификации системы охлаждения
    /// </summary>
    private class CoolerSpecification
    {
        public string Name { get; set; } = "";
        public string Type { get; set; } = "";
        public int Height { get; set; }
        public int MaxTdp { get; set; }
        public List<string> SupportedSockets { get; set; } = new();
    }

    #endregion

    #region Извлечение спецификаций из DTO

    private CpuSpecification ExtractCpuSpecs(SelectedComponentDto? cpu)
    {
        if (cpu == null)
            return new CpuSpecification();

        var specs = cpu.Specifications;
        return new CpuSpecification
        {
            Name = cpu.Name,
            Socket = GetSpecValue(specs, "socket", ""),
            Tdp = GetSpecValueInt(specs, "tdp", 65),
            PerformanceScore = GetSpecValueInt(specs, "performanceScore", 0)
        };
    }

    private MotherboardSpecification ExtractMotherboardSpecs(SelectedComponentDto? motherboard)
    {
        if (motherboard == null)
            return new MotherboardSpecification();

        var specs = motherboard.Specifications;
        return new MotherboardSpecification
        {
            Name = motherboard.Name,
            Socket = GetSpecValue(specs, "socket", ""),
            RamType = GetSpecValue(specs, "ramType", ""),
            RamSlots = GetSpecValueInt(specs, "ramSlots", 4),
            MaxRamSpeed = GetSpecValueInt(specs, "maxRamSpeed", 3200),
            FormFactor = GetSpecValue(specs, "formFactor", "ATX")
        };
    }

    private RamSpecification ExtractRamSpecs(SelectedComponentDto? ram)
    {
        if (ram == null)
            return new RamSpecification();

        var specs = ram.Specifications;
        return new RamSpecification
        {
            Name = ram.Name,
            Type = GetSpecValue(specs, "type", ""),
            Speed = GetSpecValueInt(specs, "speed", 3200),
            Capacity = GetSpecValueInt(specs, "capacity", 16),
            Modules = GetSpecValueInt(specs, "modules", 1)
        };
    }

    private GpuSpecification ExtractGpuSpecs(SelectedComponentDto? gpu)
    {
        if (gpu == null)
            return new GpuSpecification();

        var specs = gpu.Specifications;
        return new GpuSpecification
        {
            Name = gpu.Name,
            Length = GetSpecValueInt(specs, "length", 300),
            Tdp = GetSpecValueInt(specs, "tdp", 200),
            RecommendedPsu = GetSpecValueInt(specs, "recommendedPsu", 550),
            PerformanceScore = GetSpecValueInt(specs, "performanceScore", 0)
        };
    }

    private PsuSpecification ExtractPsuSpecs(SelectedComponentDto? psu)
    {
        if (psu == null)
            return new PsuSpecification();

        var specs = psu.Specifications;
        return new PsuSpecification
        {
            Name = psu.Name,
            Wattage = GetSpecValueInt(specs, "wattage", 550),
            Certification = GetSpecValue(specs, "certification", "80+ Bronze"),
            Modular = GetSpecValueBool(specs, "modular", false)
        };
    }

    private CaseSpecification ExtractCaseSpecs(SelectedComponentDto? caseComponent)
    {
        if (caseComponent == null)
            return new CaseSpecification();

        var specs = caseComponent.Specifications;
        var supportedFormFactors = GetSpecValue(specs, "supportedFormFactors", "ATX,mATX,ITX")
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToList();

        return new CaseSpecification
        {
            Name = caseComponent.Name,
            MaxGpuLength = GetSpecValueInt(specs, "maxGpuLength", 320),
            MaxCoolerHeight = GetSpecValueInt(specs, "maxCoolerHeight", 160),
            SupportedFormFactors = supportedFormFactors
        };
    }

    private CoolerSpecification ExtractCoolerSpecs(SelectedComponentDto? cooler)
    {
        if (cooler == null)
            return new CoolerSpecification();

        var specs = cooler.Specifications;
        var supportedSockets = GetSpecValue(specs, "supportedSockets", "")
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToList();

        return new CoolerSpecification
        {
            Name = cooler.Name,
            Type = GetSpecValue(specs, "type", "Air"),
            Height = GetSpecValueInt(specs, "height", 160),
            MaxTdp = GetSpecValueInt(specs, "maxTdp", 150),
            SupportedSockets = supportedSockets
        };
    }

    private static string GetSpecValue(Dictionary<string, object>? specs, string key, string defaultValue)
    {
        if (specs == null || !specs.TryGetValue(key, out var value))
            return defaultValue;
        
        return value?.ToString() ?? defaultValue;
    }

    private static int GetSpecValueInt(Dictionary<string, object>? specs, string key, int defaultValue)
    {
        if (specs == null || !specs.TryGetValue(key, out var value))
            return defaultValue;

        if (value is int intValue)
            return intValue;
        
        if (value is long longValue)
            return (int)longValue;
        
        if (int.TryParse(value?.ToString(), out var parsed))
            return parsed;

        return defaultValue;
    }

    private static bool GetSpecValueBool(Dictionary<string, object>? specs, string key, bool defaultValue)
    {
        if (specs == null || !specs.TryGetValue(key, out var value))
            return defaultValue;

        if (value is bool boolValue)
            return boolValue;

        if (bool.TryParse(value?.ToString(), out var parsed))
            return parsed;

        return defaultValue;
    }

    #endregion

    #region Проверки совместимости

    /// <summary>
    /// Проверка совместимости сокета CPU и материнской платы
    /// FT-2.4: Socket matching (CPU vs Motherboard)
    /// </summary>
    private void CheckSocketCompatibility(CpuSpecification cpu, MotherboardSpecification motherboard, CompatibilityResultDto result)
    {
        // Если один из компонентов не выбран - пропускаем проверку
        if (string.IsNullOrEmpty(cpu.Socket) || string.IsNullOrEmpty(motherboard.Socket))
            return;

        if (!string.Equals(cpu.Socket, motherboard.Socket, StringComparison.OrdinalIgnoreCase))
        {
            result.IsCompatible = false;
            result.Issues.Add(new CompatibilityIssueDto
            {
                Severity = "Error",
                Component1 = cpu.Name,
                Component2 = motherboard.Name,
                Message = $"Процессор {cpu.Name} (сокет {cpu.Socket}) несовместим с материнской платой {motherboard.Name} (сокет {motherboard.Socket})",
                Suggestion = $"Выберите материнскую плату с сокетом {cpu.Socket} или процессор с сокетом {motherboard.Socket}"
            });
        }
        else
        {
            _logger.LogDebug("Сокет совместим: CPU={CpuSocket}, MB={MbSocket}", cpu.Socket, motherboard.Socket);
        }
    }

    /// <summary>
    /// Проверка совместимости типа памяти
    /// FT-2.4: RAM generation matching (Motherboard vs RAM)
    /// </summary>
    private void CheckRamCompatibility(MotherboardSpecification motherboard, RamSpecification ram, CompatibilityResultDto result)
    {
        // Если один из компонентов не выбран - пропускаем проверку
        if (string.IsNullOrEmpty(motherboard.RamType) || string.IsNullOrEmpty(ram.Type))
            return;

        if (!string.Equals(motherboard.RamType, ram.Type, StringComparison.OrdinalIgnoreCase))
        {
            result.IsCompatible = false;
            result.Issues.Add(new CompatibilityIssueDto
            {
                Severity = "Error",
                Component1 = ram.Name,
                Component2 = motherboard.Name,
                Message = $"Память {ram.Name} ({ram.Type}) несовместима с материнской платой {motherboard.Name} (поддерживает {motherboard.RamType})",
                Suggestion = $"Выберите память типа {motherboard.RamType} или материнскую плату с поддержкой {ram.Type}"
            });
        }
        else
        {
            // Проверка на соответствие скорости памяти поддерживаемой материнской платой
            if (ram.Speed > motherboard.MaxRamSpeed)
            {
                result.Warnings.Add(new CompatibilityWarningDto
                {
                    Severity = "Warning",
                    Component = ram.Name,
                    Message = $"Скорость памяти {ram.Speed} МГц превышает максимальную поддерживаемую {motherboard.MaxRamSpeed} МГц. Память будет работать на пониженной частоте.",
                    Suggestion = $"Для полной реализации потенциала памяти выберите материнскую плату с поддержкой {ram.Speed} МГц"
                });
            }

            // Проверка количества модулей
            if (ram.Modules > motherboard.RamSlots)
            {
                result.IsCompatible = false;
                result.Issues.Add(new CompatibilityIssueDto
                {
                    Severity = "Error",
                    Component1 = ram.Name,
                    Component2 = motherboard.Name,
                    Message = $"Невозможно установить {ram.Modules} модулей памяти в материнскую плату с {motherboard.RamSlots} слотами",
                    Suggestion = $"Выберите набор памяти с количеством модулей не более {motherboard.RamSlots}"
                });
            }
        }
    }

    /// <summary>
    /// Проверка достаточности мощности блока питания
    /// FT-2.4: PSU wattage sufficiency (Sum of CPU + GPU TDP + buffer)
    /// </summary>
    private void CheckPsuCompatibility(PsuSpecification psu, int totalTdp, CompatibilityResultDto result)
    {
        // Если БП не выбран - пропускаем проверку
        if (psu.Wattage == 0)
            return;

        var recommendedPsu = CalculateRecommendedPsu(totalTdp);
        var minRequiredPsu = (int)(totalTdp * (1 + PSU_MIN_BUFFER_PERCENT));

        if (psu.Wattage < minRequiredPsu)
        {
            result.IsCompatible = false;
            result.Issues.Add(new CompatibilityIssueDto
            {
                Severity = "Error",
                Component1 = psu.Name,
                Component2 = "Система",
                Message = $"Мощность блока питания {psu.Name} ({psu.Wattage} Вт) недостаточна. Потребление системы: {totalTdp} Вт, минимум с запасом: {minRequiredPsu} Вт",
                Suggestion = $"Рекомендуется блок питания мощностью не менее {recommendedPsu} Вт"
            });
        }
        else if (psu.Wattage < recommendedPsu)
        {
            result.Warnings.Add(new CompatibilityWarningDto
            {
                Severity = "Warning",
                Component = psu.Name,
                Message = $"Мощность блока питания {psu.Wattage} Вт соответствует минимальным требованиям, но для оптимальной работы рекомендуется {recommendedPsu} Вт",
                Suggestion = $"Рассмотрите блок питания мощностью {recommendedPsu} Вт или выше"
            });
        }

        // Информация о сертификации
        if (!string.IsNullOrEmpty(psu.Certification))
        {
            var lowerTierCertifications = new[] { "80+", "80+ White" };
            if (lowerTierCertifications.Any(c => string.Equals(psu.Certification, c, StringComparison.OrdinalIgnoreCase)) && totalTdp > 400)
            {
                result.Warnings.Add(new CompatibilityWarningDto
                {
                    Severity = "Info",
                    Component = psu.Name,
                    Message = $"Блок питания с сертификацией {psu.Certification} может иметь низкий КПД при высокой нагрузке",
                    Suggestion = "Рассмотрите блок питания с сертификатом 80+ Bronze или выше"
                });
            }
        }
    }

    /// <summary>
    /// Проверка совместимости форм-фактора материнской платы и корпуса
    /// FT-2.4: Form-factor compatibility (Motherboard vs Case)
    /// </summary>
    private void CheckFormFactorCompatibility(MotherboardSpecification motherboard, CaseSpecification caseSpec, CompatibilityResultDto result)
    {
        // Если один из компонентов не выбран - пропускаем проверку
        if (string.IsNullOrEmpty(motherboard.FormFactor) || caseSpec.SupportedFormFactors.Count == 0)
            return;

        // Нормализация форм-фактора материнской платы
        var mbFormFactor = NormalizeFormFactor(motherboard.FormFactor);
        var supportedFormFactors = caseSpec.SupportedFormFactors.Select(NormalizeFormFactor).ToList();

        if (!supportedFormFactors.Contains(mbFormFactor, StringComparer.OrdinalIgnoreCase))
        {
            result.IsCompatible = false;
            result.Issues.Add(new CompatibilityIssueDto
            {
                Severity = "Error",
                Component1 = motherboard.Name,
                Component2 = caseSpec.Name,
                Message = $"Материнская плата форм-фактора {motherboard.FormFactor} не подходит для корпуса {caseSpec.Name}. Поддерживаемые форм-факторы: {string.Join(", ", caseSpec.SupportedFormFactors)}",
                Suggestion = $"Выберите материнскую плату форм-фактора {string.Join(" или ", caseSpec.SupportedFormFactors)} или другой корпус"
            });
        }
    }

    /// <summary>
    /// Проверка габаритов видеокарты и корпуса
    /// </summary>
    private void CheckGpuDimensions(GpuSpecification gpu, CaseSpecification caseSpec, CompatibilityResultDto result)
    {
        // Если один из компонентов не выбран - пропускаем проверку
        if (gpu.Length == 0 || caseSpec.MaxGpuLength == 0)
            return;

        if (gpu.Length > caseSpec.MaxGpuLength)
        {
            result.IsCompatible = false;
            result.Issues.Add(new CompatibilityIssueDto
            {
                Severity = "Error",
                Component1 = gpu.Name,
                Component2 = caseSpec.Name,
                Message = $"Видеокарта {gpu.Name} (длина {gpu.Length} мм) не поместится в корпус {caseSpec.Name} (макс. длина {caseSpec.MaxGpuLength} мм)",
                Suggestion = $"Выберите видеокарту короче {caseSpec.MaxGpuLength} мм или корпус с большим пространством для видеокарты"
            });
        }
        else if (gpu.Length > caseSpec.MaxGpuLength - 20)
        {
            result.Warnings.Add(new CompatibilityWarningDto
            {
                Severity = "Warning",
                Component = gpu.Name,
                Message = $"Видеокарта {gpu.Name} ({gpu.Length} мм) почти касается передней стенки корпуса (макс. {caseSpec.MaxGpuLength} мм). Это может затруднить установку и ухудшить охлаждение.",
                Suggestion = "Рассмотрите корпус с большим пространством для видеокарты"
            });
        }
    }

    /// <summary>
    /// Проверка совместимости кулера с процессором (по сокету и TDP)
    /// </summary>
    private void CheckCoolerCompatibility(CpuSpecification cpu, CoolerSpecification cooler, CompatibilityResultDto result)
    {
        // Если один из компонентов не выбран - пропускаем проверку
        if (string.IsNullOrEmpty(cpu.Socket) || cooler.SupportedSockets.Count == 0)
            return;

        // Проверка поддержки сокета
        if (!cooler.SupportedSockets.Contains(cpu.Socket, StringComparer.OrdinalIgnoreCase))
        {
            result.IsCompatible = false;
            result.Issues.Add(new CompatibilityIssueDto
            {
                Severity = "Error",
                Component1 = cooler.Name,
                Component2 = cpu.Name,
                Message = $"Кулер {cooler.Name} не поддерживает сокет {cpu.Socket}",
                Suggestion = $"Выберите кулер с поддержкой сокета {cpu.Socket}"
            });
            return;
        }

        // Проверка TDP охлаждения
        if (cooler.MaxTdp > 0 && cpu.Tdp > cooler.MaxTdp)
        {
            result.Warnings.Add(new CompatibilityWarningDto
            {
                Severity = "Warning",
                Component = cooler.Name,
                Message = $"Кулер {cooler.Name} (макс. TDP {cooler.MaxTdp} Вт) может быть недостаточен для процессора {cpu.Name} (TDP {cpu.Tdp} Вт)",
                Suggestion = $"Рекомендуется кулер с TDP охлаждения не менее {cpu.Tdp} Вт"
            });
        }
    }

    /// <summary>
    /// Проверка высоты кулера и корпуса
    /// </summary>
    private void CheckCoolerHeight(CoolerSpecification cooler, CaseSpecification caseSpec, CompatibilityResultDto result)
    {
        // Если один из компонентов не выбран - пропускаем проверку
        if (cooler.Height == 0 || caseSpec.MaxCoolerHeight == 0)
            return;

        // Только для воздушных кулеров
        if (!string.Equals(cooler.Type, "Air", StringComparison.OrdinalIgnoreCase))
            return;

        if (cooler.Height > caseSpec.MaxCoolerHeight)
        {
            result.IsCompatible = false;
            result.Issues.Add(new CompatibilityIssueDto
            {
                Severity = "Error",
                Component1 = cooler.Name,
                Component2 = caseSpec.Name,
                Message = $"Кулер {cooler.Name} (высота {cooler.Height} мм) не поместится в корпус {caseSpec.Name} (макс. высота кулера {caseSpec.MaxCoolerHeight} мм)",
                Suggestion = $"Выберите кулер высотой не более {caseSpec.MaxCoolerHeight} мм, систему водяного охлаждения или другой корпус"
            });
        }
    }

    /// <summary>
    /// Добавление предупреждений о балансе производительности
    /// </summary>
    private void AddPerformanceWarnings(CpuSpecification cpu, GpuSpecification gpu, RamSpecification ram, CompatibilityResultDto result)
    {
        // Предупреждение о балансе CPU и GPU (bottleneck)
        if (cpu.PerformanceScore > 0 && gpu.PerformanceScore > 0)
        {
            var ratio = (double)cpu.PerformanceScore / gpu.PerformanceScore;
            
            if (ratio < 0.7)
            {
                result.Warnings.Add(new CompatibilityWarningDto
                {
                    Severity = "Info",
                    Component = cpu.Name,
                    Message = $"Процессор {cpu.Name} может ограничивать производительность видеокарты {gpu.Name}",
                    Suggestion = "Рассмотрите более мощный процессор для полной реализации потенциала видеокарты"
                });
            }
            else if (ratio > 1.4)
            {
                result.Warnings.Add(new CompatibilityWarningDto
                {
                    Severity = "Info",
                    Component = gpu.Name,
                    Message = $"Видеокарта {gpu.Name} может ограничивать производительность процессора {cpu.Name}",
                    Suggestion = "Рассмотрите более мощную видеокарту для игр, или эта конфигурация отлично подойдёт для рабочих задач"
                });
            }
        }

        // Предупреждение об объёме памяти
        if (ram.Capacity > 0)
        {
            if (ram.Capacity < 16)
            {
                result.Warnings.Add(new CompatibilityWarningDto
                {
                    Severity = "Info",
                    Component = ram.Name,
                    Message = $"Объём памяти {ram.Capacity} ГБ может быть недостаточен для современных игр и приложений",
                    Suggestion = "Рекомендуется минимум 16 ГБ памяти для комфортной работы"
                });
            }
        }
    }

    #endregion

    #region Расчёт мощности

    /// <summary>
    /// Расчёт общего TDP системы
    /// </summary>
    private int CalculateTotalTdp(CpuSpecification cpu, GpuSpecification gpu)
    {
        var total = BASE_SYSTEM_POWER; // Базовое потребление
        
        total += cpu.Tdp;
        total += gpu.Tdp;

        // Добавляем запас на пиковые нагрузки
        total = (int)(total * 1.1);

        return total;
    }

    /// <summary>
    /// Расчёт рекомендуемой мощности БП
    /// </summary>
    private int CalculateRecommendedPsu(int totalTdp)
    {
        var recommended = totalTdp * (1 + PSU_BUFFER_PERCENT);
        // Округляем до ближайших 50 Вт вверх
        return ((int)Math.Ceiling(recommended / 50.0)) * 50;
    }

    /// <summary>
    /// Нормализация форм-фактора для сравнения
    /// </summary>
    private static string NormalizeFormFactor(string formFactor)
    {
        return formFactor.ToUpperInvariant() switch
        {
            "ATX" or "STANDARD-ATX" => "ATX",
            "MATX" or "MICRO-ATX" or "M-ATX" or "M ATX" => "mATX",
            "ITX" or "MINI-ITX" or "MINI ITX" => "ITX",
            "EATX" or "EXTENDED-ATX" => "EATX",
            _ => formFactor.ToUpperInvariant()
        };
    }

    #endregion
}