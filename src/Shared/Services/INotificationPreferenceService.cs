namespace GoldPC.Shared.Services;

/// <summary>
/// Сервис для проверки, включён ли тип уведомления
/// на основе настроек администратора и предпочтений пользователя.
/// </summary>
public interface INotificationPreferenceService
{
    /// <summary>
    /// Проверяет, включён ли тип уведомления глобально в настройках администратора.
    /// </summary>
    /// <param name="notificationType">Строка типа уведомления (например "LowStockAlert", "OrderStatusChanged")</param>
    /// <returns><c>true</c> если тип уведомления включён; иначе <c>false</c>.</returns>
    Task<bool> IsNotificationEnabledAsync(string notificationType);

    /// <summary>
    /// Проверяет, подписан ли конкретный пользователь на тип уведомления.
    /// Также проверяет глобальную настройку администратора как предварительное условие.
    /// </summary>
    /// <param name="userId">Идентификатор пользователя.</param>
    /// <param name="notificationType">Строка типа уведомления (например "LowStockAlert", "OrderStatusChanged")</param>
    /// <returns><c>true</c> если пользователь подписан и тип включён; иначе <c>false</c>.</returns>
    Task<bool> IsUserOptedInAsync(Guid userId, string notificationType);
}
