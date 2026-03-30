#pragma warning disable CS1591, SA1600
using GoldPC.SharedKernel.Enums;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO гарантийной заявки
/// </summary>
public class WarrantyClaimDto
{
    public Guid Id { get; set; }

    public string ClaimNumber { get; set; } = string.Empty;

    public Guid OrderId { get; set; }

    public Guid UserId { get; set; }

    public Guid ProductId { get; set; }

    public string ProductName { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public DateTime PurchaseDate { get; set; }

    public DateTime WarrantyEndDate { get; set; }

    public WarrantyStatus Status { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? ResolvedAt { get; set; }

    public string? Resolution { get; set; }
}
#pragma warning restore CS1591, SA1600
