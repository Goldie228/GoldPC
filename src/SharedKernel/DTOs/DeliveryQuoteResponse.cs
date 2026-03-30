#pragma warning disable CS1591, SA1600
namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// Ответ с рассчитанной стоимостью доставки.
/// </summary>
public class DeliveryQuoteResponse
{
    public decimal Subtotal { get; set; }

    public decimal DeliveryCost { get; set; }

    public decimal Total { get; set; }
}
#pragma warning restore CS1591, SA1600
