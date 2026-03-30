#pragma warning disable CS1591, SA1201, SA1204, SA1402, SA1600, SA1616
using System.Collections.Concurrent;
using GoldPC.Shared.Services.Interfaces;
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
    private static readonly ConcurrentBag<SentNotification> _sentNotifications = new();

    /// <summary>
    /// Gets получить все отправленные уведомления (для тестирования)
    /// </summary>
    public static IReadOnlyList<SentNotification> SentNotifications => _sentNotifications.ToList().AsReadOnly();

    /// <summary>
    /// Очистить историю отправленных уведомлений (использовать в [TestSetup])
    /// </summary>
    public static void ClearHistory() => _sentNotifications.Clear();

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

    public async Task<(bool Success, string? Error)> SendSmsAsync(string phone, string message)
    {
        if (SimulatedDelayMs > 0)
        {
            await Task.Delay(SimulatedDelayMs);
        }

        var notification = new SentNotification
        {
            Id = Guid.NewGuid(),
            Type = NotificationType.Sms,
            Recipient = phone,
            Message = message,
            SentAt = DateTime.UtcNow,
            Success = true
        };

        _sentNotifications.Add(notification);

        if (EnableConsoleLogging)
        {
            _logger.LogInformation("[Mock NotificationService] 📱 SMS sent to {Phone}: {Message}", phone, message);
        }

        return (true, null);
    }

    public async Task<(bool Success, string? Error)> SendEmailAsync(string email, string subject, string body)
    {
        if (SimulatedDelayMs > 0)
        {
            await Task.Delay(SimulatedDelayMs);
        }

        var notification = new SentNotification
        {
            Id = Guid.NewGuid(),
            Type = NotificationType.Email,
            Recipient = email,
            Subject = subject,
            Message = body,
            SentAt = DateTime.UtcNow,
            Success = true
        };

        _sentNotifications.Add(notification);

        if (EnableConsoleLogging)
        {
            _logger.LogInformation("[Mock NotificationService] 📧 Email sent to {Email} with subject: {Subject}", email, subject);
        }

        return (true, null);
    }

    public async Task<(bool Success, string? Error)> SendPushNotificationAsync(string userId, string title, string message)
    {
        if (SimulatedDelayMs > 0)
        {
            await Task.Delay(SimulatedDelayMs);
        }

        var notification = new SentNotification
        {
            Id = Guid.NewGuid(),
            Type = NotificationType.Push,
            Recipient = userId,
            Subject = title,
            Message = message,
            SentAt = DateTime.UtcNow,
            Success = true
        };

        _sentNotifications.Add(notification);

        if (EnableConsoleLogging)
        {
            _logger.LogInformation("[Mock NotificationService] 🔔 Push notification sent to User {UserId}: {Title} - {Message}", userId, title, message);
        }

        return (true, null);
    }

    /// <summary>
    /// Получить уведомления по типу (для тестирования)
    /// </summary>
    /// <returns></returns>
    public static IEnumerable<SentNotification> GetByType(NotificationType type)
    {
        return _sentNotifications.Where(n => n.Type == type);
    }

    /// <summary>
    /// Получить уведомления по получателю (для тестирования)
    /// </summary>
    /// <returns></returns>
    public static IEnumerable<SentNotification> GetByRecipient(string recipient)
    {
        return _sentNotifications.Where(n => n.Recipient == recipient);
    }

    /// <summary>
    /// Получить последние N уведомлений (для тестирования)
    /// </summary>
    /// <returns></returns>
    public static IEnumerable<SentNotification> GetRecent(int count = 10)
    {
        return _sentNotifications.OrderByDescending(n => n.SentAt).Take(count);
    }
}

/// <summary>
/// Запись об отправленном уведомлении (для тестирования)
/// </summary>
public class SentNotification
{
    public Guid Id { get; set; }

    public NotificationType Type { get; set; }

    public string Recipient { get; set; } = string.Empty;

    public string? Subject { get; set; }

    public string Message { get; set; } = string.Empty;

    public DateTime SentAt { get; set; }

    public bool Success { get; set; }

    public string? Error { get; set; }

    public override string ToString()
    {
        var typeEmoji = Type switch
        {
            NotificationType.Sms => "📱",
            NotificationType.Email => "📧",
            NotificationType.Push => "🔔",
            _ => "📨"
        };
        var msgPreview = Message.Length > 50 ? Message[..50] + "..." : Message;
        return $"{typeEmoji} [{Type}] To: {Recipient} | {(Subject != null ? $"Subject: {Subject} | " : string.Empty)}Message: {msgPreview}";
    }
}
#pragma warning restore CS1591, SA1201, SA1204, SA1402, SA1600, SA1616
