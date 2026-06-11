using GoldPC.Shared.Entities;

namespace GoldPC.Shared.Services;

/// <summary>
/// Service for creating, retrieving, and sending user notifications.
/// </summary>
public interface INotificationService
{
    /// <summary>Creates a new notification and stores it.</summary>
    /// <param name="notification">The notification to create.</param>
    /// <returns>The created notification.</returns>
    Task<Notification> CreateNotificationAsync(Notification notification);

    /// <summary>Retrieves notifications for a user with optional filters.</summary>
    /// <param name="userId">The user identifier.</param>
    /// <param name="unreadOnly">If true, returns only unread notifications.</param>
    /// <param name="limit">Maximum number of notifications to return.</param>
    /// <returns>A collection of notifications.</returns>
    Task<IEnumerable<Notification>> GetUserNotificationsAsync(Guid userId, bool unreadOnly = false, int limit = 50);

    /// <summary>Marks a single notification as read.</summary>
    /// <param name="notificationId">The notification identifier.</param>
    /// <returns>A task that completes when the operation is done.</returns>
    Task MarkAsReadAsync(Guid notificationId);

    /// <summary>Marks all notifications for a user as read.</summary>
    /// <param name="userId">The user identifier.</param>
    /// <returns>A task that completes when the operation is done.</returns>
    Task MarkAllAsReadAsync(Guid userId);

    /// <summary>Deletes a notification by its identifier.</summary>
    /// <param name="notificationId">The notification identifier.</param>
    /// <returns>A task that completes when the operation is done.</returns>
    Task DeleteNotificationAsync(Guid notificationId);

    /// <summary>Sends a notification to its target user.</summary>
    /// <param name="notification">The notification to send.</param>
    /// <returns>A task that completes when the operation is done.</returns>
    Task SendNotificationAsync(Notification notification);

    /// <summary>Sends a notification to all users with the specified role.</summary>
    /// <param name="role">The target role name.</param>
    /// <param name="notification">The notification template to send.</param>
    /// <returns>A task that completes when the operation is done.</returns>
    Task SendNotificationToRoleAsync(string role, Notification notification);

    /// <summary>Broadcasts a notification to all users.</summary>
    /// <param name="notification">The notification to broadcast.</param>
    /// <returns>A task that completes when the operation is done.</returns>
    Task BroadcastNotificationAsync(Notification notification);

    /// <summary>Sends a push notification to a specific user.</summary>
    /// <param name="userId">The target user identifier.</param>
    /// <param name="title">The push notification title.</param>
    /// <param name="message">The push notification body.</param>
    /// <returns>A task that completes when the operation is done.</returns>
    Task SendPushNotificationAsync(string userId, string title, string message);

    /// <summary>Sends an email notification.</summary>
    /// <param name="recipientEmail">The recipient email address.</param>
    /// <param name="subject">The email subject.</param>
    /// <param name="body">The email body content.</param>
    /// <returns>A task that completes when the operation is done.</returns>
    Task SendEmailAsync(string recipientEmail, string subject, string body);
}
