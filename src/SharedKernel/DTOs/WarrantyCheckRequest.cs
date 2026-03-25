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
