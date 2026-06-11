using GoldPC.Shared.Authorization;
using GoldPC.Shared.Entities;

namespace GoldPC.Shared.Services;

/// <summary>
/// Event handlers for system events that trigger notifications.
/// Each handler checks notification preferences before sending.
/// </summary>
public class NotificationEventHandlers
{
    private readonly INotificationService _notificationService;
    private readonly INotificationPreferenceService _preferenceService;

    /// <summary>
    /// Initializes a new instance of the <see cref="NotificationEventHandlers"/> class.
    /// </summary>
    /// <param name="notificationService">The notification service.</param>
    /// <param name="preferenceService">The notification preference service.</param>
    public NotificationEventHandlers(
        INotificationService notificationService,
        INotificationPreferenceService preferenceService)
    {
        _notificationService = notificationService;
        _preferenceService = preferenceService;
    }

    /// <summary>
    /// Handle order status change event.
    /// Respects the OrderEmailNotifications admin setting.
    /// </summary>
    /// <param name="orderId">The order identifier.</param>
    /// <param name="customerId">The customer user identifier.</param>
    /// <param name="oldStatus">The previous order status.</param>
    /// <param name="newStatus">The new order status.</param>
    /// <returns>A task that completes when the notifications have been sent.</returns>
    public async Task OnOrderStatusChanged(Guid orderId, Guid customerId, string oldStatus, string newStatus)
    {
        var notificationType = nameof(NotificationType.OrderStatusChanged);

        // Check admin preferences for customer notification
        if (await _preferenceService.IsUserOptedInAsync(customerId, notificationType))
        {
            var notification = new Notification
            {
                UserId = customerId,
                Title = $"Order #{orderId.ToString().Substring(0, 8)} status updated",
                Message = $"Your order status has changed from {oldStatus} to {newStatus}",
                Type = NotificationType.OrderStatusChanged,
                Priority = newStatus == "Cancelled" ? NotificationPriority.High : NotificationPriority.Medium,
                RelatedUrl = $"/orders/{orderId}"
            };

            await _notificationService.SendNotificationAsync(notification);
        }

        // Always notify managers about status changes (internal operational need)
        await _notificationService.SendNotificationToRoleAsync(Roles.Manager, new Notification
        {
            UserId = Guid.Empty,
            Title = $"Order #{orderId.ToString().Substring(0, 8)} status changed",
            Message = $"Order status updated to {newStatus}",
            Type = NotificationType.OrderStatusChanged,
            Priority = NotificationPriority.Low,
            RelatedUrl = $"/orders/{orderId}"
        });
    }

    /// <summary>
    /// Handle repair ticket update event
    /// </summary>
    /// <param name="ticketId">The repair ticket identifier.</param>
    /// <param name="assignedMasterId">The assigned master user identifier.</param>
    /// <param name="status">The new ticket status.</param>
    /// <param name="comment">Optional comment about the update.</param>
    /// <returns>A task that completes when the notification has been sent.</returns>
    public async Task OnRepairTicketUpdated(Guid ticketId, Guid assignedMasterId, string status, string comment)
    {
        await _notificationService.SendNotificationAsync(new Notification
        {
            UserId = assignedMasterId,
            Title = $"Repair Ticket #{ticketId.ToString().Substring(0, 8)} updated",
            Message = comment ?? "Ticket status has been updated",
            Type = NotificationType.RepairTicketUpdated,
            Priority = NotificationPriority.Medium,
            RelatedUrl = $"/tickets/{ticketId}"
        });
    }

    /// <summary>
    /// Handle low stock alert event.
    /// Respects the LowStockNotifications admin setting.
    /// </summary>
    /// <param name="productId">The product identifier.</param>
    /// <param name="productName">The product name.</param>
    /// <param name="currentStock">The current stock level.</param>
    /// <param name="threshold">The low-stock threshold.</param>
    /// <returns>A task that completes when the notifications have been sent.</returns>
    public async Task OnLowStockAlert(Guid productId, string productName, int currentStock, int threshold)
    {
        var notificationType = nameof(NotificationType.LowStockAlert);

        if (!await _preferenceService.IsNotificationEnabledAsync(notificationType))
        {
            return; // low stock notifications are disabled in admin settings
        }

        await _notificationService.SendNotificationToRoleAsync(Roles.Manager, new Notification
        {
            UserId = Guid.Empty,
            Title = "Low Stock Alert",
            Message = $"Product '{productName}' is below threshold. Current: {currentStock}, Threshold: {threshold}",
            Type = NotificationType.LowStockAlert,
            Priority = currentStock <= 0 ? NotificationPriority.Critical : NotificationPriority.High,
            RelatedUrl = $"/inventory/{productId}"
        });

        await _notificationService.SendNotificationToRoleAsync(Roles.Admin, new Notification
        {
            UserId = Guid.Empty,
            Title = "Low Stock Alert",
            Message = $"Product '{productName}' stock is critically low",
            Type = NotificationType.LowStockAlert,
            Priority = currentStock <= 0 ? NotificationPriority.Critical : NotificationPriority.High,
            RelatedUrl = $"/inventory/{productId}"
        });
    }

    /// <summary>
    /// Handle new support message event
    /// </summary>
    /// <param name="ticketId">The support ticket identifier.</param>
    /// <param name="senderId">The sender user identifier.</param>
    /// <param name="recipientId">The recipient user identifier.</param>
    /// <param name="message">The message content.</param>
    /// <returns>A task that completes when the notification has been sent.</returns>
    public async Task OnNewSupportMessage(Guid ticketId, Guid senderId, Guid recipientId, string message)
    {
        await _notificationService.SendNotificationAsync(new Notification
        {
            UserId = recipientId,
            Title = "New support message received",
            Message = message.Length > 100 ? string.Concat(message.AsSpan(0, 100), "...") : message,
            Type = NotificationType.NewSupportMessage,
            Priority = NotificationPriority.Medium,
            RelatedUrl = $"/support/{ticketId}"
        });
    }

    /// <summary>
    /// Handle login from a new device / IP address event.
    /// Respects the LoginNotifications admin setting.
    /// </summary>
    /// <param name="userId">The user identifier.</param>
    /// <param name="email">The user's email address.</param>
    /// <param name="deviceInfo">Information about the device used.</param>
    /// <param name="ipAddress">The IP address of the login.</param>
    /// <returns>A task that completes when the notification has been sent.</returns>
    public async Task OnLoginFromNewDevice(Guid userId, string email, string deviceInfo, string ipAddress)
    {
        var notificationType = "LoginFromNewDevice";

        if (!await _preferenceService.IsUserOptedInAsync(userId, notificationType))
        {
            return; // login notifications are disabled in admin settings
        }

        await _notificationService.SendNotificationAsync(new Notification
        {
            UserId = userId,
            Title = "New login detected",
            Message = $"A new login to your account was detected from {deviceInfo} ({ipAddress})",
            Type = NotificationType.SystemAnnouncement,
            Priority = NotificationPriority.High,
            RelatedUrl = "/account/security"
        });
    }
}
