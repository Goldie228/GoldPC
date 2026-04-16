using GoldPC.Shared.Authorization;

namespace GoldPC.Shared.Entities;

/// <summary>
/// Represents a system notification for users
/// </summary>
public class Notification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public NotificationPriority Priority { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
    public string? RelatedUrl { get; set; }
    public string? Metadata { get; set; }
}

/// <summary>
/// Type of notification
/// </summary>
public enum NotificationType
{
    OrderStatusChanged,
    RepairTicketUpdated,
    LowStockAlert,
    NewSupportMessage,
    SystemAnnouncement,
    TaskAssigned,
    InventoryAlert
}

/// <summary>
/// Priority level for notification
/// </summary>
public enum NotificationPriority
{
    Low,
    Medium,
    High,
    Critical
}
