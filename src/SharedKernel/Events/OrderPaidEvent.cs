#pragma warning disable CA1002, CS1591, SA1600
namespace SharedKernel.Events;

public record OrderPaidEvent : IntegrationEvent
{
    public Guid OrderId { get; init; }

    public decimal AmountPaid { get; init; }

    public List<OrderItemEventDto> Items { get; init; } = new();
}
#pragma warning restore CA1002, CS1591, SA1600
