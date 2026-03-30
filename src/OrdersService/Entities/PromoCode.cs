using GoldPC.SharedKernel.Entities;

namespace GoldPC.OrdersService.Entities;

/// <summary>
/// Промокод для скидки на заказ
/// </summary>
public class PromoCode : BaseEntity
{
    /// <summary>
    /// Код промокода (например, "GOLDPC10")
    /// </summary>
    public string Code { get; set; } = string.Empty;
    
    /// <summary>
    /// Процент скидки (например, 10 для 10%)
    /// </summary>
    public int DiscountPercent { get; set; }
    
    /// <summary>
    /// Минимальная сумма заказа для применения промокода
    /// </summary>
    public decimal? MinOrderAmount { get; set; }
    
    /// <summary>
    /// Дата начала действия промокода
    /// </summary>
    public DateTime? ValidFrom { get; set; }
    
    /// <summary>
    /// Дата окончания действия промокода
    /// </summary>
    public DateTime? ValidTo { get; set; }
    
    /// <summary>
    /// Максимальное количество использований (null = без ограничений)
    /// </summary>
    public int? MaxUses { get; set; }
    
    /// <summary>
    /// Количество использований промокода
    /// </summary>
    public int UsedCount { get; set; }
    
    /// <summary>
    /// Активен ли промокод
    /// </summary>
    public bool IsActive { get; set; } = true;
    
    /// <summary>
    /// Описание промокода
    /// </summary>
    public string? Description { get; set; }
}
