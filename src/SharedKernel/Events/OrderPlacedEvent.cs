namespace SharedKernel.Events;

public record OrderPlacedEvent : IntegrationEvent
{
    public Guid OrderId { get; init; }

    public Guid CustomerId { get; init; }

    public decimal TotalAmount { get; init; }

    public ICollection<OrderItemEventDto> Items { get; init; } = new List<OrderItemEventDto>();
}
