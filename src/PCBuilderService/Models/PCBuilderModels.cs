namespace PCBuilderService.Models;

/// <summary>
/// Конфигурация ПК
/// </summary>
public class PCConfiguration
{
    public Guid Id { get; set; }
    
    /// <summary>Название конфигурации</summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>ID пользователя</summary>
    public Guid UserId { get; set; }
    
    /// <summary>Назначение ПК (gaming, office, workstation)</summary>
    public string Purpose { get; set; } = "gaming";
    
    /// <summary>ID выбранного процессора</summary>
    public Guid? ProcessorId { get; set; }
    
    /// <summary>ID выбранной материнской платы</summary>
    public Guid? MotherboardId { get; set; }
    
    /// <summary>ID выбранной оперативной памяти</summary>
    public Guid? RamId { get; set; }
    
    /// <summary>ID выбранной видеокарты</summary>
    public Guid? GpuId { get; set; }
    
    /// <summary>ID выбранного блока питания</summary>
    public Guid? PsuId { get; set; }
    
    /// <summary>ID выбранного накопителя</summary>
    public Guid? StorageId { get; set; }
    
    /// <summary>ID выбранного корпуса</summary>
    public Guid? CaseId { get; set; }
    
    /// <summary>ID выбранной системы охлаждения</summary>
    public Guid? CoolerId { get; set; }
    
    /// <summary>Итоговая стоимость</summary>
    public decimal TotalPrice { get; set; }
    
    /// <summary>Признак совместимости</summary>
    public bool IsCompatible { get; set; }
    
    /// <summary>Дата создания</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>Дата обновления</summary>
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// Результат проверки совместимости
/// </summary>
public class CompatibilityResult
{
    public bool IsCompatible { get; set; }
    public List<CompatibilityIssue> Issues { get; set; } = new();
    public List<CompatibilityWarning> Warnings { get; set; } = new();
}

/// <summary>
/// Проблема совместимости (критическая)
/// </summary>
public class CompatibilityIssue
{
    public string ComponentType { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
}

/// <summary>
/// Предупреждение о совместимости (некритическое)
/// </summary>
public class CompatibilityWarning
{
    public string ComponentType { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Recommendation { get; set; } = string.Empty;
}

/// <summary>
/// Характеристики процессора для проверки совместимости
/// </summary>
public class ProcessorSpecs
{
    public Guid ProductId { get; set; }
    public string Socket { get; set; } = string.Empty;           // AM5, LGA1700
    public int Tdp { get; set; }                                // Вт
    public string IntegratedGraphics { get; set; } = "";        // Название iGPU или пусто
    public int PerformanceScore { get; set; }                   // Оценка производительности
}

/// <summary>
/// Характеристики материнской платы
/// </summary>
public class MotherboardSpecs
{
    public Guid ProductId { get; set; }
    public string Socket { get; set; } = string.Empty;          // Совместимость с процессором
    public string RamType { get; set; } = string.Empty;         // DDR4, DDR5
    public int RamSlots { get; set; }                           // Количество слотов
    public int MaxRamSpeed { get; set; }                        // Макс. частота памяти
    public string FormFactor { get; set; } = string.Empty;      // ATX, mATX, ITX
    public int MaxGpuLength { get; set; }                       // Макс. длина видеокарты (мм)
}

/// <summary>
/// Характеристики оперативной памяти
/// </summary>
public class RamSpecs
{
    public Guid ProductId { get; set; }
    public string Type { get; set; } = string.Empty;            // DDR4, DDR5
    public int Speed { get; set; }                              // Частота (МГц)
    public int Capacity { get; set; }                           // Объём (ГБ)
    public int Modules { get; set; }                            // Количество модулей
}

/// <summary>
/// Характеристики видеокарты
/// </summary>
public class GpuSpecs
{
    public Guid ProductId { get; set; }
    public int Length { get; set; }                             // Длина (мм)
    public int Tdp { get; set; }                                // Энергопотребление (Вт)
    public int RecommendedPsu { get; set; }                     // Рекомендуемая мощность БП (Вт)
    public int PerformanceScore { get; set; }                   // Оценка производительности
}

/// <summary>
/// Характеристики блока питания
/// </summary>
public class PsuSpecs
{
    public Guid ProductId { get; set; }
    public int Wattage { get; set; }                            // Мощность (Вт)
    public string Certification { get; set; } = string.Empty;   // 80+ Bronze, Gold, Platinum
    public bool Modular { get; set; }                           // Модульный
}

/// <summary>
/// Характеристики корпуса
/// </summary>
public class CaseSpecs
{
    public Guid ProductId { get; set; }
    public string FormFactor { get; set; } = string.Empty;      // ATX, mATX, ITX
    public int MaxGpuLength { get; set; }                       // Макс. длина видеокарты (мм)
    public int MaxCoolerHeight { get; set; }                    // Макс. высота кулера (мм)
    public List<string> SupportedMotherboards { get; set; } = new(); // Поддерживаемые форм-факторы
}

/// <summary>
/// Характеристики системы охлаждения
/// </summary>
public class CoolerSpecs
{
    public Guid ProductId { get; set; }
    public string Type { get; set; } = string.Empty;            // Air, AIO
    public int Height { get; set; }                             // Высота (мм) для воздухянного
    public int Tdp { get; set; }                                // Макс. TDP охлаждения
    public List<string> SupportedSockets { get; set; } = new(); // Поддерживаемые сокеты
}

/// <summary>
/// Характеристики накопителя
/// </summary>
public class StorageSpecs
{
    public Guid ProductId { get; set; }
    public string Type { get; set; } = string.Empty;            // SSD, HDD, NVMe
    public int Capacity { get; set; }                           // Объём (ГБ)
    public string Interface { get; set; } = string.Empty;       // SATA, NVMe
}