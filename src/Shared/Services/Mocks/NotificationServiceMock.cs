#pragma warning disable CS1591, SA1201, SA1204, SA1402, SA1600, SA1616
using System.Collections.Concurrent;
using GoldPC.Shared.Entities;
using Microsoft.Extensions.Logging;

namespace GoldPC.Shared.Services.Mocks;

/// <summary>
/// Mock-реализация сервиса уведомлений для разработки и тестирования.
/// Логирует сообщения в консоль вместо отправки и хранит их для проверки в тестах.
/// </summary>
public class NotificationServiceMock : INotificationService
{
    private readonly ILogger<NotificationServiceMock> _logger;

    /// <summary>
    /// Статический список всех отправленных уведомлений для проверки в тестах
    /// </summary>
    private static readonly ConcurrentBag<Notification> _sentNotifications = new();
    private static readonly ConcurrentDictionary<Guid, Notification> _storedNotifications = new();

    /// <summary>
    /// Gets получить все отправленные уведомления (для тестирования)
    /// </summary>
    public static IReadOnlyList<Notification> SentNotifications => _sentNotifications.ToList().AsReadOnly();

    /// <summary>
    /// Очистить историю отправленных уведомлений (использовать в [TestSetup])
    /// </summary>
    public static void ClearHistory()
    {
        _sentNotifications.Clear();
        _storedNotifications.Clear();
    }

    /// <summary>
    /// Gets or sets a value indicating whether включить логирование в консоль
    /// </summary>
    public bool EnableConsoleLogging { get; set; } = true;

    /// <summary>
    /// Gets or sets имитация задержки отправки (мс)
    /// </summary>
    public int SimulatedDelayMs { get; set; } = 50;

    public NotificationServiceMock(ILogger<NotificationServiceMock> logger)
    {
        _logger = logger;
    }

    public async Task<Notification> CreateNotificationAsync(Notification notification)
    {
        if (SimulatedDelayMs > 0)
        {
            await Task.Delay(SimulatedDelayMs);
        }

        notification.Id = notification.Id == Guid.Empty ? Guid.NewGuid() : notification.Id;
        notification.CreatedAt = DateTime.UtcNow;

        _storedNotifications[notification.Id] = notification;

        if (EnableConsoleLogging)
        {
            _logger.LogInformation("[Mock NotificationService] Created notification: Id={Id}, Type={Type}", notification.Id, notification.Type);
        }

        return notification;
    }

    public async Task<IEnumerable<Notification>> GetUserNotificationsAsync(Guid userId, bool unreadOnly = false, int limit = 50)
    {
        if (SimulatedDelayMs > 0)
        {
            await Task.Delay(SimulatedDelayMs);
        }

        var notifications = _storedNotifications.Values
            .Where(n => n.UserId == userId)
            .Where(n => !unreadOnly || !n.IsRead)
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit);

        return notifications;
    }

    public async Task MarkAsReadAsync(Guid notificationId)
    {
        if (SimulatedDelayMs > 0)
        {
            await Task.Delay(SimulatedDelayMs);
        }

        if (_storedNotifications.TryGetValue(notificationId, out var notification))
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
        }

        if (EnableConsoleLogging)
        {
            _logger.LogInformation("[Mock NotificationService] Marked notification as read: Id={Id}", notificationId);
        }
    }

    public async Task MarkAllAsReadAsync(Guid userId)
    {
        if (SimulatedDelayMs > 0)
        {
            await Task.Delay(SimulatedDelayMs);
        }

        foreach (var notification in _storedNotifications.Values.Where(n => n.UserId == userId))
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
        }

        if (EnableConsoleLogging)
        {
            _logger.LogInformation("[Mock NotificationService] Marked all notifications as read for user: UserId={UserId}", userId);
        }
    }

    public async Task DeleteNotificationAsync(Guid notificationId)
    {
        if (SimulatedDelayMs > 0)
        {
            await Task.Delay(SimulatedDelayMs);
        }

        _storedNotifications.TryRemove(notificationId, out _);

        if (EnableConsoleLogging)
        {
            _logger.LogInformation("[Mock NotificationService] Deleted notification: Id={Id}", notificationId);
        }
    }

    public async Task SendNotificationAsync(Notification notification)
    {
        if (SimulatedDelayMs > 0)
        {
            await Task.Delay(SimulatedDelayMs);
        }

        _sentNotifications.Add(notification);

        if (EnableConsoleLogging)
        {
            _logger.LogInformation("[Mock NotificationService] Sent notification: Id={Id}, Type={Type}, Recipient={UserId}",
                notification.Id, notification.Type, notification.UserId);
        }
    }

    public async Task SendNotificationToRoleAsync(string role, Notification notification)
    {
        if (SimulatedDelayMs > 0)
        {
            await Task.Delay(SimulatedDelayMs);
        }

        _sentNotifications.Add(notification);

        if (EnableConsoleLogging)
        {
            _logger.LogInformation("[Mock NotificationService] Sent notification to role: Role={Role}, NotificationId={Id}", role, notification.Id);
        }
    }

    public async Task BroadcastNotificationAsync(Notification notification)
    {
        if (SimulatedDelayMs > 0)
        {
            await Task.Delay(SimulatedDelayMs);
        }

        _sentNotifications.Add(notification);

        if (EnableConsoleLogging)
        {
            _logger.LogInformation("[Mock NotificationService] Broadcasted notification: Id={Id}, Type={Type}", notification.Id, notification.Type);
        }
    }
}
#pragma warning restore CS1591, SA1201, SA1204, SA1402, SA1600, SA1616
