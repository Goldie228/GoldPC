// Copyright (c) GoldPC. All rights reserved.

using System.ComponentModel.DataAnnotations;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO для создания заказа.
/// </summary>
public class CreateOrderRequest
{
    /// <summary>
    /// Способ получения (Pickup | Delivery).
    /// </summary>
    [Required(ErrorMessage = "Способ получения обязателен")]
    public string DeliveryMethod { get; set; } = string.Empty;

    /// <summary>
    /// Способ оплаты (Online | OnReceipt).
    /// </summary>
    [Required(ErrorMessage = "Способ оплаты обязателен")]
    public string PaymentMethod { get; set; } = string.Empty;

    [MaxLength(500, ErrorMessage = "Адрес не должен превышать 500 символов")]
    public string? Address { get; set; }

    [MaxLength(100, ErrorMessage = "Город не должен превышать 100 символов")]
    public string? City { get; set; }

    [MaxLength(1000, ErrorMessage = "Комментарий не должен превышать 1000 символов")]
    public string? Comment { get; set; }

    /// <summary>
    /// Позиции заказа.
    /// </summary>
    [Required(ErrorMessage = "Заказ должен содержать минимум одну позицию")]
    [MinLength(1, ErrorMessage = "Заказ должен содержать минимум одну позицию")]
    public ICollection<CreateOrderItemRequest> Items { get; } = new List<CreateOrderItemRequest>();
}