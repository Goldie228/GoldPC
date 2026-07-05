using GoldPC.Api.Services;
using GoldPC.Shared.Entities;
using GoldPC.Shared.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GoldPC.Api.Controllers;

/// <summary>
/// Контроллер управления уведомлениями пользователя (отметить прочитанным, удалить, настройки).
/// Уведомления отправляются через SignalR, этот контроллер обрабатывает CRUD операции.
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
    /// Получить уведомления для текущего пользователя
    /// </summary>
    /// <returns>A <see cref="Task"/> представляющий асинхронную операцию.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<Notification>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<Notification>>> GetMyNotifications(
        [FromQuery] bool unreadOnly = false,
        [FromQuery] int limit = 50)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(new { error = "Пользователь не аутентифицирован" });

        var notifications = await _notificationService.GetUserNotificationsAsync(userId.Value, unreadOnly, limit);
        return Ok(notifications);
    }

    /// <summary>
    /// Отметить одно уведомление как прочитанное
    /// </summary>
    /// <returns>A <see cref="Task"/> представляющий асинхронную операцию.</returns>
    [HttpPut("{id:guid}/read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        try
        {
            await _notificationService.MarkAsReadAsync(id);
            _logger.LogDebug("Уведомление {Id} отмечено как прочитанное", id);
            return Ok(new { message = "Уведомление отмечено как прочитанное" });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Не удалось отметить уведомление {Id} как прочитанное", id);
            return NotFound(new { error = "Уведомление не найдено" });
        }
#pragma warning disable CA1031 // Намеренный общий перехват для операции уведомления
        catch (Exception ex)
#pragma warning restore CA1031
        {
            _logger.LogWarning(ex, "Неожиданная ошибка при отметке уведомления {Id} как прочитанного", id);
            return NotFound(new { error = "Уведомление не найдено" });
        }
    }

    /// <summary>
    /// Отметить все уведомления как прочитанные для текущего пользователя
    /// </summary>
    /// <returns>A <see cref="Task"/> представляющий асинхронную операцию.</returns>
    [HttpPut("read-all")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(new { error = "Пользователь не аутентифицирован" });

        await _notificationService.MarkAllAsReadAsync(userId.Value);
        _logger.LogDebug("Все уведомления отмечены как прочитанные для пользователя {UserId}", userId);
        return Ok(new { message = "Все уведомления отмечены как прочитанные" });
    }

    /// <summary>
    /// Удалить уведомление
    /// </summary>
    /// <returns>A <see cref="Task"/> представляющий асинхронную операцию.</returns>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteNotification(Guid id)
    {
        try
        {
            await _notificationService.DeleteNotificationAsync(id);
            _logger.LogDebug("Уведомление {Id} удалено", id);
            return Ok(new { message = "Уведомление удалено" });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Не удалось удалить уведомление {Id}", id);
            return NotFound(new { error = "Уведомление не найдено" });
        }
#pragma warning disable CA1031 // Намеренный общий перехват для операции уведомления
        catch (Exception ex)
#pragma warning restore CA1031
        {
            _logger.LogWarning(ex, "Неожиданная ошибка при удалении уведомления {Id}", id);
            return NotFound(new { error = "Уведомление не найдено" });
        }
    }

    /// <summary>
    /// GET /api/v1/notifications/preferences — возвращает текущие настройки уведомлений пользователя.
    /// Все типы по умолчанию включены (true), если не настроены.
    /// </summary>
    /// <returns>A <see cref="Task"/> представляющий асинхронную операцию.</returns>
    [HttpGet("preferences")]
    [ProducesResponseType(typeof(UserNotificationPrefs), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserNotificationPrefs>> GetPreferences()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(new { error = "Пользователь не аутентифицирован" });

        var prefs = await _userPrefService.GetPreferencesAsync(userId.Value);
        return Ok(prefs);
    }

    /// <summary>
    /// PUT /api/v1/notifications/preferences — сохраняет настройки уведомлений пользователя.
    /// Принимает частичные обновления — будут изменены только указанные поля.
    /// </summary>
    /// <returns>A <see cref="Task"/> представляющий асинхронную операцию.</returns>
    [HttpPut("preferences")]
    [ProducesResponseType(typeof(UserNotificationPrefs), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserNotificationPrefs>> UpdatePreferences(
        [FromBody] UserNotificationPrefsUpdate update)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(new { error = "Пользователь не аутентифицирован" });

        var current = await _userPrefService.GetPreferencesAsync(userId.Value);

        // Слияние: переопределяем только явно указанные поля
        var merged = current with
        {
            OrderStatusChanged = update.OrderStatusChanged ?? current.OrderStatusChanged,
            LowStockAlert = update.LowStockAlert ?? current.LowStockAlert,
            LoginNotification = update.LoginNotification ?? current.LoginNotification,
            SystemAnnouncement = update.SystemAnnouncement ?? current.SystemAnnouncement,
            NewSupportMessage = update.NewSupportMessage ?? current.NewSupportMessage
        };

        var saved = await _userPrefService.SavePreferencesAsync(userId.Value, merged);
        _logger.LogInformation("Настройки уведомлений обновлены для пользователя {UserId}", userId);
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
