// Copyright (c) GoldPC. All rights reserved.

using System.ComponentModel.DataAnnotations;
using GoldPC.SharedKernel.Enums;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO для обновления статуса заказа.
/// </summary>
public class UpdateOrderStatusRequest
{
    [Required(ErrorMessage = "Статус обязателен")]
    public OrderStatus Status { get; set; }

    [MaxLength(500, ErrorMessage = "Комментарий не должен превышать 500 символов")]
    public string? Comment { get; set; }
}