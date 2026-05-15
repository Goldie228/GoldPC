using GoldPC.Shared.Entities;

namespace GoldPC.Shared.Services;

public interface INotificationService
{
    Task<Notification> CreateNotificationAsync(Notification notification);
    Task<IEnumerable<Notification>> GetUserNotificationsAsync(Guid userId, bool unreadOnly = false, int limit = 50);
    Task MarkAsReadAsync(Guid notificationId);
    Task MarkAllAsReadAsync(Guid userId);
    Task DeleteNotificationAsync(Guid notificationId);
    Task SendNotificationAsync(Notification notification);
    Task SendNotificationToRoleAsync(string role, Notification notification);
    Task BroadcastNotificationAsync(Notification notification);
    Task SendPushNotificationAsync(string userId, string title, string message);
    Task SendEmailAsync(string to, string subject, string body);
}
