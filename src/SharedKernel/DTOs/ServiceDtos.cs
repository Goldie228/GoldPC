using System.ComponentModel.DataAnnotations;
using GoldPC.SharedKernel.Enums;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO заявки на услугу для обмена между сервисами
/// </summary>
public class ServiceRequestDto
{
    public Guid Id { get; set; }
    public string RequestNumber { get; set; } = string.Empty;
    public Guid ClientId { get; set; }
    public Guid? MasterId { get; set; }
    public Guid ServiceTypeId { get; set; }
    public string ServiceTypeName { get; set; } = string.Empty;
    public ServiceRequestStatus Status { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? DeviceModel { get; set; }
    public string? SerialNumber { get; set; }
    public decimal EstimatedCost { get; set; }
    public decimal ActualCost { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public List<ServiceHistoryDto> History { get; set; } = new();
}

/// <summary>
/// DTO для создания заявки на услугу
/// </summary>
public class CreateServiceRequestRequest
{
    [Required(ErrorMessage = "Тип услуги обязателен")]
    public Guid ServiceTypeId { get; set; }
    
    [Required(ErrorMessage = "Описание проблемы обязательно")]
    [MinLength(10, ErrorMessage = "Описание должно содержать минимум 10 символов")]
    [MaxLength(2000, ErrorMessage = "Описание не должно превышать 2000 символов")]
    public string Description { get; set; } = string.Empty;
    
    [MaxLength(100, ErrorMessage = "Модель устройства не должна превышать 100 символов")]
    public string? DeviceModel { get; set; }
    
    [MaxLength(50, ErrorMessage = "Серийный номер не должен превышать 50 символов")]
    public string? SerialNumber { get; set; }
}

/// <summary>
/// DTO для обновления заявки мастером
/// </summary>
public class UpdateServiceRequestRequest
{
    public ServiceRequestStatus? Status { get; set; }
    
    [MaxLength(2000, ErrorMessage = "Комментарий не должен превышать 2000 символов")]
    public string? MasterComment { get; set; }
    
    public decimal? ActualCost { get; set; }
    
    public List<UsedPartDto>? UsedParts { get; set; }
}

/// <summary>
/// DTO для использованных запчастей
/// </summary>
public class UsedPartDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}

/// <summary>
/// DTO для истории изменений заявки
/// </summary>
public class ServiceHistoryDto
{
    public Guid Id { get; set; }
    public Guid ServiceRequestId { get; set; }
    public ServiceRequestStatus PreviousStatus { get; set; }
    public ServiceRequestStatus NewStatus { get; set; }
    public string? Comment { get; set; }
    public Guid ChangedBy { get; set; }
    public DateTime ChangedAt { get; set; }
}

/// <summary>
/// DTO типа услуги
/// </summary>
public class ServiceTypeDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
    public int EstimatedDurationMinutes { get; set; }
}

/// <summary>
/// DTO для закрытия заявки (выдача оборудования клиенту)
/// </summary>
public class CloseServiceRequestRequest
{
    [MaxLength(500, ErrorMessage = "Комментарий не должен превышать 500 символов")]
    public string? Comment { get; set; }
}
