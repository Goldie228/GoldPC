// Copyright (c) GoldPC. All rights reserved.

using GoldPC.SharedKernel.Enums;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO для истории изменений заявки.
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