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
    /// Имя покупателя
    /// </summary>
    public string CustomerFirstName { get; set; } = string.Empty;
    
    /// <summary>
    /// Фамилия покупателя
    /// </summary>
    public string CustomerLastName { get; set; } = string.Empty;
    
    /// <summary>
    /// Телефон покупателя
    /// </summary>
    public string CustomerPhone { get; set; } = string.Empty;
    
    /// <summary>
    /// Email покупателя
    /// </summary>
    public string CustomerEmail { get; set; } = string.Empty;
    
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
    /// Промокод, использованный при оформлении заказа
    /// </summary>
    public string? PromoCode { get; set; }
    
    /// <summary>
    /// Сумма скидки по промокоду
    /// </summary>
    public decimal DiscountAmount { get; set; }
    
    /// <summary>
    /// Желаемая дата доставки
    /// </summary>
    public string? DeliveryDate { get; set; }
    
    /// <summary>
    /// Временной слот доставки (morning | afternoon | evening | asap)
    /// </summary>
    public string? DeliveryTimeSlot { get; set; }
    
    /// <summary>
    /// Номер отслеживания заказа
    /// </summary>
    public string? TrackingNumber { get; set; }
    
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