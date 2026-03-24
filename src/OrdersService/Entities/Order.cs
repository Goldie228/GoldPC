using GoldPC.SharedKernel.Entities;
using GoldPC.SharedKernel.Enums;

namespace GoldPC.OrdersService.Entities;

/// <summary>
/// Заказ
/// </summary>
public class Order : BaseEntity
{
    /// <summary>
    /// Уникальный номер заказа (например, GP-2024-000001)
    /// </summary>
    public string OrderNumber { get; set; } = string.Empty;
    
    /// <summary>
    /// ID пользователя
    /// </summary>
    public Guid UserId { get; set; }
    
    /// <summary>
    /// Статус заказа
    /// </summary>
    public OrderStatus Status { get; set; } = OrderStatus.New;
    
    /// <summary>
    /// Общая сумма заказа
    /// </summary>
    public decimal Total { get; set; }

    /// <summary>
    /// Стоимость товаров без доставки.
    /// </summary>
    public decimal Subtotal { get; set; }

    /// <summary>
    /// Стоимость доставки.
    /// </summary>
    public decimal DeliveryCost { get; set; }
    
    /// <summary>
    /// Способ получения (Pickup, Delivery)
    /// </summary>
    public string DeliveryMethod { get; set; } = string.Empty;
    
    /// <summary>
    /// Способ оплаты (Online, OnReceipt)
    /// </summary>
    public string PaymentMethod { get; set; } = string.Empty;
    
    /// <summary>
    /// Адрес доставки
    /// </summary>
    public string? Address { get; set; }
    
    /// <summary>
    /// Комментарий к заказу
    /// </summary>
    public string? Comment { get; set; }
    
    /// <summary>
    /// Признак оплаты
    /// </summary>
    public bool IsPaid { get; set; }
    
    /// <summary>
    /// Дата оплаты
    /// </summary>
    public DateTime? PaidAt { get; set; }
    
    /// <summary>
    /// ID платежа (от платёжной системы)
    /// </summary>
    public string? PaymentId { get; set; }
    
    /// <summary>
    /// Позиции заказа
    /// </summary>
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    
    /// <summary>
    /// История изменений статусов
    /// </summary>
    public ICollection<OrderHistory> History { get; set; } = new List<OrderHistory>();
}