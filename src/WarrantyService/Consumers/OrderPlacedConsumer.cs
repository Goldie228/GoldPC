using MassTransit;
using SharedKernel.Events;
using GoldPC.WarrantyService.Services;
using GoldPC.SharedKernel.DTOs;

namespace GoldPC.WarrantyService.Consumers;

public class OrderPlacedConsumer : IConsumer<OrderPlacedEvent>
{
    private readonly IWarrantyService _warrantyService;
    private readonly ILogger<OrderPlacedConsumer> _logger;

    public OrderPlacedConsumer(IWarrantyService warrantyService, ILogger<OrderPlacedConsumer> logger)
    {
        _warrantyService = warrantyService;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<OrderPlacedEvent> context)
    {
        var @event = context.Message;
        _logger.LogInformation("Processing OrderPlacedEvent for Order: {OrderId}", @event.OrderId);

        foreach (var item in @event.Items)
        {
            var request = new CreateWarrantyRequest
            {
                OrderId = @event.OrderId,
                ProductId = item.ProductId,
                ProductName = item.ProductName,
                UserId = @event.CustomerId,
                WarrantyMonths = 12 // Default 12 months, should ideally come from Catalog
            };

            var (warranty, error) = await _warrantyService.CreateCardAsync(request);

            if (warranty != null)
            {
                _logger.LogInformation("Warranty card created for product {ProductId} in order {OrderId}", item.ProductId, @event.OrderId);
            }
            else
            {
                _logger.LogError("Failed to create warranty card for product {ProductId} in order {OrderId}: {Error}", item.ProductId, @event.OrderId, error);
            }
        }
    }
}
