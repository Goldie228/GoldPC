using CatalogService.Services.Interfaces;
using GoldPC.SharedKernel.DTOs;
using MassTransit;
using SharedKernel.Events;

namespace CatalogService.Consumers;

public class OrderPlacedConsumer : IConsumer<OrderPlacedEvent>
{
    private readonly ICatalogService _catalogService;
    private readonly ILogger<OrderPlacedConsumer> _logger;

    public OrderPlacedConsumer(ICatalogService catalogService, ILogger<OrderPlacedConsumer> logger)
    {
        _catalogService = catalogService;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<OrderPlacedEvent> context)
    {
        var @event = context.Message;
        _logger.LogInformation("Processing OrderPlacedEvent for Order: {OrderId}. Reserving stock (Soft Reserve).", @event.OrderId);

        foreach (var item in @event.Items)
        {
            // Here we could implement soft reservation logic
            // For now, we'll just log it as per the "Eventual Consistency" plan
            _logger.LogInformation("Soft reservation for Product {ProductId}, Quantity {Quantity} for Order {OrderId}", 
                item.ProductId, item.Quantity, @event.OrderId);
        }
    }
}
