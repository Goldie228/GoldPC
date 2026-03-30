#pragma warning disable CS1591, SA1600
namespace SharedKernel.Events;

/// <summary>
/// Base class for all integration events across microservices.
/// </summary>
public abstract record IntegrationEvent
{
    public Guid Id { get; init; } = Guid.NewGuid();

    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;

    public string CorrelationId { get; init; } = Guid.NewGuid().ToString();
}
#pragma warning restore CS1591, SA1600
