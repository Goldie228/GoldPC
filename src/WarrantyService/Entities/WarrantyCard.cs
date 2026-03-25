using GoldPC.SharedKernel.Enums;

namespace GoldPC.WarrantyService.Entities;

/// <summary>
/// Гарантийный талон на товар или услугу
/// </summary>
public class WarrantyCard
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// Номер гарантийного талона (например, W-2026-000001)
    /// </summary>
    public string WarrantyNumber { get; set; } = string.Empty;
    
    /// <summary>
    /// ID заказа (для товаров)
    /// </summary>
    public Guid? OrderId { get; set; }
    
    /// <summary>
    /// ID заявки на сервис (для услуг)
    /// </summary>
    public Guid? ServiceRequestId { get; set; }
    
    /// <summary>
    /// ID товара
    /// </summary>
    public Guid ProductId { get; set; }
    
    /// <summary>
    /// Название товара или услуги
    /// </summary>
    public string ProductName { get; set; } = string.Empty;
    
    /// <summary>
    /// Серийный номер устройства (если применимо)
    /// </summary>
    public string? SerialNumber { get; set; }
    
    /// <summary>
    /// ID пользователя
    /// </summary>
    public Guid UserId { get; set; }
    
    /// <summary>
    /// Дата начала гарантии (UTC)
    /// </summary>
    public DateTime StartDate { get; set; }
    
    /// <summary>
    /// Дата окончания гарантии (UTC)
    /// </summary>
    public DateTime EndDate { get; set; }
    
    /// <summary>
    /// Срок гарантии в месяцах
    /// </summary>
    public int WarrantyMonths { get; set; }
    
    /// <summary>
    /// Текущий статус гарантии
    /// </summary>
    public WarrantyStatus Status { get; set; }
    
    /// <summary>
    /// Причина аннулирования (если статус Annulled)
    /// </summary>
    public string? CancellationReason { get; set; }
    
    /// <summary>
    /// Дата создания записи
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Дата последнего обновления
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}
