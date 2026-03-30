#pragma warning disable CS1591, SA1600
// Copyright (c) GoldPC. All rights reserved.

using System.ComponentModel.DataAnnotations;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO для создания заявки на услугу.
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
#pragma warning restore CS1591, SA1600
