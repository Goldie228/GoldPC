using GoldPC.SharedKernel.Enums;

namespace GoldPC.WarrantyService.Entities;

/// <summary>
/// История операций по гарантийному талону
/// </summary>
public class WarrantyCardOperation
{
    public Guid Id { get; set; }
    
    public Guid WarrantyCardId { get; set; }
    
    /// <summary>
    /// Тип операции (Created, Repair, Replacement, Annulled, Expired)
    /// </summary>
    public string OperationType { get; set; } = string.Empty;
    
    /// <summary>
    /// Описание операции
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// ID связанной заявки на сервис (если есть)
    /// </summary>
    public Guid? RelatedServiceRequestId { get; set; }
    
    /// <summary>
    /// Время выполнения операции
    /// </summary>
    public DateTime PerformedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Кто выполнил операцию
    /// </summary>
    public Guid PerformedBy { get; set; }
    
    // Navigation property
    public virtual WarrantyCard WarrantyCard { get; set; } = null!;
}
