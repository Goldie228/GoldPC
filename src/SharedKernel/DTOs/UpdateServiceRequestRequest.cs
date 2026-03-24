// Copyright (c) GoldPC. All rights reserved.

using System.ComponentModel.DataAnnotations;
using GoldPC.SharedKernel.Enums;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO для обновления заявки мастером.
/// </summary>
public class UpdateServiceRequestRequest
{
    public ServiceRequestStatus? Status { get; set; }

    [MaxLength(2000, ErrorMessage = "Комментарий не должен превышать 2000 символов")]
    public string? MasterComment { get; set; }

    public decimal? ActualCost { get; set; }

    public ICollection<ServicePartDto>? ServiceParts { get; set; }
}