using GoldPC.Shared.Authorization;
using GoldPC.Shared.Entities;

namespace GoldPC.Shared.Services;

/// <summary>
/// Обработчики событий для системных событий, которые запускают уведомления.
/// Каждый обработчик проверяет настройки уведомлений перед отправкой.
/// </summary>
public class NotificationEventHandlers
{
    private readonly INotificationService _notificationService;
    private readonly INotificationPreferenceService _preferenceService;

    /// <summary>
    /// Инициализирует новый экземпляр класса <see cref="NotificationEventHandlers"/>.
    /// </summary>
    /// <param name="notificationService">Сервис уведомлений.</param>
    /// <param name="preferenceService">Сервис предпочтений уведомлений.</param>
    public NotificationEventHandlers(
        INotificationService notificationService,
        INotificationPreferenceService preferenceService)
    {
        _notificationService = notificationService;
        _preferenceService = preferenceService;
    }

    /// <summary>
    /// Обрабатывает событие изменения статуса заказа.
    /// Учитывает настройку администратора OrderEmailNotifications.
    /// </summary>
    /// <param name="orderId">Идентификатор заказа.</param>
    /// <param name="customerId">Идентификатор пользователя-клиента.</param>
    /// <param name="oldStatus">Предыдущий статус заказа.</param>
    /// <param name="newStatus">Новый статус заказа.</param>
    /// <returns>Задача, завершающаяся после отправки уведомлений.</returns>
    public async Task OnOrderStatusChanged(Guid orderId, Guid customerId, string oldStatus, string newStatus)
    {
        var notificationType = nameof(NotificationType.OrderStatusChanged);

        // Проверка предпочтений администратора для уведомления клиента
        if (await _preferenceService.IsUserOptedInAsync(customerId, notificationType))
        {
            var notification = new Notification
            {
                UserId = customerId,
                Title = $"Заказ #{orderId.ToString().Substring(0, 8)} статус обновлён",
                Message = $"Статус вашего заказа изменён с {oldStatus} на {newStatus}",
                Type = NotificationType.OrderStatusChanged,
                Priority = newStatus == "Cancelled" ? NotificationPriority.High : NotificationPriority.Medium,
                RelatedUrl = $"/orders/{orderId}"
            };

            await _notificationService.SendNotificationAsync(notification);
        }

        // Всегда уведомлять менеджеров об изменениях статуса (внутренняя операционная потребность)
        await _notificationService.SendNotificationToRoleAsync(Roles.Manager, new Notification
        {
            UserId = Guid.Empty,
            Title = $"Заказ #{orderId.ToString().Substring(0, 8)} статус изменён",
            Message = $"Статус заказа обновлён до {newStatus}",
            Type = NotificationType.OrderStatusChanged,
            Priority = NotificationPriority.Low,
            RelatedUrl = $"/orders/{orderId}"
        });
    }

    /// <summary>
    /// Обрабатывает событие обновления заявки на ремонт
    /// </summary>
    /// <param name="ticketId">Идентификатор заявки на ремонт.</param>
    /// <param name="assignedMasterId">Идентификатор назначенного мастера.</param>
    /// <param name="status">Новый статус заявки.</param>
    /// <param name="comment">Необязательный комментарий к обновлению.</param>
    /// <returns>Задача, завершающаяся после отправки уведомления.</returns>
    public async Task OnRepairTicketUpdated(Guid ticketId, Guid assignedMasterId, string status, string comment)
    {
        await _notificationService.SendNotificationAsync(new Notification
        {
            UserId = assignedMasterId,
            Title = $"Заявка на ремонт #{ticketId.ToString().Substring(0, 8)} обновлена",
            Message = comment ?? "Статус заявки был обновлён",
            Type = NotificationType.RepairTicketUpdated,
            Priority = NotificationPriority.Medium,
            RelatedUrl = $"/tickets/{ticketId}"
        });
    }

    /// <summary>
    /// Обрабатывает событие предупреждения о низком запасе.
    /// Учитывает настройку администратора LowStockNotifications.
    /// </summary>
    /// <param name="productId">Идентификатор товара.</param>
    /// <param name="productName">Название товара.</param>
    /// <param name="currentStock">Текущий уровень запаса.</param>
    /// <param name="threshold">Порог низкого запаса.</param>
    /// <returns>Задача, завершающаяся после отправки уведомлений.</returns>
    public async Task OnLowStockAlert(Guid productId, string productName, int currentStock, int threshold)
    {
        var notificationType = nameof(NotificationType.LowStockAlert);

        if (!await _preferenceService.IsNotificationEnabledAsync(notificationType))
        {
            return; // уведомления о низком запасе отключены в настройках администратора
        }

        await _notificationService.SendNotificationToRoleAsync(Roles.Manager, new Notification
        {
            UserId = Guid.Empty,
            Title = "Предупреждение о низком запасе",
            Message = $"Товар '{productName}' ниже порога. Текущий: {currentStock}, Порог: {threshold}",
            Type = NotificationType.LowStockAlert,
            Priority = currentStock <= 0 ? NotificationPriority.Critical : NotificationPriority.High,
            RelatedUrl = $"/inventory/{productId}"
        });

        await _notificationService.SendNotificationToRoleAsync(Roles.Admin, new Notification
        {
            UserId = Guid.Empty,
            Title = "Предупреждение о низком запасе",
            Message = $"Запас товара '{productName}' критически низок",
            Type = NotificationType.LowStockAlert,
            Priority = currentStock <= 0 ? NotificationPriority.Critical : NotificationPriority.High,
            RelatedUrl = $"/inventory/{productId}"
        });
    }

    /// <summary>
    /// Обрабатывает событие нового сообщения поддержки
    /// </summary>
    /// <param name="ticketId">Идентификатор обращения в поддержку.</param>
    /// <param name="senderId">Идентификатор отправителя.</param>
    /// <param name="recipientId">Идентификатор получателя.</param>
    /// <param name="message">Содержимое сообщения.</param>
    /// <returns>Задача, завершающаяся после отправки уведомления.</returns>
    public async Task OnNewSupportMessage(Guid ticketId, Guid senderId, Guid recipientId, string message)
    {
        await _notificationService.SendNotificationAsync(new Notification
        {
            UserId = recipientId,
            Title = "Получено новое сообщение поддержки",
            Message = message.Length > 100 ? string.Concat(message.AsSpan(0, 100), "...") : message,
            Type = NotificationType.NewSupportMessage,
            Priority = NotificationPriority.Medium,
            RelatedUrl = $"/support/{ticketId}"
        });
    }

    /// <summary>
    /// Обрабатывает событие входа с нового устройства / IP-адреса.
    /// Учитывает настройку администратора LoginNotifications.
    /// </summary>
    /// <param name="userId">Идентификатор пользователя.</param>
    /// <param name="email">Email-адрес пользователя.</param>
    /// <param name="deviceInfo">Информация об использованном устройстве.</param>
    /// <param name="ipAddress">IP-адрес входа.</param>
    /// <returns>Задача, завершающаяся после отправки уведомления.</returns>
    public async Task OnLoginFromNewDevice(Guid userId, string email, string deviceInfo, string ipAddress)
    {
        var notificationType = "LoginFromNewDevice";

        if (!await _preferenceService.IsUserOptedInAsync(userId, notificationType))
        {
            return; // уведомления о входе отключены в настройках администратора
        }

        await _notificationService.SendNotificationAsync(new Notification
        {
            UserId = userId,
            Title = "Обнаружен новый вход",
            Message = $"Обнаружен новый вход в вашу учётную запись с {deviceInfo} ({ipAddress})",
            Type = NotificationType.SystemAnnouncement,
            Priority = NotificationPriority.High,
            RelatedUrl = "/account/security"
        });
    }
}
