#pragma warning disable CA1307, CA1716, CS1591, SA1117, SA1600
using System.Diagnostics;
using System.Text.Json;
using GoldPC.Shared.Entities;
using Microsoft.Extensions.Logging;

namespace GoldPC.Shared.Services.Implementations;

/// <summary>
/// Декоратор для логирования всех уведомлений (SMS, Email, Push).
/// Выполняет маскирование чувствительных данных.
/// </summary>
public class NotificationServiceLoggingDecorator : INotificationService
{
    private readonly INotificationService _inner;
    private readonly ILogger<NotificationServiceLoggingDecorator> _logger;

    public NotificationServiceLoggingDecorator(
        INotificationService inner,
        ILogger<NotificationServiceLoggingDecorator> logger)
    {
        _inner = inner;
        _logger = logger;
    }

    public async Task<Notification> CreateNotificationAsync(Notification notification)
    {
        _logger.LogInformation("Creating notification: Id={NotificationId}, Type={NotificationType}", notification.Id, notification.Type);
        var result = await _inner.CreateNotificationAsync(notification);
        _logger.LogInformation("Notification created successfully: Id={NotificationId}", result.Id);
        return result;
    }

    public async Task<IEnumerable<Notification>> GetUserNotificationsAsync(Guid userId, bool unreadOnly = false, int limit = 50)
    {
        _logger.LogDebug("Getting notifications for user: UserId={UserId}, UnreadOnly={UnreadOnly}, Limit={Limit}", userId, unreadOnly, limit);
        return await _inner.GetUserNotificationsAsync(userId, unreadOnly, limit);
    }

    public async Task MarkAsReadAsync(Guid notificationId)
    {
        _logger.LogDebug("Marking notification as read: Id={NotificationId}", notificationId);
        await _inner.MarkAsReadAsync(notificationId);
    }

    public async Task MarkAllAsReadAsync(Guid userId)
    {
        _logger.LogDebug("Marking all notifications as read for user: UserId={UserId}", userId);
        await _inner.MarkAllAsReadAsync(userId);
    }

    public async Task DeleteNotificationAsync(Guid notificationId)
    {
        _logger.LogInformation("Deleting notification: Id={NotificationId}", notificationId);
        await _inner.DeleteNotificationAsync(notificationId);
    }

    public async Task SendNotificationAsync(Notification notification)
    {
        _logger.LogInformation("Sending notification: Id={NotificationId}, Type={NotificationType}, UserId={UserId}", notification.Id, notification.Type, notification.UserId);
        await _inner.SendNotificationAsync(notification);
    }

    public async Task SendNotificationToRoleAsync(string role, Notification notification)
    {
        _logger.LogInformation("Sending notification to role: Role={Role}, NotificationId={NotificationId}", role, notification.Id);
        await _inner.SendNotificationToRoleAsync(role, notification);
    }

    public async Task BroadcastNotificationAsync(Notification notification)
    {
        _logger.LogInformation("Broadcasting notification: Id={NotificationId}, Type={NotificationType}", notification.Id, notification.Type);
        await _inner.BroadcastNotificationAsync(notification);
    }

    private static string MaskPhone(string phone)
    {
        if (string.IsNullOrEmpty(phone) || phone.Length < 7)
        {
            return phone;
        }

        return phone[..3] + "****" + phone[^2..];
    }

    private static string MaskEmail(string email)
    {
        if (string.IsNullOrEmpty(email))
            return email;

        var parts = email.Split('@');
        if (parts.Length != 2)
            return email;

        var username = parts[0].Length > 2 ? parts[0][..2] + "****" : parts[0];
        return username + "@" + parts[1];
    }
}
