using System.ComponentModel.DataAnnotations;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO для аннулирования гарантии
/// </summary>
public class AnnulWarrantyRequest
{
    [Required(ErrorMessage = "Причина аннулирования обязательна")]
    [MinLength(10, ErrorMessage = "Причина должна содержать минимум 10 символов")]
    [MaxLength(500, ErrorMessage = "Причина не должна превышать 500 символов")]
    public string Reason { get; set; } = string.Empty;
}
