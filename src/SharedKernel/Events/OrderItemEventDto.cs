#pragma warning disable CS1591, SA1600
namespace SharedKernel.Events;

public record OrderItemEventDto
{
    public Guid ProductId { get; init; }

    public string ProductName { get; init; } = string.Empty;

    public int Quantity { get; init; }

    public decimal Price { get; init; }
}
#pragma warning restore CS1591, SA1600
