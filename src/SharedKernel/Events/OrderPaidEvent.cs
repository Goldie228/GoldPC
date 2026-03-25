namespace SharedKernel.Events;

public record OrderPaidEvent : IntegrationEvent
{
    public Guid OrderId { get; init; }
    public decimal AmountPaid { get; init; }
    public List<OrderItemEventDto> Items { get; init; } = new();
}
