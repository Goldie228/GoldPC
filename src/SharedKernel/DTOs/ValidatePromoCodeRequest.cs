#pragma warning disable CS1591, SA1600
// Copyright (c) GoldPC. All rights reserved.

using System.ComponentModel.DataAnnotations;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// Запрос на валидацию промокода
/// </summary>
public class ValidatePromoCodeRequest
{
    /// <summary>
    /// Gets or sets код промокода
    /// </summary>
    [Required(ErrorMessage = "Код промокода обязателен")]
    [MaxLength(50, ErrorMessage = "Код промокода не должен превышать 50 символов")]
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets сумма заказа для проверки минимального порога
    /// </summary>
    [Range(0.01, double.MaxValue, ErrorMessage = "Сумма заказа должна быть больше нуля")]
    public decimal OrderAmount { get; set; }
}
#pragma warning restore CS1591, SA1600
