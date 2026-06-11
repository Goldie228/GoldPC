namespace GoldPC.Shared.Services;

/// <summary>
/// Service for checking whether a notification type is enabled
/// based on admin settings and user preferences.
/// </summary>
public interface INotificationPreferenceService
{
    /// <summary>
    /// Check if a notification type is globally enabled in admin settings.
    /// </summary>
    /// <param name="notificationType">Notification type string (e.g. "LowStockAlert", "OrderStatusChanged")</param>
    /// <returns><c>true</c> if the notification type is enabled; otherwise, <c>false</c>.</returns>
    Task<bool> IsNotificationEnabledAsync(string notificationType);

    /// <summary>
    /// Check if a specific user has opted in for a notification type.
    /// Also checks the global admin setting as a prerequisite.
    /// </summary>
    /// <param name="userId">The user identifier.</param>
    /// <param name="notificationType">Notification type string (e.g. "LowStockAlert", "OrderStatusChanged")</param>
    /// <returns><c>true</c> if the user is opted in and the type is enabled; otherwise, <c>false</c>.</returns>
    Task<bool> IsUserOptedInAsync(Guid userId, string notificationType);
}
