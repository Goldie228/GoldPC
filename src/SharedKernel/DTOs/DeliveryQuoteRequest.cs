#pragma warning disable CS1591, SA1600
using System.ComponentModel.DataAnnotations;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// Запрос на расчет стоимости доставки.
/// </summary>
public class DeliveryQuoteRequest
{
    [Required]
    public string DeliveryMethod { get; set; } = string.Empty;

    [Required]
    [Range(0, 1_000_000)]
    public decimal Subtotal { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }
}
#pragma warning restore CS1591, SA1600
