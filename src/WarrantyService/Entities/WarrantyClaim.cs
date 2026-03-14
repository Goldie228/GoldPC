using GoldPC.SharedKernel.Entities;
using GoldPC.SharedKernel.Enums;

namespace GoldPC.WarrantyService.Entities;

public class WarrantyClaim : BaseEntity
{
    public string ClaimNumber { get; set; } = string.Empty;
    public Guid OrderId { get; set; }
    public Guid UserId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public WarrantyStatus Status { get; set; } = WarrantyStatus.New;
    public string Description { get; set; } = string.Empty;
    public string? MasterComment { get; set; }
    public DateTime PurchaseDate { get; set; }
    public int WarrantyPeriodMonths { get; set; }
    public DateTime WarrantyEndDate { get; set; }
    public Guid? AssignedTo { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string? Resolution { get; set; }
    public ICollection<WarrantyHistory> History { get; set; } = new List<WarrantyHistory>();
}

public class WarrantyHistory
{
    public Guid Id { get; set; }
    public Guid WarrantyClaimId { get; set; }
    public WarrantyStatus PreviousStatus { get; set; }
    public WarrantyStatus NewStatus { get; set; }
    public string? Comment { get; set; }
    public Guid ChangedBy { get; set; }
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    public WarrantyClaim WarrantyClaim { get; set; } = null!;
}