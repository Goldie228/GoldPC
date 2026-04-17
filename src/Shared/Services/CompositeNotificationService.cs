#pragma warning disable CS1591, SA1600
using GoldPC.Shared.Entities;
using GoldPC.Shared.Services.Implementations;
using Microsoft.Extensions.Logging;

namespace GoldPC.Shared.Services;

/// <summary>
/// Композитный сервис уведомлений, объединяющий SMS и Email
/// </summary>
public class CompositeNotificationService : INotificationService
{
    private readonly ILogger<CompositeNotificationService> _logger;
    private readonly SmsRuService _smsService;
    private readonly SmtpEmailService _emailService;

    public CompositeNotificationService(ILogger<CompositeNotificationService> logger, SmsRuService smsService, SmtpEmailService emailService)
    {
        _logger = logger;
        _smsService = smsService;
        _emailService = emailService;
    }

    public Task<Notification> CreateNotificationAsync(Notification notification)
    {
        _logger.LogDebug("CompositeNotificationService CreateNotificationAsync called");
        return Task.FromResult(notification);
    }

    public Task<IEnumerable<Notification>> GetUserNotificationsAsync(Guid userId, bool unreadOnly = false, int limit = 50)
    {
        _logger.LogDebug("CompositeNotificationService GetUserNotificationsAsync called");
        return Task.FromResult(Enumerable.Empty<Notification>());
    }

    public Task MarkAsReadAsync(Guid notificationId)
    {
        _logger.LogDebug("CompositeNotificationService MarkAsReadAsync called");
        return Task.CompletedTask;
    }

    public Task MarkAllAsReadAsync(Guid userId)
    {
        _logger.LogDebug("CompositeNotificationService MarkAllAsReadAsync called");
        return Task.CompletedTask;
    }

    public Task DeleteNotificationAsync(Guid notificationId)
    {
        _logger.LogDebug("CompositeNotificationService DeleteNotificationAsync called");
        return Task.CompletedTask;
    }

    public async Task SendNotificationAsync(Notification notification)
    {
        _logger.LogInformation("CompositeNotificationService sending notification {Id}", notification.Id);

        _logger.LogInformation("Routing notification {Id} of type {Type}", notification.Id, notification.Type);
    }

    public Task SendNotificationToRoleAsync(string role, Notification notification)
    {
        _logger.LogDebug("CompositeNotificationService SendNotificationToRoleAsync called for role {Role}", role);
        return Task.CompletedTask;
    }

    public Task BroadcastNotificationAsync(Notification notification)
    {
        _logger.LogDebug("CompositeNotificationService BroadcastNotificationAsync called");
        return Task.CompletedTask;
    }
}
#pragma warning restore CS1591, SA1600
