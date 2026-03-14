using System.ComponentModel.DataAnnotations;
using GoldPC.SharedKernel.Enums;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO гарантийного талона для обмена между сервисами
/// </summary>
public class WarrantyDto
{
    public Guid Id { get; set; }
    public string WarrantyNumber { get; set; } = string.Empty;
    public Guid? OrderId { get; set; }
    public Guid? ServiceRequestId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public int WarrantyMonths { get; set; }
    public WarrantyStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<WarrantyOperationDto> Operations { get; set; } = new();
}

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
    
    [Range(1, 60, ErrorMessage = "Срок гарантии должен быть от 1 до 60 месяцев")]
    public int WarrantyMonths { get; set; } = 12;
}

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

/// <summary>
/// DTO для операций по гарантии
/// </summary>
public class WarrantyOperationDto
{
    public Guid Id { get; set; }
    public Guid WarrantyId { get; set; }
    public string OperationType { get; set; } = string.Empty; // Created, Repair, Replacement, Annulled
    public string? Description { get; set; }
    public Guid? RelatedServiceRequestId { get; set; }
    public DateTime PerformedAt { get; set; }
    public Guid PerformedBy { get; set; }
}

/// <summary>
/// DTO для проверки гарантии
/// </summary>
public class WarrantyCheckRequest
{
    [Required(ErrorMessage = "Номер гарантии обязателен")]
    public string WarrantyNumber { get; set; } = string.Empty;
}

/// <summary>
/// DTO результата проверки гарантии
/// </summary>
public class WarrantyCheckResult
{
    public bool IsValid { get; set; }
    public WarrantyDto? Warranty { get; set; }
    public string? Message { get; set; }
    public int? DaysRemaining { get; set; }
}