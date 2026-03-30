#pragma warning disable CS1591, SA1600
using System.ComponentModel.DataAnnotations;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO для проверки гарантии
/// </summary>
public class WarrantyCheckRequest
{
    [Required(ErrorMessage = "Номер гарантии обязателен")]
    public string WarrantyNumber { get; set; } = string.Empty;
}
#pragma warning restore CS1591, SA1600
