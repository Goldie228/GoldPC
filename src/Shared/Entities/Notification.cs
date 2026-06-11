using GoldPC.Shared.Authorization;

#pragma warning disable CA1716 // Namespace conflicts with reserved word 'Shared'
namespace GoldPC.Shared.Entities;
#pragma warning restore CA1716

/// <summary>
/// Represents a system notification for users
/// </summary>
public class Notification
{
    /// <summary>Gets or sets the unique notification identifier.</summary>
    public Guid Id { get; set; }

    /// <summary>Gets or sets the identifier of the user this notification belongs to.</summary>
    public Guid UserId { get; set; }

    /// <summary>Gets or sets the notification title.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Gets or sets the notification body text.</summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>Gets or sets the notification type.</summary>
    public NotificationType Type { get; set; }

    /// <summary>Gets or sets the notification priority level.</summary>
    public NotificationPriority Priority { get; set; }

    /// <summary>Gets or sets a value indicating whether the notification has been read.</summary>
    public bool IsRead { get; set; }

    /// <summary>Gets or sets the date and time when the notification was created.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>Gets or sets the date and time when the notification was read.</summary>
    public DateTime? ReadAt { get; set; }

    /// <summary>Gets or sets an optional URL related to the notification.</summary>
    public string? RelatedUrl { get; set; }

    /// <summary>Gets or sets optional JSON metadata for the notification.</summary>
    public string? Metadata { get; set; }
}

/// <summary>
/// Type of notification
/// </summary>
public enum NotificationType
{
    /// <summary>Notification about an order status change.</summary>
    OrderStatusChanged,

    /// <summary>Notification about a repair ticket update.</summary>
    RepairTicketUpdated,

    /// <summary>Alert for low stock levels.</summary>
    LowStockAlert,

    /// <summary>Notification about a user login.</summary>
    LoginNotification,

    /// <summary>Notification about a new support message.</summary>
    NewSupportMessage,

    /// <summary>System-wide announcement.</summary>
    SystemAnnouncement,

    /// <summary>Notification that a task has been assigned.</summary>
    TaskAssigned,

    /// <summary>Alert for inventory changes.</summary>
    InventoryAlert,

    /// <summary>Notification about a product update.</summary>
    ProductUpdate,

    /// <summary>Notification about a user profile update.</summary>
    UserUpdate,

    /// <summary>Notification about settings changes.</summary>
    SettingsUpdate,
}

/// <summary>
/// Priority level for notification
/// </summary>
public enum NotificationPriority
{
    /// <summary>Low priority notification.</summary>
    Low,

    /// <summary>Medium priority notification.</summary>
    Medium,

    /// <summary>High priority notification.</summary>
    High,

    /// <summary>Critical priority notification.</summary>
    Critical,
}
