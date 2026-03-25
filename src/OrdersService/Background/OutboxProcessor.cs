using System.Text.Json;
using GoldPC.OrdersService.Data;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace GoldPC.OrdersService.Background;

public class OutboxProcessor : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<OutboxProcessor> _logger;

    public OutboxProcessor(IServiceProvider serviceProvider, ILogger<OutboxProcessor> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Outbox Processor started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessOutboxMessages(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while processing outbox messages.");
            }

            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }
    }

    private async Task ProcessOutboxMessages(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<OrdersDbContext>();
        var publishEndpoint = scope.ServiceProvider.GetRequiredService<IPublishEndpoint>();

        var messages = await context.OutboxMessages
            .Where(m => m.ProcessedAt == null)
            .OrderBy(m => m.CreatedAt)
            .Take(20)
            .ToListAsync(stoppingToken);

        if (!messages.Any()) return;

        _logger.LogInformation("Processing {Count} outbox messages.", messages.Count);

        foreach (var message in messages)
        {
            try
            {
                var eventType = Type.GetType(message.Type);
                if (eventType == null)
                {
                    _logger.LogWarning("Could not resolve event type {Type}. Skipping message {Id}.", message.Type, message.Id);
                    message.Error = $"Type {message.Type} not found.";
                    message.ProcessedAt = DateTime.UtcNow; // Mark as processed to avoid retry loops
                }
                else
                {
                    var @event = JsonSerializer.Deserialize(message.Content, eventType);
                    if (@event != null)
                    {
                        await publishEndpoint.Publish(@event, eventType, stoppingToken);
                        message.ProcessedAt = DateTime.UtcNow;
                        _logger.LogInformation("Published outbox message {Id} of type {Type}.", message.Id, message.Type);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process outbox message {Id}.", message.Id);
                message.Error = ex.Message;
                // Don't mark as processed if transient? For now, we'll mark as error for visibility.
                // In production, you might want to retry a few times.
            }
        }

        await context.SaveChangesAsync(stoppingToken);
    }
}
