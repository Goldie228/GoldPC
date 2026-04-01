#pragma warning disable CS1591, SA1600
// Copyright (c) GoldPC. All rights reserved.

using System.ComponentModel.DataAnnotations;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO для создания заказа.
/// </summary>
public class CreateOrderRequest
{
    /// <summary>
    /// Gets or sets имя покупателя.
    /// </summary>
    [Required(ErrorMessage = "Имя обязательно")]
    [MaxLength(100, ErrorMessage = "Имя не должно превышать 100 символов")]
    public string FirstName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets фамилия покупателя.
    /// </summary>
    [MaxLength(100, ErrorMessage = "Фамилия не должна превышать 100 символов")]
    public string? LastName { get; set; }

    /// <summary>
    /// Gets or sets телефон покупателя.
    /// </summary>
    [Required(ErrorMessage = "Телефон обязателен")]
    [MaxLength(20, ErrorMessage = "Телефон не должен превышать 20 символов")]
    public string Phone { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets email покупателя.
    /// </summary>
    [Required(ErrorMessage = "Email обязателен")]
    [EmailAddress(ErrorMessage = "Неверный формат email")]
    [MaxLength(255, ErrorMessage = "Email не должен превышать 255 символов")]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets способ получения (Pickup | Delivery).
    /// </summary>
    [Required(ErrorMessage = "Способ получения обязателен")]
    public string DeliveryMethod { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets способ оплаты (Online | OnReceipt).
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
    /// Gets or sets промокод.
    /// </summary>
    [MaxLength(50, ErrorMessage = "Промокод не должен превышать 50 символов")]
    public string? PromoCode { get; set; }

    /// <summary>
    /// Gets or sets сумма скидки по промокоду.
    /// </summary>
    public decimal DiscountAmount { get; set; }

    /// <summary>
    /// Gets or sets желаемая дата доставки.
    /// </summary>
    public string? DeliveryDate { get; set; }

    /// <summary>
    /// Gets or sets временной слот доставки (morning | afternoon | evening | asap).
    /// </summary>
    [MaxLength(20, ErrorMessage = "Временной слот не должен превышать 20 символов")]
    public string? DeliveryTimeSlot { get; set; }

    /// <summary>
    /// Gets or sets позиции заказа.
    /// </summary>
    [Required(ErrorMessage = "Заказ должен содержать минимум одну позицию")]
    [MinLength(1, ErrorMessage = "Заказ должен содержать минимум одну позицию")]
    public ICollection<CreateOrderItemRequest> Items { get; set; } = new List<CreateOrderItemRequest>();
}
#pragma warning restore CS1591, SA1600
