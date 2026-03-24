// Copyright (c) GoldPC. All rights reserved.

using GoldPC.SharedKernel.Enums;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO для отчета о работе (бывшая история изменений).
/// </summary>
public class WorkReportDto
{
    public Guid Id { get; set; }

    public Guid ServiceRequestId { get; set; }

    public ServiceRequestStatus PreviousStatus { get; set; }

    public ServiceRequestStatus NewStatus { get; set; }

    public string? Comment { get; set; }

    public Guid ChangedBy { get; set; }

    public DateTime ChangedAt { get; set; }
}