#pragma warning disable CS1591, SA1600
using GoldPC.SharedKernel.Enums;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO комплектующей в заявке на сборку ПК.
/// </summary>
public class AssemblyPartDto
{
    public Guid Id { get; set; }

    public Guid ProductId { get; set; }

    public string ProductName { get; set; } = string.Empty;

    public string ComponentType { get; set; } = string.Empty;

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public AssemblyPartStatus PartStatus { get; set; }
}
#pragma warning restore CS1591, SA1600
