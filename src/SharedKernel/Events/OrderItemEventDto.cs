namespace SharedKernel.Events;

public record OrderItemEventDto
{
    public Guid ProductId { get; init; }

    public string ProductName { get; init; } = string.Empty;

    public int Quantity { get; init; }

    public decimal Price { get; init; }
}
