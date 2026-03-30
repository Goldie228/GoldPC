#pragma warning disable CS1591
namespace GoldPC.Shared.Services.Interfaces;

/// <summary>
/// Тип уведомления
/// </summary>
public enum NotificationType
{
    Sms,
    Email,
    Push
}

/// <summary>
/// Интерфейс сервиса уведомлений
/// </summary>
public interface INotificationService
{
    /// <summary>
    /// Отправить SMS
    /// </summary>
    /// <param name="phone">Номер телефона</param>
    /// <param name="message">Текст сообщения</param>
    /// <returns>Результат отправки</returns>
    Task<(bool Success, string? Error)> SendSmsAsync(string phone, string message);

    /// <summary>
    /// Отправить Email
    /// </summary>
    /// <param name="email">Email адрес</param>
    /// <param name="subject">Тема письма</param>
    /// <param name="body">Тело письма</param>
    /// <returns>Результат отправки</returns>
    Task<(bool Success, string? Error)> SendEmailAsync(string email, string subject, string body);

    /// <summary>
    /// Отправить Push-уведомление
    /// </summary>
    /// <param name="userId">ID пользователя</param>
    /// <param name="title">Заголовок</param>
    /// <param name="message">Текст сообщения</param>
    /// <returns>Результат отправки</returns>
    Task<(bool Success, string? Error)> SendPushNotificationAsync(string userId, string title, string message);
}
#pragma warning restore CS1591
