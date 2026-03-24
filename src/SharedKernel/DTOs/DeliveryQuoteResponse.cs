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
