namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO для операций по гарантии
/// </summary>
public class WarrantyOperationDto
{
    public Guid Id { get; set; }

    public Guid WarrantyId { get; set; }

    public string OperationType { get; set; } = string.Empty; // Created, Repair, Replacement, Annulled

    public string? Description { get; set; }

    public Guid? RelatedServiceRequestId { get; set; }

    public DateTime PerformedAt { get; set; }

    public Guid PerformedBy { get; set; }
}
