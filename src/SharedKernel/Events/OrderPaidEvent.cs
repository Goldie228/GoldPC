#pragma warning disable CA1002, CS1591, SA1600
namespace SharedKernel.Events;

public record OrderPaidEvent : IntegrationEvent
{
    public Guid OrderId { get; init; }

    public Guid CustomerId { get; init; }

    public decimal AmountPaid { get; init; }

    public string? ClientPhone { get; init; }

    public List<OrderItemEventDto> Items { get; init; } = new();

    public List<AssemblyBundleInfo> AssemblyBundles { get; init; } = new();
}
#pragma warning restore CA1002, CS1591, SA1600

/// <summary>
/// Дополнение к OrderPaidEvent для бандлов сборки ПК
/// </summary>
public record AssemblyBundleInfo
{
    /// <summary>
    /// ID конфигурации ПК
    /// </summary>
    public Guid PCConfigurationId { get; init; }

    /// <summary>
    /// Индекс бандла в заказе (для мульти-ПК)
    /// </summary>
    public int BundleIndex { get; init; }

    /// <summary>
    /// Стоимость сборки
    /// </summary>
    public decimal AssemblyFee { get; init; }

    /// <summary>
    /// ID заказа
    /// </summary>
    public Guid OrderId { get; init; }

    /// <summary>
    /// ID клиента
    /// </summary>
    public Guid CustomerId { get; init; }

    /// <summary>
    /// Телефон клиента (снапшот)
    /// </summary>
    public string? ClientPhone { get; init; }
}
