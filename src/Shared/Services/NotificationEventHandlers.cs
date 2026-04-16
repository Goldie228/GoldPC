using GoldPC.Shared.Authorization;
using GoldPC.Shared.Entities;

namespace GoldPC.Shared.Services;

/// <summary>
/// Event handlers for system events that trigger notifications
/// </summary>
public class NotificationEventHandlers
{
    private readonly INotificationService _notificationService;

    public NotificationEventHandlers(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    /// <summary>
    /// Handle order status change event
    /// </summary>
    public async Task OnOrderStatusChanged(Guid orderId, Guid customerId, string oldStatus, string newStatus)
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

        // Also notify managers about status changes
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
    /// Handle low stock alert event
    /// </summary>
    public async Task OnLowStockAlert(Guid productId, string productName, int currentStock, int threshold)
    {
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
    public async Task OnNewSupportMessage(Guid ticketId, Guid senderId, Guid recipientId, string message)
    {
        await _notificationService.SendNotificationAsync(new Notification
        {
            UserId = recipientId,
            Title = "New support message received",
            Message = message.Length > 100 ? message.Substring(0, 100) + "..." : message,
            Type = NotificationType.NewSupportMessage,
            Priority = NotificationPriority.Medium,
            RelatedUrl = $"/support/{ticketId}"
        });
    }
}
