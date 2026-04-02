namespace PCBuilderService.DTOs;

/// <summary>
/// DTO для конфигурации ПК (соответствует OpenAPI PCConfiguration)
/// </summary>
public class PCConfigurationDto
{
    /// <summary>Уникальный идентификатор</summary>
    public Guid? Id { get; set; }

    /// <summary>Название конфигурации</summary>
    public string? Name { get; set; }

    /// <summary>Назначение ПК (gaming, office, workstation)</summary>
    public string? Purpose { get; set; }

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

    /// <summary>Итоговая стоимость конфигурации</summary>
    public decimal? TotalPrice { get; set; }

    /// <summary>Совместимы ли все компоненты</summary>
    public bool? IsCompatible { get; set; }

    /// <summary>Токен для публичного доступа</summary>
    public string? ShareToken { get; set; }

    /// <summary>Дата создания</summary>
    public DateTime? CreatedAt { get; set; }
    
    /// <summary>Промокод</summary>
    public string? PromoCode { get; set; }
    
    /// <summary>Сумма скидки</summary>
    public decimal? DiscountAmount { get; set; }
    
    /// <summary>Цена без скидок</summary>
    public decimal? BasePrice { get; set; }
    
    /// <summary>Детали цен компонентов</summary>
    public List<ComponentPriceDto>? ComponentPrices { get; set; }
    
    /// <summary>Недоступные компоненты (нет в наличии)</summary>
    public List<string>? UnavailableComponents { get; set; }
}

/// <summary>
/// DTO цены отдельного компонента
/// </summary>
public class ComponentPriceDto
{
    public Guid ProductId { get; set; }
    public string ComponentType { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal? OldPrice { get; set; }
    public bool InStock { get; set; }
    public int StockQuantity { get; set; }
}

/// <summary>
/// Запрос расчёта цены с промокодом
/// </summary>
public class CalculatePriceRequest
{
    public PCConfigurationDto Configuration { get; set; } = null!;
    public string? PromoCode { get; set; }
}

/// <summary>
/// Ответ с расчётом цены
/// </summary>
public class ConfigurationPriceResult
{
    /// <summary>Общая стоимость (с учётом скидок)</summary>
    public decimal TotalPrice { get; set; }

    /// <summary>Базовая стоимость (без скидок)</summary>
    public decimal BasePrice { get; set; }
    
    /// <summary>Сумма скидок по акциям</summary>
    public decimal SaleDiscount { get; set; }
    
    /// <summary>Сумма скидки по промокоду</summary>
    public decimal PromoDiscount { get; set; }
    
    /// <summary>Применённый промокод</summary>
    public string? AppliedPromoCode { get; set; }
    
    /// <summary>Стоимости по компонентам</summary>
    public List<ComponentPriceDto> Components { get; set; } = new();
    
    /// <summary>Недоступные компоненты</summary>
    public List<string> UnavailableComponents { get; set; } = new();
    
    /// <summary>Все ли компоненты в наличии</summary>
    public bool AllComponentsAvailable { get; set; }
}

/// <summary>
/// Ответ с токеном для публичного доступа
/// </summary>
public class ShareTokenResponse
{
    /// <summary>Токен публичного доступа</summary>
    public required string ShareToken { get; set; }

    /// <summary>URL для публичного доступа</summary>
    public required string ShareUrl { get; set; }
}

/// <summary>
/// Результат расчёта энергопотребления
/// </summary>
public class PowerConsumptionResult
{
    /// <summary>Общее энергопотребление (Вт)</summary>
    public int TotalPowerConsumption { get; set; }

    /// <summary>Рекомендуемая мощность БП (Вт)</summary>
    public int RecommendedPsuWattage { get; set; }

    /// <summary>Минимальная мощность БП (Вт)</summary>
    public int MinPsuWattage { get; set; }
}

/// <summary>
/// Стоимость отдельного компонента
/// </summary>
public class ComponentPrice
{
    /// <summary>ID продукта</summary>
    public Guid ProductId { get; set; }

    /// <summary>Тип компонента</summary>
    public string ComponentType { get; set; } = string.Empty;

    /// <summary>Название продукта</summary>
    public string ProductName { get; set; } = string.Empty;

    /// <summary>Цена</summary>
    public decimal Price { get; set; }
}
