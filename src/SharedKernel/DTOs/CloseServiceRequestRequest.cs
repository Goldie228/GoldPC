#pragma warning disable CS1591, SA1600
// Copyright (c) GoldPC. All rights reserved.

using System.ComponentModel.DataAnnotations;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO для закрытия заявки (выдача оборудования клиенту).
/// </summary>
public class CloseServiceRequestRequest
{
    [MaxLength(500, ErrorMessage = "Комментарий не должен превышать 500 символов")]
    public string? Comment { get; set; }
}
#pragma warning restore CS1591, SA1600
