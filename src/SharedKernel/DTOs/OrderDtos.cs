using System.ComponentModel.DataAnnotations;
using GoldPC.SharedKernel.Enums;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO заказа для обмена между сервисами
/// </summary>
public class OrderDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public OrderStatus Status { get; set; }
    public decimal Total { get; set; }
    public string DeliveryMethod { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public string? Address { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
}

/// <summary>
/// DTO позиции заказа
/// </summary>
public class OrderItemDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
}

/// <summary>
/// DTO для создания заказа
/// </summary>
public class CreateOrderRequest
{
    [Required(ErrorMessage = "Способ получения обязателен")]
    public string DeliveryMethod { get; set; } = string.Empty; // Pickup | Delivery
    
    [Required(ErrorMessage = "Способ оплаты обязателен")]
    public string PaymentMethod { get; set; } = string.Empty; // Online | OnReceipt
    
    [MaxLength(500, ErrorMessage = "Адрес не должен превышать 500 символов")]
    public string? Address { get; set; }
    
    [MaxLength(1000, ErrorMessage = "Комментарий не должен превышать 1000 символов")]
    public string? Comment { get; set; }
    
    /// <summary>
    /// Позиции заказа
    /// </summary>
    [Required(ErrorMessage = "Заказ должен содержать минимум одну позицию")]
    [MinLength(1, ErrorMessage = "Заказ должен содержать минимум одну позицию")]
    public List<CreateOrderItemRequest> Items { get; set; } = new();
}

/// <summary>
/// DTO для добавления позиции заказа
/// </summary>
public class CreateOrderItemRequest
{
    [Required(ErrorMessage = "ID товара обязателен")]
    public Guid ProductId { get; set; }
    
    [Required(ErrorMessage = "Название товара обязательно")]
    [MaxLength(255, ErrorMessage = "Название товара не должно превышать 255 символов")]
    public string ProductName { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Количество обязательно")]
    [Range(1, 5, ErrorMessage = "Количество должно быть от 1 до 5 (ФТ-3.11)")]
    public int Quantity { get; set; }
    
    [Required(ErrorMessage = "Цена обязательна")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Цена должна быть больше 0")]
    public decimal UnitPrice { get; set; }
}

/// <summary>
/// DTO для обновления статуса заказа
/// </summary>
public class UpdateOrderStatusRequest
{
    [Required(ErrorMessage = "Статус обязателен")]
    public OrderStatus Status { get; set; }
    
    [MaxLength(500, ErrorMessage = "Комментарий не должен превышать 500 символов")]
    public string? Comment { get; set; }
}

/// <summary>
/// DTO для истории изменений заказа
/// </summary>
public class OrderHistoryDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public OrderStatus PreviousStatus { get; set; }
    public OrderStatus NewStatus { get; set; }
    public string? Comment { get; set; }
    public Guid ChangedBy { get; set; }
    public DateTime ChangedAt { get; set; }
}