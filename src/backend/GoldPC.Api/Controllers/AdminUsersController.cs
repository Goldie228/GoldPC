using GoldPC.Api.Services;
using GoldPC.Shared.Authorization;
using GoldPC.Shared.Entities;
using GoldPC.Shared.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GoldPC.Api.Controllers;

/// <summary>Контроллер управления пользователями</summary>
[ApiController]
[Route("api/v1/admin/users")]
public class AdminUsersController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly INotificationService _notificationService;
    private readonly ILogger<AdminUsersController> _logger;

    public AdminUsersController(
        IAdminService adminService,
        INotificationService notificationService,
        ILogger<AdminUsersController> logger)
    {
        _adminService = adminService;
        _notificationService = notificationService;
        _logger = logger;
    }

    /// <summary>Получить IP-адрес клиента</summary>
    private string GetClientIp()
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        // За обратным прокси: X-Forwarded-For — инфраструктурный заголовок, не привязывается через model binding
#pragma warning disable S6932 // Use model binding instead of raw request data
        if (HttpContext.Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor))
#pragma warning restore S6932
        {
            var first = forwardedFor.FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(first))
                ip = first.Split(',')[0].Trim();
        }
        return ip ?? "";
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

    /// <summary>Получить список пользователей</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpGet]
    [Authorize(Policy = Permissions.UsersView)]
    [ProducesResponseType(typeof(PagedResult<UserDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<UserDto>>> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? role = null,
        [FromQuery] bool? isActive = null)
    {
        var result = await _adminService.GetUsersAsync(page, pageSize, search, role, isActive);
        return Ok(result);
    }

    /// <summary>Получить пользователя по ID</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpGet("{id:guid}")]
    [Authorize(Policy = Permissions.UsersView)]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> GetUserById(Guid id)
    {
        var user = await _adminService.GetUserByIdAsync(id);
        if (user == null) return NotFound(new { error = "Пользователь не найден" });
        return Ok(user);
    }

    /// <summary>Обновить пользователя</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = Permissions.UsersManage)]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> UpdateUser(Guid id, [FromBody] UpdateUserDto update)
    {
        var user = await _adminService.UpdateUserAsync(id, update);
        if (user == null) return NotFound(new { error = "Пользователь не найден" });
        var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";
        var currentUserName = User.Identity?.Name ?? "unknown";
        var currentUserEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "unknown";
        await _adminService.AddAuditLogAsync("USER_UPDATED", currentUserId, currentUserName, currentUserEmail,
            $"Обновлён пользователь {user.Email} ({user.FirstName} {user.LastName})", ipAddress: GetClientIp());
        return Ok(user);
    }

    /// <summary>Изменить роль пользователя</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpPatch("{id:guid}/role")]
    [Authorize(Policy = Permissions.UsersManageRoles)]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> UpdateUserRole(Guid id, [FromBody] UpdateRoleRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Role))
            return BadRequest(new { error = "Роль не может быть пустой" });

        var user = await _adminService.UpdateUserRoleAsync(id, request.Role);
        if (user == null) return NotFound(new { error = "Пользователь не найден" });
        var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";
        var currentUserName = User.Identity?.Name ?? "unknown";
        var currentUserEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "unknown";
        await _adminService.AddAuditLogAsync("USER_ROLE_CHANGED", currentUserId, currentUserName, currentUserEmail,
            $"Изменена роль пользователя {user.Email} на {request.Role}", "WARNING", ipAddress: GetClientIp());
        return Ok(user);
    }

    /// <summary>Деактивировать пользователя</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpPost("{id:guid}/deactivate")]
    [Authorize(Policy = Permissions.UsersManage)]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> DeactivateUser(Guid id)
    {
        try
        {
            var user = await _adminService.DeactivateUserAsync(id);
            if (user == null) return NotFound(new { error = "Пользователь не найден" });
            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";
            var currentUserName = User.Identity?.Name ?? "unknown";
            var currentUserEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "unknown";
            await _adminService.AddAuditLogAsync("USER_DELETED", currentUserId, currentUserName, currentUserEmail,
                $"Деактивирован пользователь {user.Email}", "WARNING", ipAddress: GetClientIp());
            await _notificationService.SendNotificationToRoleAsync("Admin", new Notification
            {
                UserId = GetCurrentUserId(),
                Title = "Деактивирован пользователь",
                Message = $"Деактивирован пользователь: {user.Email}",
                Type = NotificationType.UserUpdate,
                Priority = NotificationPriority.High,
                RelatedUrl = "/admin/users"
            });
            return Ok(user);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Активировать пользователя</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpPost("{id:guid}/activate")]
    [Authorize(Policy = Permissions.UsersManage)]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> ActivateUser(Guid id)
    {
        try
        {
            var user = await _adminService.ActivateUserAsync(id);
            if (user == null) return NotFound(new { error = "Пользователь не найден" });
            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";
            var currentUserName = User.Identity?.Name ?? "unknown";
            var currentUserEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "unknown";
            await _adminService.AddAuditLogAsync("USER_ACTIVATED", currentUserId, currentUserName, currentUserEmail,
                $"Активирован пользователь {user.Email}", ipAddress: GetClientIp());
            await _notificationService.SendNotificationToRoleAsync("Admin", new Notification
            {
                UserId = GetCurrentUserId(),
                Title = "Активирован пользователь",
                Message = $"Активирован пользователь: {user.Email}",
                Type = NotificationType.UserUpdate,
                Priority = NotificationPriority.Medium,
                RelatedUrl = "/admin/users"
            });
            return Ok(user);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Удалить пользователя (деактивация)</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = Permissions.UsersManage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var result = await _adminService.DeleteUserAsync(id);
        if (!result) return NotFound(new { error = "Пользователь не найден" });
        return NoContent();
    }

    /// <summary>Создать нового пользователя (администратором)</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpPost]
    [Authorize(Policy = Permissions.UsersManage)]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserDto create)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var user = await _adminService.CreateUserAsync(create);
            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";
            var currentUserName = User.Identity?.Name ?? "unknown";
            var currentUserEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "unknown";
            await _adminService.AddAuditLogAsync("USER_CREATED", currentUserId, currentUserName, currentUserEmail,
                $"Создан пользователь: {create.Email} (роль: {create.Role})", ipAddress: GetClientIp());
            await _notificationService.SendNotificationToRoleAsync("Admin", new Notification
            {
                UserId = GetCurrentUserId(),
                Title = "Создан пользователь",
                Message = $"Создан пользователь: {create.Email}",
                Type = NotificationType.UserUpdate,
                Priority = NotificationPriority.Medium,
                RelatedUrl = "/admin/users"
            });
            return CreatedAtAction(nameof(GetUserById), new { id = user.Id }, user);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Сбросить пароль пользователя (администратором)</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpPost("{id:guid}/reset-password")]
    [Authorize(Policy = Permissions.UsersManage)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> ResetUserPassword(Guid id, [FromBody] ResetPasswordDto reset)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _adminService.ResetUserPasswordAsync(id, reset);
        if (!result) return NotFound(new { error = "Пользователь не найден" });

        var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";
        var currentUserName = User.Identity?.Name ?? "unknown";
        var currentUserEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "unknown";
        await _adminService.AddAuditLogAsync("USER_UPDATED", currentUserId, currentUserName, currentUserEmail,
            $"Сброшен пароль пользователя {id}", ipAddress: GetClientIp());
        return Ok(new { message = "Пароль успешно сброшен" });
    }
}
