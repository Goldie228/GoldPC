using PCBuilderService.Models;

namespace PCBuilderService.Services;

/// <summary>
/// Сервис проверки совместимости компонентов ПК
/// </summary>
public interface ICompatibilityService
{
    /// <summary>
    /// Проверить совместимость конфигурации
    /// </summary>
    Task<CompatibilityResult> CheckCompatibilityAsync(PCConfiguration config);
    
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

    public CompatibilityService(HttpClient catalogClient, ILogger<CompatibilityService> logger)
    {
        _catalogClient = catalogClient;
        _logger = logger;
    }

    public async Task<CompatibilityResult> CheckCompatibilityAsync(PCConfiguration config)
    {
        var result = new CompatibilityResult { IsCompatible = true };

        try
        {
            // Получаем спецификации всех выбранных компонентов
            var specs = await GetConfigurationSpecsAsync(config);

            // 1. Проверка сокета процессор-материнская плата
            if (specs.Processor != null && specs.Motherboard != null)
            {
                if (!string.Equals(specs.Processor.Socket, specs.Motherboard.Socket, StringComparison.OrdinalIgnoreCase))
                {
                    result.Issues.Add(new CompatibilityIssue
                    {
                        ComponentType = "Processor/Motherboard",
                        Message = "Несовместимый сокет",
                        Details = $"Процессор ({specs.Processor.Socket}) не совместим с материнской платой ({specs.Motherboard.Socket})"
                    });
                    result.IsCompatible = false;
                }
            }

            // 2. Проверка типа памяти
            if (specs.Motherboard != null && specs.Ram != null)
            {
                if (!string.Equals(specs.Motherboard.RamType, specs.Ram.Type, StringComparison.OrdinalIgnoreCase))
                {
                    result.Issues.Add(new CompatibilityIssue
                    {
                        ComponentType = "RAM/Motherboard",
                        Message = "Несовместимый тип памяти",
                        Details = $"Материнская плата поддерживает {specs.Motherboard.RamType}, выбрано {specs.Ram.Type}"
                    });
                    result.IsCompatible = false;
                }
            }

            // 3. Проверка мощности блока питания
            if (specs.Psu != null)
            {
                var totalTdp = CalculateTotalTdp(specs);
                var recommendedPsu = (int)(totalTdp * 1.5); // 50% запас

                if (specs.Psu.Wattage < recommendedPsu)
                {
                    result.Issues.Add(new CompatibilityIssue
                    {
                        ComponentType = "PSU",
                        Message = "Недостаточная мощность блока питания",
                        Details = $"Рекомендуется минимум {recommendedPsu}Вт, выбрано {specs.Psu.Wattage}Вт"
                    });
                    result.IsCompatible = false;
                }
                else if (specs.Psu.Wattage < recommendedPsu * 1.1)
                {
                    result.Warnings.Add(new CompatibilityWarning
                    {
                        ComponentType = "PSU",
                        Message = "Малый запас мощности БП",
                        Recommendation = $"Рекомендуется БП мощностью от {(int)(totalTdp * 1.6)}Вт для запаса на апгрейд"
                    });
                }
            }

            // 4. Проверка габаритов видеокарты и корпуса
            if (specs.Gpu != null && specs.Case != null)
            {
                if (specs.Gpu.Length > specs.Case.MaxGpuLength)
                {
                    result.Issues.Add(new CompatibilityIssue
                    {
                        ComponentType = "GPU/Case",
                        Message = "Видеокарта не поместится в корпус",
                        Details = $"Длина видеокарты {specs.Gpu.Length}мм превышает максимально допустимую {specs.Case.MaxGpuLength}мм"
                    });
                    result.IsCompatible = false;
                }
            }

            // 5. Проверка форм-фактора материнской платы и корпуса
            if (specs.Motherboard != null && specs.Case != null)
            {
                if (!specs.Case.SupportedMotherboards.Contains(specs.Motherboard.FormFactor, StringComparer.OrdinalIgnoreCase))
                {
                    result.Issues.Add(new CompatibilityIssue
                    {
                        ComponentType = "Motherboard/Case",
                        Message = "Форм-фактор материнской платы не поддерживается корпусом",
                        Details = $"Корпус поддерживает: {string.Join(", ", specs.Case.SupportedMotherboards)}, выбрано: {specs.Motherboard.FormFactor}"
                    });
                    result.IsCompatible = false;
                }
            }

            // 6. Проверка баланса производительности (процессор-видеокарта)
            if (specs.Processor != null && specs.Gpu != null)
            {
                var balanceRatio = (double)specs.Processor.PerformanceScore / specs.Gpu.PerformanceScore;
                if (balanceRatio < 0.5 || balanceRatio > 2.0)
                {
                    result.Warnings.Add(new CompatibilityWarning
                    {
                        ComponentType = "Processor/GPU",
                        Message = "Дисбаланс производительности",
                        Recommendation = balanceRatio < 0.5 
                            ? "Процессор может ограничивать производительность видеокарты. Рассмотрите более мощный процессор."
                            : "Видеокарта может ограничивать производительность процессора. Рассмотрите более мощную видеокарту."
                    });
                }
            }

            // 7. Проверка системы охлаждения
            if (specs.Processor != null && specs.Cooler != null)
            {
                if (specs.Cooler.Tdp < specs.Processor.Tdp)
                {
                    result.Warnings.Add(new CompatibilityWarning
                    {
                        ComponentType = "Cooler",
                        Message = "Кулер может не справиться с охлаждением",
                        Recommendation = $"TDP процессора {specs.Processor.Tdp}Вт, макс. TDP кулера {specs.Cooler.Tdp}Вт"
                    });
                }
                
                if (!specs.Cooler.SupportedSockets.Contains(specs.Processor.Socket, StringComparer.OrdinalIgnoreCase))
                {
                    result.Issues.Add(new CompatibilityIssue
                    {
                        ComponentType = "Cooler/Processor",
                        Message = "Кулер не поддерживает сокет процессора",
                        Details = $"Кулер поддерживает: {string.Join(", ", specs.Cooler.SupportedSockets)}, сокет процессора: {specs.Processor.Socket}"
                    });
                    result.IsCompatible = false;
                }
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при проверке совместимости");
            throw;
        }
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
        // Упрощённый расчёт: TDP процессора + TDP видеокарты + 50Вт (остальное) + 20% запас
        var specs = await GetConfigurationSpecsAsync(config);
        var totalTdp = CalculateTotalTdp(specs);
        return (int)(totalTdp * 1.2);
    }

    private static int CalculateTotalTdp(ConfigurationSpecs specs)
    {
        int total = 0;
        if (specs.Processor != null) total += specs.Processor.Tdp;
        if (specs.Gpu != null) total += specs.Gpu.Tdp;
        total += 50; // Память, накопители, вентиляторы
        return total;
    }

    private async Task<ConfigurationSpecs> GetConfigurationSpecsAsync(PCConfiguration config)
    {
        // В реальности будет запрос к Catalog Service для получения спецификаций
        // Здесь заглушка с примерными данными
        return new ConfigurationSpecs
        {
            Processor = config.ProcessorId.HasValue ? new ProcessorSpecs 
            { 
                ProductId = config.ProcessorId.Value,
                Socket = "AM5",
                Tdp = 65,
                PerformanceScore = 100
            } : null,
            Motherboard = config.MotherboardId.HasValue ? new MotherboardSpecs
            {
                ProductId = config.MotherboardId.Value,
                Socket = "AM5",
                RamType = "DDR5",
                FormFactor = "ATX",
                SupportedMotherboards = new List<string> { "ATX", "mATX" }
            } : null,
            Ram = config.RamId.HasValue ? new RamSpecs
            {
                ProductId = config.RamId.Value,
                Type = "DDR5",
                Speed = 5600,
                Capacity = 32
            } : null,
            Gpu = config.GpuId.HasValue ? new GpuSpecs
            {
                ProductId = config.GpuId.Value,
                Length = 300,
                Tdp = 250,
                PerformanceScore = 150
            } : null,
            Psu = config.PsuId.HasValue ? new PsuSpecs
            {
                ProductId = config.PsuId.Value,
                Wattage = 750
            } : null,
            Case = config.CaseId.HasValue ? new CaseSpecs
            {
                ProductId = config.CaseId.Value,
                MaxGpuLength = 350,
                SupportedMotherboards = new List<string> { "ATX", "mATX", "ITX" }
            } : null,
            Cooler = config.CoolerId.HasValue ? new CoolerSpecs
            {
                ProductId = config.CoolerId.Value,
                Tdp = 150,
                SupportedSockets = new List<string> { "AM5", "LGA1700" }
            } : null
        };
    }
}

/// <summary>
/// Вспомогательный класс для хранения спецификаций конфигурации
/// </summary>
internal class ConfigurationSpecs
{
    public ProcessorSpecs? Processor { get; set; }
    public MotherboardSpecs? Motherboard { get; set; }
    public RamSpecs? Ram { get; set; }
    public GpuSpecs? Gpu { get; set; }
    public PsuSpecs? Psu { get; set; }
    public CaseSpecs? Case { get; set; }
    public CoolerSpecs? Cooler { get; set; }
}