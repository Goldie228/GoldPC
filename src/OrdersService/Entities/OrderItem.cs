namespace GoldPC.OrdersService.Entities;

/// <summary>
/// Позиция заказа
/// </summary>
public class OrderItem
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// ID заказа
    /// </summary>
    public Guid OrderId { get; set; }
    
    /// <summary>
    /// ID товара
    /// </summary>
    public Guid ProductId { get; set; }
    
    /// <summary>
    /// Название товара (на момент заказа)
    /// </summary>
    public string ProductName { get; set; } = string.Empty;
    
    /// <summary>
    /// Количество
    /// </summary>
    public int Quantity { get; set; }
    
    /// <summary>
    /// Цена за единицу (на момент заказа)
    /// </summary>
    public decimal UnitPrice { get; set; }
    
    /// <summary>
    /// Общая сумма позиции
    /// </summary>
    public decimal TotalPrice => UnitPrice * Quantity;
    
    /// <summary>
    /// Навигационное свойство к заказу
    /// </summary>
    public Order Order { get; set; } = null!;
}