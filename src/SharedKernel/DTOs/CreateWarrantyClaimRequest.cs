#pragma warning disable CS1591, SA1600
namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// Запрос на создание гарантийной заявки
/// </summary>
public class CreateWarrantyClaimRequest
{
    public Guid OrderId { get; set; }

    public Guid ProductId { get; set; }

    public string ProductName { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public DateTime PurchaseDate { get; set; }

    public int WarrantyPeriodMonths { get; set; } = 12;
}
#pragma warning restore CS1591, SA1600
