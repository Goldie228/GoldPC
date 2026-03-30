#pragma warning disable CS1591, SA1600
namespace SharedKernel.Events;

public record OrderPlacedEvent : IntegrationEvent
{
    public Guid OrderId { get; init; }

    public Guid CustomerId { get; init; }

    public decimal TotalAmount { get; init; }

    public ICollection<OrderItemEventDto> Items { get; init; } = new List<OrderItemEventDto>();
}
#pragma warning restore CS1591, SA1600
