using GoldPC.Api.Services;
using GoldPC.Shared.Authorization;
using GoldPC.Shared.Entities;
using GoldPC.Shared.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace GoldPC.Api.Controllers;

/// <summary>Контроллер управления настройками сайта</summary>
[ApiController]
[Route("api/v1/admin/settings")]
public class AdminSettingsController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly INotificationService _notificationService;
    private readonly ILogger<AdminSettingsController> _logger;
    private readonly IHubContext<Hubs.NotificationHub> _hubContext;

    public AdminSettingsController(
        IAdminService adminService,
        INotificationService notificationService,
        ILogger<AdminSettingsController> logger,
        IHubContext<Hubs.NotificationHub> hubContext)
    {
        _adminService = adminService;
        _notificationService = notificationService;
        _logger = logger;
        _hubContext = hubContext;
    }

    /// <summary>Получить ID текущего пользователя из JWT-токена</summary>
    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        Guid.TryParse(claim, out var userId);
        return userId;
    }

    // ====================================================================
    // Эндпоинты
    // ====================================================================

    /// <summary>Получить публичные настройки сайта (без авторизации, с кешированием)</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpGet("public")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PublicSiteSettingsDto), StatusCodes.Status200OK)]
    [ResponseCache(Duration = 60, Location = ResponseCacheLocation.Any)]
    public async Task<ActionResult<PublicSiteSettingsDto>> GetPublicSettings()
    {
        var settings = await _adminService.GetSettingsAsync();
        return Ok(MapToPublic(settings));
    }

    /// <summary>Получить настройки сайта (только для администрирования)</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpGet]
    [Authorize(Policy = Permissions.UsersManage)]
    [ProducesResponseType(typeof(SiteSettingsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SiteSettingsDto>> GetSettings()
    {
        var settings = await _adminService.GetSettingsAsync();
        return Ok(settings);
    }

    /// <summary>Обновить настройки сайта</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpPut]
    [Authorize(Policy = Permissions.UsersManage)]
    [ProducesResponseType(typeof(SiteSettingsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SiteSettingsDto>> UpdateSettings([FromBody] UpdateSiteSettingsDto update)
    {
        // Сохраняем старое значение MaintenanceMode перед обновлением
        var oldSettings = await _adminService.GetSettingsAsync();
        var wasMaintenance = oldSettings.MaintenanceMode;

        var settings = await _adminService.UpdateSettingsAsync(update);
        var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";
        var currentUserName = User.Identity?.Name ?? "unknown";
        var currentUserEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "unknown";
        await _adminService.AddAuditLogAsync("SETTINGS_UPDATED", currentUserId, currentUserName, currentUserEmail,
            "Обновлены настройки сайта", "WARNING");

        // Логируем отдельные аудит-события при изменении режима обслуживания
        if (update.MaintenanceMode.HasValue && update.MaintenanceMode.Value != wasMaintenance)
        {
            var action = update.MaintenanceMode.Value ? "MAINTENANCE_MODE_ENABLED" : "MAINTENANCE_MODE_DISABLED";
            var desc = update.MaintenanceMode.Value
                ? "Режим обслуживания включён"
                : "Режим обслуживания выключен";
            await _adminService.AddAuditLogAsync(action, currentUserId, currentUserName, currentUserEmail,
                desc, "WARNING");
        }

        // Очищаем кэш настроек уведомлений, чтобы изменения вступили в силу немедленно
        NotificationPreferenceService.ClearCache();

        await _notificationService.SendNotificationToRoleAsync("Admin", new Notification
        {
            UserId = GetCurrentUserId(),
            Title = "Обновлены настройки системы",
            Message = "Обновлены настройки системы",
            Type = NotificationType.SettingsUpdate,
            Priority = NotificationPriority.Medium,
            RelatedUrl = "/admin/settings"
        });

        // Рассылаем broadcast об обновлении настроек всем подключённым SignalR клиентам
        var publicSettings = MapToPublic(settings);
        await _hubContext.Clients.All.SendAsync("SettingsUpdated", publicSettings);

        return Ok(settings);
    }

    /// <summary>Сбросить настройки сайта к значениям по умолчанию</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpPost("reset")]
    [Authorize(Policy = Permissions.UsersManage)]
    [ProducesResponseType(typeof(SiteSettingsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SiteSettingsDto>> ResetSettings()
    {
        var settings = await _adminService.ResetSettingsAsync();
        return Ok(settings);
    }

    // ====================================================================
    // Маппинг: полные настройки → публичные (безопасные) настройки
    // ====================================================================
    private static PublicSiteSettingsDto MapToPublic(SiteSettingsDto settings) => new()
    {
        SiteName = settings.SiteName,
        StoreAddress = settings.StoreAddress,
        Phone = settings.Phone,
        WorkingHours = settings.WorkingHours,
        FreeDeliveryThreshold = settings.FreeDeliveryThreshold,
        DeliveryCost = settings.DeliveryCost,
        DeliveryTime = settings.DeliveryTime
    };
}
