#pragma warning disable CA2227, CS1591, SA1600
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

    public ICollection<WarrantyOperationDto> Operations { get; set; } = new List<WarrantyOperationDto>();
}
#pragma warning restore CA2227, CS1591, SA1600
