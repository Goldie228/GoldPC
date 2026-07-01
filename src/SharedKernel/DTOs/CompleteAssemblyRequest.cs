#pragma warning disable CS1591, SA1600
using System.ComponentModel.DataAnnotations;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO для завершения сборки ПК.
/// </summary>
public class CompleteAssemblyRequest
{
    [Required(ErrorMessage = "Серийный номер обязателен")]
    [MaxLength(100, ErrorMessage = "Серийный номер не должен превышать 100 символов")]
    public string SerialNumber { get; set; } = string.Empty;
}
#pragma warning restore CS1591, SA1600
