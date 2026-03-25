using GoldPC.OrdersService.Data;
using GoldPC.OrdersService.Services;
using GoldPC.SharedKernel.Enums;
using Microsoft.EntityFrameworkCore;

namespace GoldPC.OrdersService.BackgroundServices;

/// <summary>
/// Фоновая служба для автоматической отмены неоплаченных заказов через 24 часа.
/// </summary>
public class OrderExpirationWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<OrderExpirationWorker> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(30);
    private readonly TimeSpan _expirationTime = TimeSpan.FromHours(24);

    public OrderExpirationWorker(IServiceScopeFactory scopeFactory, ILogger<OrderExpirationWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("OrderExpirationWorker starting");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CancelExpiredOrdersAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while cancelling expired orders");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("OrderExpirationWorker stopping");
    }

    private async Task CancelExpiredOrdersAsync(CancellationToken stoppingToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<OrdersDbContext>();
        var ordersService = scope.ServiceProvider.GetRequiredService<IOrdersService>();

        var expirationThreshold = DateTime.UtcNow.Subtract(_expirationTime);

        var expiredOrders = await context.Orders
            .Where(o => o.Status == OrderStatus.New && o.CreatedAt < expirationThreshold)
            .ToListAsync(stoppingToken);

        if (expiredOrders.Any())
        {
            _logger.LogInformation("Found {Count} expired orders to cancel", expiredOrders.Count);

            foreach (var order in expiredOrders)
            {
                var (success, error) = await ordersService.CancelAsync(order.Id, Guid.Empty); // System cancel
                if (success)
                {
                    _logger.LogInformation("Order {OrderNumber} auto-cancelled due to expiration", order.OrderNumber);
                }
                else
                {
                    _logger.LogWarning("Failed to auto-cancel order {OrderNumber}: {Error}", order.OrderNumber, error);
                }
            }
        }
    }
}
