#pragma warning disable CS1591, SA1600
// Copyright (c) GoldPC. All rights reserved.

using System.ComponentModel.DataAnnotations;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO для добавления позиции заказа.
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
#pragma warning restore CS1591, SA1600
