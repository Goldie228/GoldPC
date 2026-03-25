using MassTransit;
using SharedKernel.Events;
using CatalogService.Services.Interfaces;
using GoldPC.SharedKernel.DTOs;

namespace CatalogService.Consumers;

public class OrderPaidConsumer : IConsumer<OrderPaidEvent>
{
    private readonly ICatalogService _catalogService;
    private readonly ILogger<OrderPaidConsumer> _logger;

    public OrderPaidConsumer(ICatalogService catalogService, ILogger<OrderPaidConsumer> logger)
    {
        _catalogService = catalogService;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<OrderPaidEvent> context)
    {
        var @event = context.Message;
        _logger.LogInformation("Processing OrderPaidEvent for Order: {OrderId}. Reserving stock.", @event.OrderId);

        foreach (var item in @event.Items)
        {
            var product = await _catalogService.GetProductByIdAsync(item.ProductId);
            if (product != null)
            {
                var newStock = Math.Max(0, product.Stock - item.Quantity);
                await _catalogService.UpdateProductAsync(item.ProductId, new UpdateProductDto
                {
                    Stock = newStock
                });
                _logger.LogInformation("Stock updated for Product {ProductId}: {OldStock} -> {NewStock}", item.ProductId, product.Stock, newStock);
            }
            else
            {
                _logger.LogWarning("Product {ProductId} not found for stock reservation in Order {OrderId}", item.ProductId, @event.OrderId);
            }
        }
    }
}
