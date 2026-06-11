using System.Collections.Concurrent;
using GoldPC.Api.Controllers;
using GoldPC.Shared.Entities;
using GoldPC.Shared.Services;

namespace GoldPC.Api.Services;

/// <summary>
/// Checks notification preferences from admin settings (via IAdminService)
/// AND per-user preferences (via UserNotificationPreferenceService).
/// Caches admin settings for 60 seconds to avoid excessive file reads.
/// </summary>
public class NotificationPreferenceService : INotificationPreferenceService
{
    private readonly IAdminService _adminService;
    private readonly UserNotificationPreferenceService _userPrefService;
    private readonly ILogger<NotificationPreferenceService> _logger;

    private static readonly ConcurrentDictionary<string, (bool Value, DateTime CachedAt)> _cache = new();
    private static readonly TimeSpan CacheDuration = TimeSpan.FromSeconds(60);

    // Maps notification type strings to the corresponding SiteSettingsDto property
    private static readonly Dictionary<string, Func<SiteSettingsDto, bool>> SettingMap = new()
    {
        [nameof(NotificationType.OrderStatusChanged)] = s => s.OrderEmailNotifications,
        [nameof(NotificationType.LowStockAlert)] = s => s.LowStockNotifications,
        [nameof(NotificationType.RepairTicketUpdated)] = _ => true, // always enabled
        [nameof(NotificationType.NewSupportMessage)] = _ => true,   // always enabled
        [nameof(NotificationType.SystemAnnouncement)] = _ => true,  // always enabled
        [nameof(NotificationType.LoginNotification)] = s => s.LoginNotifications,
        [nameof(NotificationType.TaskAssigned)] = _ => true,        // always enabled
        [nameof(NotificationType.InventoryAlert)] = s => s.LowStockNotifications,
    };

    public NotificationPreferenceService(
        IAdminService adminService,
        UserNotificationPreferenceService userPrefService,
        ILogger<NotificationPreferenceService> logger)
    {
        _adminService = adminService;
        _userPrefService = userPrefService;
        _logger = logger;
    }

    /// <inheritdoc/>
    public async Task<bool> IsNotificationEnabledAsync(string notificationType)
    {
        if (!SettingMap.TryGetValue(notificationType, out var settingAccessor))
        {
            _logger.LogWarning("Unknown notification type: {Type}, defaulting to enabled", notificationType);
            return true; // unknown types default to enabled
        }

        // Check cache
        if (_cache.TryGetValue(notificationType, out var cached) &&
            DateTime.UtcNow - cached.CachedAt < CacheDuration)
        {
            return cached.Value;
        }

        try
        {
            var settings = await _adminService.GetSettingsAsync();
            var enabled = settingAccessor(settings);

            _cache[notificationType] = (enabled, DateTime.UtcNow);
            _logger.LogDebug("Notification {Type} enabled={Enabled}", notificationType, enabled);
            return enabled;
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to check notification preference for {Type}, defaulting to enabled", notificationType);
            return true;
        }
#pragma warning disable CA1031 // Intentional general catch for fail-open notification check
        catch (Exception ex)
#pragma warning restore CA1031
        {
            _logger.LogError(ex, "Unexpected error checking notification preference for {Type}, defaulting to enabled", notificationType);
            return true; // fail open — notifications still work if settings can't be read
        }
    }

    /// <inheritdoc/>
    public async Task<bool> IsUserOptedInAsync(Guid userId, string notificationType)
    {
        // First check global admin setting
        var globalEnabled = await IsNotificationEnabledAsync(notificationType);
        if (!globalEnabled)
            return false;

        // Then check per-user preference
        var userOptedIn = await _userPrefService.IsOptedInAsync(userId, notificationType);
        return userOptedIn;
    }

    /// <summary>
    /// Clear the entire cache. Called when admin settings are updated.
    /// </summary>
    public static void ClearCache()
    {
        _cache.Clear();
    }
}
