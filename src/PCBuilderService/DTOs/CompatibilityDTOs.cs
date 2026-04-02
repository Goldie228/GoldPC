namespace PCBuilderService.DTOs;

/// <summary>
/// DTO для запроса проверки совместимости (соответствует OpenAPI CompatibilityCheckRequest)
/// </summary>
public class CompatibilityCheckRequest
{
    /// <summary>Компоненты конфигурации</summary>
    public required PCComponentsDto Components { get; set; }
    
    /// <summary>Назначение ПК (опционально)</summary>
    public string? Purpose { get; set; }
}

/// <summary>
/// DTO для ответа проверки совместимости (соответствует OpenAPI CompatibilityCheckResponse)
/// </summary>
public class CompatibilityCheckResponse
{
    /// <summary>Результат проверки совместимости</summary>
    public required CompatibilityResultDto Result { get; set; }
    
    /// <summary>Общее потребление мощности (Вт)</summary>
    public int PowerConsumption { get; set; }
    
    /// <summary>Рекомендуемая мощность БП (Вт)</summary>
    public int RecommendedPsu { get; set; }
    
    /// <summary>Процент bottleneck (0-100). Положительное = CPU bottleneck, отрицательное = GPU bottleneck</summary>
    public double BottleneckPercentage { get; set; }
    
    /// <summary>Оценки FPS для различных сценариев (разрешение+качество -> FPS)</summary>
    public Dictionary<string, FpsEstimateDto> FpsEstimates { get; set; } = new();
}

/// <summary>
/// Оценка FPS для конкретного сценария
/// </summary>
public class FpsEstimateDto
{
    /// <summary>Средний FPS</summary>
    public int AverageFps { get; set; }
    
    /// <summary>Минимальный FPS (1% low)</summary>
    public int MinFps { get; set; }
    
    /// <summary>Качество игрового опыта (Excellent, Good, Fair, Poor)</summary>
    public string Quality { get; set; } = "";
}

/// <summary>
/// Результат проверки совместимости
/// </summary>
public class CompatibilityResultDto
{
    /// <summary>Совместимы ли все компоненты</summary>
    public required bool IsCompatible { get; set; }
    
    /// <summary>Проблемы совместимости</summary>
    public List<CompatibilityIssueDto> Issues { get; set; } = new();
    
    /// <summary>Предупреждения</summary>
    public List<CompatibilityWarningDto> Warnings { get; set; } = new();
}

/// <summary>
/// Проблема совместимости
/// </summary>
public class CompatibilityIssueDto
{
    /// <summary>Критичность (Error, Warning, Info)</summary>
    public required string Severity { get; set; }
    
    /// <summary>Первый компонент</summary>
    public required string Component1 { get; set; }
    
    /// <summary>Второй компонент (опционально)</summary>
    public string? Component2 { get; set; }
    
    /// <summary>Описание проблемы</summary>
    public required string Message { get; set; }
    
    /// <summary>Рекомендация по исправлению</summary>
    public string? Suggestion { get; set; }
}

/// <summary>
/// Предупреждение о совместимости
/// </summary>
public class CompatibilityWarningDto
{
    /// <summary>Критичность (Warning, Info)</summary>
    public required string Severity { get; set; }
    
    /// <summary>Компонент</summary>
    public required string Component { get; set; }
    
    /// <summary>Предупреждение</summary>
    public required string Message { get; set; }
    
    /// <summary>Рекомендация</summary>
    public string? Suggestion { get; set; }
}

/// <summary>
/// DTO для компонентов ПК (соответствует OpenAPI PCComponents)
/// </summary>
public class PCComponentsDto
{
    /// <summary>Процессор</summary>
    public SelectedComponentDto? Cpu { get; set; }
    
    /// <summary>Материнская плата</summary>
    public SelectedComponentDto? Motherboard { get; set; }
    
    /// <summary>Видеокарта</summary>
    public SelectedComponentDto? Gpu { get; set; }
    
    /// <summary>Оперативная память</summary>
    public SelectedComponentDto? Ram { get; set; }
    
    /// <summary>Блок питания</summary>
    public SelectedComponentDto? Psu { get; set; }
    
    /// <summary>Накопители (может быть несколько)</summary>
    public List<SelectedComponentDto>? Storage { get; set; }
    
    /// <summary>Корпус</summary>
    public SelectedComponentDto? Case { get; set; }
    
    /// <summary>Система охлаждения</summary>
    public SelectedComponentDto? Cooling { get; set; }
    
    /// <summary>Мониторы (может быть несколько)</summary>
    public List<SelectedComponentDto>? Monitor { get; set; }
    
    /// <summary>Периферия</summary>
    public List<SelectedComponentDto>? Periphery { get; set; }
}

/// <summary>
/// DTO для выбранного компонента (соответствует OpenAPI SelectedComponent)
/// </summary>
public class SelectedComponentDto
{
    /// <summary>ID продукта</summary>
    public required Guid ProductId { get; set; }
    
    /// <summary>Название компонента</summary>
    public required string Name { get; set; }
    
    /// <summary>Артикул</summary>
    public string? Sku { get; set; }
    
    /// <summary>Категория</summary>
    public string? Category { get; set; }
    
    /// <summary>Цена</summary>
    public decimal Price { get; set; }
    
    /// <summary>Количество</summary>
    public int Quantity { get; set; } = 1;
    
    /// <summary>Спецификации компонента (динамический набор)</summary>
    public Dictionary<string, object>? Specifications { get; set; }
    
    /// <summary>Доступен ли в наличии</summary>
    public bool? IsAvailable { get; set; }
    
    /// <summary>URL изображения</summary>
    public string? Image { get; set; }
}
