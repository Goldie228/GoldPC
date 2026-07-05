using System.Collections.Concurrent;
using GoldPC.Api.Controllers;
using GoldPC.Shared.Entities;
using GoldPC.Shared.Services;

namespace GoldPC.Api.Services;

/// <summary>
/// Проверяет предпочтения уведомлений из настроек администратора (через IAdminService)
/// И предпочтения пользователя (через UserNotificationPreferenceService).
/// Кеширует настройки администратора на 60 секунд для избежания частого чтения файлов.
/// </summary>
public class NotificationPreferenceService : INotificationPreferenceService
{
    private readonly IAdminService _adminService;
    private readonly UserNotificationPreferenceService _userPrefService;
    private readonly ILogger<NotificationPreferenceService> _logger;

    private static readonly ConcurrentDictionary<string, (bool Value, DateTime CachedAt)> _cache = new();
    private static readonly TimeSpan CacheDuration = TimeSpan.FromSeconds(60);

    // Сопоставляет строки типов уведомлений с соответствующими свойствами SiteSettingsDto
    private static readonly Dictionary<string, Func<SiteSettingsDto, bool>> SettingMap = new()
    {
        [nameof(NotificationType.OrderStatusChanged)] = s => s.OrderEmailNotifications,
        [nameof(NotificationType.LowStockAlert)] = s => s.LowStockNotifications,
        [nameof(NotificationType.RepairTicketUpdated)] = _ => true, // всегда включено
        [nameof(NotificationType.NewSupportMessage)] = _ => true,   // всегда включено
        [nameof(NotificationType.SystemAnnouncement)] = _ => true,  // всегда включено
        [nameof(NotificationType.LoginNotification)] = s => s.LoginNotifications,
        [nameof(NotificationType.TaskAssigned)] = _ => true,        // всегда включено
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
            _logger.LogWarning("Неизвестный тип уведомления: {Type}, по умолчанию включено", notificationType);
            return true; // неизвестные типы по умолчанию включены
        }

        // Проверка кеша
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
            _logger.LogDebug("Уведомление {Type} включено={Enabled}", notificationType, enabled);
            return enabled;
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Не удалось проверить предпочтение уведомления для {Type}, по умолчанию включено", notificationType);
            return true;
        }
#pragma warning disable CA1031 // Намеренный общий перехват для fail-open проверки уведомлений
        catch (Exception ex)
#pragma warning restore CA1031
        {
            _logger.LogError(ex, "Неожиданная ошибка при проверке предпочтения уведомления для {Type}, по умолчанию включено", notificationType);
            return true; // fail open — уведомления продолжают работать, если настройки не могут быть прочитаны
        }
    }

    /// <inheritdoc/>
    public async Task<bool> IsUserOptedInAsync(Guid userId, string notificationType)
    {
        // Сначала проверяем глобальную настройку администратора
        var globalEnabled = await IsNotificationEnabledAsync(notificationType);
        if (!globalEnabled)
            return false;

        // Затем проверяем предпочтение пользователя
        var userOptedIn = await _userPrefService.IsOptedInAsync(userId, notificationType);
        return userOptedIn;
    }

    /// <summary>
    /// Очищает весь кеш. Вызывается при обновлении настроек администратора.
    /// </summary>
    public static void ClearCache()
    {
        _cache.Clear();
    }
}
