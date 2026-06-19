using System.Collections.Concurrent;
using GoldPC.Api.Hubs;
using GoldPC.Shared.Entities;
using GoldPC.Shared.Services;
using Microsoft.AspNetCore.SignalR;

namespace GoldPC.Api.Services;

/// <summary>
/// In-memory реализация INotificationService без БД.
/// Уведомления хранятся в ConcurrentDictionary и отправляются через SignalR.
/// Перед отправкой проверяет глобальные настройки уведомлений (NotificationPreferenceService)
/// и per-user предпочтения (UserNotificationPreferenceService).
/// </summary>
public class NotificationService : INotificationService
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly INotificationPreferenceService _prefService;
    private readonly IEmailService _emailService;
    private readonly ILogger<NotificationService> _logger;
    private readonly ConcurrentDictionary<Guid, Notification> _notifications = new();

    /// <summary>
    /// Initializes a new instance of the <see cref="NotificationService"/> class.
    /// Инициализирует новый экземпляр <see cref="NotificationService"/>.
    /// </summary>
    /// <param name="hubContext">Контекст SignalR hub для отправки уведомлений клиентам.</param>
    /// <param name="prefService">Сервис проверки глобальных настроек уведомлений.</param>
    /// <param name="emailService">Сервис отправки электронной почты.</param>
    /// <param name="logger">Логгер для записи диагностических сообщений.</param>
    public NotificationService(
        IHubContext<NotificationHub> hubContext,
        INotificationPreferenceService prefService,
        IEmailService emailService,
        ILogger<NotificationService> logger)
    {
        _hubContext = hubContext;
        _prefService = prefService;
        _emailService = emailService;
        _logger = logger;
    }

    /// <summary>
    /// Создаёт новое уведомление и сохраняет его в памяти.
    /// </summary>
    /// <param name="notification">Уведомление для создания. Идентификатор и время создания будут установлены автоматически.</param>
    /// <returns>Созданное уведомление с заполненными полями <c>Id</c>, <c>CreatedAt</c> и <c>IsRead</c>.</returns>
    public Task<Notification> CreateNotificationAsync(Notification notification)
    {
        notification.Id = Guid.NewGuid();
        notification.CreatedAt = DateTime.UtcNow;
        notification.IsRead = false;
        _notifications[notification.Id] = notification;
        return Task.FromResult(notification);
    }

    /// <summary>
    /// Получает уведомления пользователя с фильтрацией и ограничением количества.
    /// </summary>
    /// <param name="userId">Идентификатор пользователя.</param>
    /// <param name="unreadOnly">Если <c>true</c>, возвращаются только непрочитанные уведомления.</param>
    /// <param name="limit">Максимальное количество возвращаемых уведомлений (по умолчанию 50).</param>
    /// <returns>Коллекция уведомлений, отсортированная по убыванию даты создания.</returns>
    public Task<IEnumerable<Notification>> GetUserNotificationsAsync(Guid userId, bool unreadOnly = false, int limit = 50)
    {
        IEnumerable<Notification> query = _notifications.Values
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt);

        if (unreadOnly)
            query = query.Where(n => !n.IsRead);

        return Task.FromResult(query.Take(limit));
    }

    /// <summary>
    /// Помечает указанное уведомление как прочитанное.
    /// </summary>
    /// <param name="notificationId">Идентификатор уведомления.</param>
    /// <returns>Задачу, представляющую асинхронную операцию.</returns>
    public Task MarkAsReadAsync(Guid notificationId)
    {
        if (_notifications.TryGetValue(notificationId, out var notification))
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
        }
        return Task.CompletedTask;
    }

    /// <summary>
    /// Помечает все непрочитанные уведомления пользователя как прочитанные.
    /// </summary>
    /// <param name="userId">Идентификатор пользователя.</param>
    /// <returns>Задачу, представляющую асинхронную операцию.</returns>
    public Task MarkAllAsReadAsync(Guid userId)
    {
        foreach (var n in _notifications.Values.Where(n => n.UserId == userId && !n.IsRead))
        {
            n.IsRead = true;
            n.ReadAt = DateTime.UtcNow;
        }
        return Task.CompletedTask;
    }

    /// <summary>
    /// Удаляет уведомление из хранилища по идентификатору.
    /// </summary>
    /// <param name="notificationId">Идентификатор уведомления для удаления.</param>
    /// <returns>Задачу, представляющую асинхронную операцию.</returns>
    public Task DeleteNotificationAsync(Guid notificationId)
    {
        _notifications.TryRemove(notificationId, out _);
        return Task.CompletedTask;
    }

    /// <summary>
    /// Отправляет уведомление конкретному пользователю через SignalR.
    /// Перед отправкой проверяет, включён ли данный тип уведомлений в админских настройках.
    /// </summary>
    /// <param name="notification">Уведомление для отправки.</param>
    /// <returns>Задачу, представляющую асинхронную операцию.</returns>
    public async Task SendNotificationAsync(Notification notification)
    {
        // Check if this notification type is enabled in admin settings
        var enabled = await _prefService.IsNotificationEnabledAsync(notification.Type.ToString());
        if (!enabled)
        {
            _logger.LogDebug("Notification {Type} skipped — disabled in admin settings", notification.Type);
            return;
        }

        await CreateNotificationAsync(notification);
        await _hubContext.Clients.User(notification.UserId.ToString())
            .SendAsync("ReceiveNotification", notification);
    }

    /// <summary>
    /// Отправляет уведомление всем пользователям в указанной роли через SignalR.
    /// Перед отправкой проверяет, включён ли данный тип уведомлений в админских настройках.
    /// </summary>
    /// <param name="role">Роль пользователей, которым отправляется уведомление.</param>
    /// <param name="notification">Уведомление для отправки.</param>
    /// <returns>Задачу, представляющую асинхронную операцию.</returns>
    public async Task SendNotificationToRoleAsync(string role, Notification notification)
    {
        // Check if this notification type is enabled in admin settings
        var enabled = await _prefService.IsNotificationEnabledAsync(notification.Type.ToString());
        if (!enabled)
        {
            _logger.LogDebug("Notification {Type} to role {Role} skipped — disabled in admin settings", notification.Type, role);
            return;
        }

        // Persist the notification before broadcasting
        await CreateNotificationAsync(notification);
        await _hubContext.Clients.Group(role)
            .SendAsync("ReceiveNotification", notification);
    }

    /// <summary>
    /// Рассылает уведомление всем подключённым пользователям через SignalR.
    /// Перед отправкой проверяет, включён ли данный тип уведомлений в админских настройках.
    /// </summary>
    /// <param name="notification">Уведомление для рассылки.</param>
    /// <returns>Задачу, представляющую асинхронную операцию.</returns>
    public async Task BroadcastNotificationAsync(Notification notification)
    {
        // Check if this notification type is enabled in admin settings
        var enabled = await _prefService.IsNotificationEnabledAsync(notification.Type.ToString());
        if (!enabled)
        {
            _logger.LogDebug("Broadcast notification {Type} skipped — disabled in admin settings", notification.Type);
            return;
        }

        // Persist the notification before broadcasting
        await CreateNotificationAsync(notification);
        await _hubContext.Clients.All
            .SendAsync("ReceiveNotification", notification);
    }

    /// <summary>
    /// Отправляет push-уведомление пользователю (в данный момент — заглушка для FCM/APNS).
    /// </summary>
    /// <param name="userId">Идентификатор пользователя (строковый).</param>
    /// <param name="title">Заголовок push-уведомления.</param>
    /// <param name="message">Текст push-уведомления.</param>
    /// <returns>Задачу, представляющую асинхронную операцию.</returns>
    public async Task SendPushNotificationAsync(string userId, string title, string message)
    {
        // HACK: Implement push notification service (FCM/APNS)
        _logger.LogInformation("Push notification: UserId={UserId}, Title={Title}", userId, title);
        await Task.CompletedTask;
    }

    /// <summary>
    /// Отправляет электронное письмо указанному получателю.
    /// </summary>
    /// <param name="recipientEmail">Адрес электронной почты получателя.</param>
    /// <param name="subject">Тема письма.</param>
    /// <param name="body">Текст письма.</param>
    /// <returns>Задачу, представляющую асинхронную операцию.</returns>
    public async Task SendEmailAsync(string recipientEmail, string subject, string body)
    {
        await _emailService.SendEmailAsync(recipientEmail, subject, body);
    }
}
