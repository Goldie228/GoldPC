#pragma warning disable CS1591, SA1600
// Copyright (c) GoldPC. All rights reserved.

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// Ответ на валидацию промокода
/// </summary>
public class ValidatePromoCodeResponse
{
    /// <summary>
    /// Gets or sets значение, показывающее, валиден ли промокод
    /// </summary>
    public bool Valid { get; set; }

    /// <summary>
    /// Gets or sets процент скидки
    /// </summary>
    public int Discount { get; set; }

    /// <summary>
    /// Gets or sets сообщение о результате валидации
    /// </summary>
    public string Message { get; set; } = string.Empty;
    
    /// <summary>
    /// Gets or sets сумма скидки в валюте
    /// </summary>
    public decimal DiscountAmount { get; set; }
}
#pragma warning restore CS1591, SA1600
