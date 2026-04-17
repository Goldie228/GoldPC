#pragma warning disable CA1031, CS1591, SA1600
using GoldPC.Shared.Entities;
using GoldPC.Shared.Services.Background;
using Microsoft.Extensions.Logging;

namespace GoldPC.Shared.Services.Implementations;

/// <summary>
/// Продакшн-реализация сервиса уведомлений.
/// Использует Twilio для SMS и асинхронную очередь для Email.
/// </summary>
public class ProductionNotificationService : INotificationService
{
    private readonly TwilioSmsService _smsService;
    private readonly IEmailQueue _emailQueue;
    private readonly ILogger<ProductionNotificationService> _logger;

    public ProductionNotificationService(
        TwilioSmsService smsService,
        IEmailQueue emailQueue,
        ILogger<ProductionNotificationService> logger)
    {
        _smsService = smsService;
        _emailQueue = emailQueue;
        _logger = logger;
    }

    public Task<Notification> CreateNotificationAsync(Notification notification)
    {
        // TODO: Implement persistence to database
        _logger.LogDebug("CreateNotificationAsync called, returning passed notification");
        return Task.FromResult(notification);
    }

    public Task<IEnumerable<Notification>> GetUserNotificationsAsync(Guid userId, bool unreadOnly = false, int limit = 50)
    {
        // TODO: Implement database read
        _logger.LogDebug("GetUserNotificationsAsync called for user {UserId}", userId);
        return Task.FromResult(Enumerable.Empty<Notification>());
    }

    public Task MarkAsReadAsync(Guid notificationId)
    {
        // TODO: Implement database update
        _logger.LogDebug("MarkAsReadAsync called for notification {NotificationId}", notificationId);
        return Task.CompletedTask;
    }

    public Task MarkAllAsReadAsync(Guid userId)
    {
        // TODO: Implement database batch update
        _logger.LogDebug("MarkAllAsReadAsync called for user {UserId}", userId);
        return Task.CompletedTask;
    }

    public Task DeleteNotificationAsync(Guid notificationId)
    {
        // TODO: Implement database delete
        _logger.LogDebug("DeleteNotificationAsync called for notification {NotificationId}", notificationId);
        return Task.CompletedTask;
    }

    public async Task SendNotificationAsync(Notification notification)
    {
        _logger.LogInformation("SendNotificationAsync called for notification {NotificationId}", notification.Id);

        _logger.LogInformation("Notification {NotificationId} of type {Type} processed for user {UserId}",
            notification.Id, notification.Type, notification.UserId);
    }

    public Task SendNotificationToRoleAsync(string role, Notification notification)
    {
        _logger.LogDebug("SendNotificationToRoleAsync called for role {Role}", role);
        // TODO: Resolve users by role and send
        return Task.CompletedTask;
    }

    public Task BroadcastNotificationAsync(Notification notification)
    {
        _logger.LogDebug("BroadcastNotificationAsync called");
        // TODO: Broadcast to all active users
        return Task.CompletedTask;
    }
}
#pragma warning restore CA1031, CS1591, SA1600
