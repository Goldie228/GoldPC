#pragma warning disable CS1591, SA1600
// Copyright (c) GoldPC. All rights reserved.

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// Ответ на валидацию промокода
/// </summary>
public class ValidatePromoCodeResponse
{
    /// <summary>
    /// Получает или задаёт значение, указывающее, действителен ли этот промокод.
    /// </summary>
    public bool Valid { get; set; }

    /// <summary>
    /// Получает или задаёт процент скидки
    /// </summary>
    public int Discount { get; set; }

    /// <summary>
    /// Получает или задаёт сообщение о результате валидации
    /// </summary>
    public string Message { get; set; } = string.Empty;
    
    /// <summary>
    /// Получает или задаёт сумма скидки в валюте
    /// </summary>
    public decimal DiscountAmount { get; set; }
}
#pragma warning restore CS1591, SA1600
