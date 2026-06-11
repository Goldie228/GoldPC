using GoldPC.Api.Services;
using GoldPC.Shared.Entities;
using GoldPC.Shared.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GoldPC.Api.Controllers;

/// <summary>
/// Controller for user notification management (mark read, delete, preferences).
/// Notifications are pushed via SignalR, this handles CRUD operations.
/// </summary>
[ApiController]
[Route("api/v1/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly UserNotificationPreferenceService _userPrefService;
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(
        INotificationService notificationService,
        UserNotificationPreferenceService userPrefService,
        ILogger<NotificationsController> logger)
    {
        _notificationService = notificationService;
        _userPrefService = userPrefService;
        _logger = logger;
    }

    /// <summary>
    /// Get notifications for the current user
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<Notification>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<Notification>>> GetMyNotifications(
        [FromQuery] bool unreadOnly = false,
        [FromQuery] int limit = 50)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(new { error = "User not authenticated" });

        var notifications = await _notificationService.GetUserNotificationsAsync(userId.Value, unreadOnly, limit);
        return Ok(notifications);
    }

    /// <summary>
    /// Mark a single notification as read
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpPut("{id:guid}/read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        try
        {
            await _notificationService.MarkAsReadAsync(id);
            _logger.LogDebug("Notification {Id} marked as read", id);
            return Ok(new { message = "Notification marked as read" });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Failed to mark notification {Id} as read", id);
            return NotFound(new { error = "Notification not found" });
        }
#pragma warning disable CA1031 // Intentional general catch for notification operation
        catch (Exception ex)
#pragma warning restore CA1031
        {
            _logger.LogWarning(ex, "Unexpected error marking notification {Id} as read", id);
            return NotFound(new { error = "Notification not found" });
        }
    }

    /// <summary>
    /// Mark all notifications as read for the current user
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpPut("read-all")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(new { error = "User not authenticated" });

        await _notificationService.MarkAllAsReadAsync(userId.Value);
        _logger.LogDebug("All notifications marked as read for user {UserId}", userId);
        return Ok(new { message = "All notifications marked as read" });
    }

    /// <summary>
    /// Delete a notification
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteNotification(Guid id)
    {
        try
        {
            await _notificationService.DeleteNotificationAsync(id);
            _logger.LogDebug("Notification {Id} deleted", id);
            return Ok(new { message = "Notification deleted" });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Failed to delete notification {Id}", id);
            return NotFound(new { error = "Notification not found" });
        }
#pragma warning disable CA1031 // Intentional general catch for notification operation
        catch (Exception ex)
#pragma warning restore CA1031
        {
            _logger.LogWarning(ex, "Unexpected error deleting notification {Id}", id);
            return NotFound(new { error = "Notification not found" });
        }
    }

    /// <summary>
    /// GET /api/v1/notifications/preferences — returns current user's notification preferences.
    /// All types default to true if not customized.
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpGet("preferences")]
    [ProducesResponseType(typeof(UserNotificationPrefs), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserNotificationPrefs>> GetPreferences()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(new { error = "User not authenticated" });

        var prefs = await _userPrefService.GetPreferencesAsync(userId.Value);
        return Ok(prefs);
    }

    /// <summary>
    /// PUT /api/v1/notifications/preferences — saves user's notification preferences.
    /// Accepts partial updates — only provided fields will be changed.
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpPut("preferences")]
    [ProducesResponseType(typeof(UserNotificationPrefs), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserNotificationPrefs>> UpdatePreferences(
        [FromBody] UserNotificationPrefsUpdate update)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(new { error = "User not authenticated" });

        var current = await _userPrefService.GetPreferencesAsync(userId.Value);

        // Merge: only override fields that were explicitly provided
        var merged = current with
        {
            OrderStatusChanged = update.OrderStatusChanged ?? current.OrderStatusChanged,
            LowStockAlert = update.LowStockAlert ?? current.LowStockAlert,
            LoginNotification = update.LoginNotification ?? current.LoginNotification,
            SystemAnnouncement = update.SystemAnnouncement ?? current.SystemAnnouncement,
            NewSupportMessage = update.NewSupportMessage ?? current.NewSupportMessage
        };

        var saved = await _userPrefService.SavePreferencesAsync(userId.Value, merged);
        _logger.LogInformation("Notification preferences updated for user {UserId}", userId);
        return Ok(saved);
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return null;
        return userId;
    }
}
