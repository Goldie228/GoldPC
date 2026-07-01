#pragma warning disable CS1591, SA1600
using GoldPC.SharedKernel.Enums;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO собранного ПК на складе.
/// </summary>
public class AssembledUnitDto
{
    public Guid Id { get; set; }

    public Guid ServiceRequestId { get; set; }

    public Guid PCConfigurationId { get; set; }

    public string SerialNumber { get; set; } = string.Empty;

    public AssembledUnitStatus Status { get; set; }

    public DateTime AssembledAt { get; set; }

    public DateTime? DeliveredAt { get; set; }
}
#pragma warning restore CS1591, SA1600
