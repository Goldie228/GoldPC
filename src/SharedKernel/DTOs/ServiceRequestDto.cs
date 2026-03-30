#pragma warning disable CA2227, CS1591, SA1600
// Copyright (c) GoldPC. All rights reserved.

using GoldPC.SharedKernel.Enums;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO заявки на услугу для обмена между сервисами.
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

    public ICollection<ServicePartDto> ServiceParts { get; set; } = new List<ServicePartDto>();

    public ICollection<WorkReportDto> WorkReports { get; set; } = new List<WorkReportDto>();
}
#pragma warning restore CA2227, CS1591, SA1600
