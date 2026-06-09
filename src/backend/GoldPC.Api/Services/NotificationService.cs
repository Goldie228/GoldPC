using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;
using GoldPC.Api.Hubs;
using GoldPC.Shared.Entities;
using GoldPC.Shared.Services;

namespace GoldPC.Api.Services;

/// <summary>
/// In-memory реализация INotificationService без БД.
/// Уведомления хранятся в ConcurrentDictionary и отправляются через SignalR.
/// </summary>
public class NotificationService : INotificationService
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<NotificationService> _logger;
    private static readonly ConcurrentDictionary<Guid, Notification> _notifications = new();

    public NotificationService(IHubContext<NotificationHub> hubContext, ILogger<NotificationService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public Task<Notification> CreateNotificationAsync(Notification notification)
    {
        notification.Id = Guid.NewGuid();
        notification.CreatedAt = DateTime.UtcNow;
        notification.IsRead = false;
        _notifications[notification.Id] = notification;
        return Task.FromResult(notification);
    }

    public Task<IEnumerable<Notification>> GetUserNotificationsAsync(Guid userId, bool unreadOnly = false, int limit = 50)
    {
        IEnumerable<Notification> query = _notifications.Values
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt);

        if (unreadOnly)
            query = query.Where(n => !n.IsRead);

        return Task.FromResult(query.Take(limit));
    }

    public Task MarkAsReadAsync(Guid notificationId)
    {
        if (_notifications.TryGetValue(notificationId, out var notification))
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
        }
        return Task.CompletedTask;
    }

    public Task MarkAllAsReadAsync(Guid userId)
    {
        foreach (var n in _notifications.Values.Where(n => n.UserId == userId && !n.IsRead))
        {
            n.IsRead = true;
            n.ReadAt = DateTime.UtcNow;
        }
        return Task.CompletedTask;
    }

    public Task DeleteNotificationAsync(Guid notificationId)
    {
        _notifications.TryRemove(notificationId, out _);
        return Task.CompletedTask;
    }

    public async Task SendNotificationAsync(Notification notification)
    {
        await CreateNotificationAsync(notification);
        await _hubContext.Clients.User(notification.UserId.ToString())
            .SendAsync("ReceiveNotification", notification);
    }

    public async Task SendNotificationToRoleAsync(string role, Notification notification)
    {
        await _hubContext.Clients.Group(role)
            .SendAsync("ReceiveNotification", notification);
    }

    public async Task BroadcastNotificationAsync(Notification notification)
    {
        await _hubContext.Clients.All
            .SendAsync("ReceiveNotification", notification);
    }

    public Task SendPushNotificationAsync(string userId, string title, string message)
    {
        _logger.LogInformation("Push notification skipped (not implemented): {UserId} - {Title}", userId, title);
        return Task.CompletedTask;
    }

    public Task SendEmailAsync(string to, string subject, string body)
    {
        _logger.LogInformation("Email skipped (not implemented): {To} - {Subject}", to, subject);
        return Task.CompletedTask;
    }
}
