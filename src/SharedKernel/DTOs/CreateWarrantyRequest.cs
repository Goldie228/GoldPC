using System.ComponentModel.DataAnnotations;
using GoldPC.SharedKernel.Enums;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO для создания гарантийного талона
/// </summary>
public class CreateWarrantyRequest
{
    public Guid? OrderId { get; set; }

    public Guid? ServiceRequestId { get; set; }

    [Required(ErrorMessage = "ID продукта обязателен")]
    public Guid ProductId { get; set; }

    [Required(ErrorMessage = "ID пользователя обязателен")]
    public Guid UserId { get; set; }

    public string ProductName { get; set; } = string.Empty;

    public string? SerialNumber { get; set; }

    public int WarrantyMonths { get; set; } = 12;

    public int? WarrantyDays { get; set; }
}
