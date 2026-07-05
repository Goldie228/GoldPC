using GoldPC.Shared.Entities;

namespace GoldPC.Shared.Services;

/// <summary>
/// Сервис для создания, получения и отправки пользовательских уведомлений.
/// </summary>
public interface INotificationService
{
    /// <summary>Создаёт новое уведомление и сохраняет его.</summary>
    /// <param name="notification">Уведомление для создания.</param>
    /// <returns>Созданное уведомление.</returns>
    Task<Notification> CreateNotificationAsync(Notification notification);

    /// <summary>Получает уведомления для пользователя с необязательными фильтрами.</summary>
    /// <param name="userId">Идентификатор пользователя.</param>
    /// <param name="unreadOnly">Если true, возвращает только непрочитанные уведомления.</param>
    /// <param name="limit">Максимальное количество возвращаемых уведомлений.</param>
    /// <returns>Коллекция уведомлений.</returns>
    Task<IEnumerable<Notification>> GetUserNotificationsAsync(Guid userId, bool unreadOnly = false, int limit = 50);

    /// <summary>Отмечает одно уведомление как прочитанное.</summary>
    /// <param name="notificationId">Идентификатор уведомления.</param>
    /// <returns>Задача, завершающаяся после выполнения операции.</returns>
    Task MarkAsReadAsync(Guid notificationId);

    /// <summary>Отмечает все уведомления пользователя как прочитанные.</summary>
    /// <param name="userId">Идентификатор пользователя.</param>
    /// <returns>Задача, завершающаяся после выполнения операции.</returns>
    Task MarkAllAsReadAsync(Guid userId);

    /// <summary>Удаляет уведомление по его идентификатору.</summary>
    /// <param name="notificationId">Идентификатор уведомления.</param>
    /// <returns>Задача, завершающаяся после выполнения операции.</returns>
    Task DeleteNotificationAsync(Guid notificationId);

    /// <summary>Отправляет уведомление целевому пользователю.</summary>
    /// <param name="notification">Уведомление для отправки.</param>
    /// <returns>Задача, завершающаяся после выполнения операции.</returns>
    Task SendNotificationAsync(Notification notification);

    /// <summary>Отправляет уведомление всем пользователям с указанной ролью.</summary>
    /// <param name="role">Имя целевой роли.</param>
    /// <param name="notification">Шаблон уведомления для отправки.</param>
    /// <returns>Задача, завершающаяся после выполнения операции.</returns>
    Task SendNotificationToRoleAsync(string role, Notification notification);

    /// <summary>Рассылает уведомление всем пользователям.</summary>
    /// <param name="notification">Уведомление для рассылки.</param>
    /// <returns>Задача, завершающаяся после выполнения операции.</returns>
    Task BroadcastNotificationAsync(Notification notification);

    /// <summary>Отправляет push-уведомление конкретному пользователю.</summary>
    /// <param name="userId">Идентификатор целевого пользователя.</param>
    /// <param name="title">Заголовок push-уведомления.</param>
    /// <param name="message">Текст push-уведомления.</param>
    /// <returns>Задача, завершающаяся после выполнения операции.</returns>
    Task SendPushNotificationAsync(string userId, string title, string message);

    /// <summary>Отправляет email-уведомление.</summary>
    /// <param name="recipientEmail">Email-адрес получателя.</param>
    /// <param name="subject">Тема письма.</param>
    /// <param name="body">Содержимое письма.</param>
    /// <returns>Задача, завершающаяся после выполнения операции.</returns>
    Task SendEmailAsync(string recipientEmail, string subject, string body);
}
