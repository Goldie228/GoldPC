using GoldPC.SharedKernel.Enums;

namespace GoldPC.OrdersService.Entities;

/// <summary>
/// История изменений статусов заказа
/// </summary>
public class OrderHistory
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// ID заказа
    /// </summary>
    public Guid OrderId { get; set; }
    
    /// <summary>
    /// Предыдущий статус
    /// </summary>
    public OrderStatus PreviousStatus { get; set; }
    
    /// <summary>
    /// Новый статус
    /// </summary>
    public OrderStatus NewStatus { get; set; }
    
    /// <summary>
    /// Комментарий к изменению
    /// </summary>
    public string? Comment { get; set; }
    
    /// <summary>
    /// ID пользователя, изменившего статус
    /// </summary>
    public Guid ChangedBy { get; set; }
    
    /// <summary>
    /// Дата и время изменения
    /// </summary>
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Навигационное свойство к заказу
    /// </summary>
    public Order Order { get; set; } = null!;
}