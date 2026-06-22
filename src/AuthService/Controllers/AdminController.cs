#pragma warning disable CA1031, CS1591, SA1600
using GoldPC.AuthService.Data;
using GoldPC.AuthService.Entities;
using GoldPC.AuthService.Services;
using GoldPC.Shared.Services;
using GoldPC.SharedKernel.DTOs;
using GoldPC.SharedKernel.Enums;
using GoldPC.SharedKernel.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace GoldPC.AuthService.Controllers;

/// <summary>Запрос на обновление настройки TwoFactorRequired</summary>
public class TwoFactorSettingRequest
{
    public bool Enabled { get; set; }
}

/// <summary>Запрос на создание пользователя администратором</summary>
public class AdminCreateUserRequest
{
    [Required(ErrorMessage = "Имя обязательно")]
    [StringLength(100, MinimumLength = 1)]
    public string FirstName { get; init; } = string.Empty;

    [Required(ErrorMessage = "Фамилия обязательна")]
    [StringLength(100, MinimumLength = 1)]
    public string LastName { get; init; } = string.Empty;

    [Required(ErrorMessage = "Email обязателен")]
    [EmailAddress(ErrorMessage = "Некорректный формат email")]
    public string Email { get; init; } = string.Empty;

    [Required(ErrorMessage = "Пароль обязателен")]
    [MinLength(8, ErrorMessage = "Пароль должен содержать минимум 8 символов")]
    public string Password { get; init; } = string.Empty;

    [Required(ErrorMessage = "Роль обязательна")]
    public string Role { get; init; } = "Client";
}

/// <summary>Запрос на сброс пароля администратором</summary>
public class AdminResetPasswordRequest
{
    [Required(ErrorMessage = "Новый пароль обязателен")]
    [MinLength(8, ErrorMessage = "Пароль должен содержать минимум 8 символов")]
    public string NewPassword { get; init; } = string.Empty;
}

/// <summary>
/// Контроллер административных операций AuthService.
/// Используется GoldPC.Api gateway для управления пользователями.
/// Защищён: требует JWT с ролью Admin (даже за gateway — defense in depth).
/// </summary>
[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/v1/auth/admin")]
public class AdminController : ControllerBase
{
    private readonly AuthDbContext _context;
    private readonly ILogger<AdminController> _logger;
    private readonly TwoFactorSettingsService _twoFactorSettings;
    private readonly IEncryptionService _encryption;

    public AdminController(
        AuthDbContext context,
        ILogger<AdminController> logger,
        TwoFactorSettingsService twoFactorSettings,
        IEncryptionService encryption)
    {
        _context = context;
        _logger = logger;
        _twoFactorSettings = twoFactorSettings;
        _encryption = encryption;
    }

    /// <summary>Создать пользователя (администратором)</summary>
    [HttpPost("users")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UserDto>> CreateUser([FromBody] AdminCreateUserRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Проверка дубликата email по EmailHash
        var emailHash = _encryption.ComputeHash(request.Email.ToLower().Trim());
        if (await _context.Users.AnyAsync(u => u.EmailHash == emailHash))
            return BadRequest(new { error = "Пользователь с таким email уже существует" });

        var role = Enum.TryParse<UserRole>(request.Role, ignoreCase: true, out var parsedRole)
            ? parsedRole
            : UserRole.Client;

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = _encryption.Encrypt(request.Email.ToLower().Trim()),
            EmailHash = emailHash,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 12),
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Role = role,
            Roles = new List<UserRole> { role },
            IsActive = true,
            IsEmailVerified = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Admin created user {UserId} with role {Role}", user.Id, role);

        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, MapToUserDto(user));
    }

    /// <summary>Список пользователей с пагинацией, поиском и фильтром по роли</summary>
    [HttpGet("users")]
    [ProducesResponseType(typeof(GoldPC.SharedKernel.Models.PagedResult<UserDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<GoldPC.SharedKernel.Models.PagedResult<UserDto>>> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? role = null)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.Users.AsNoTracking();

        // Поиск по EmailHash (хеш в открытом виде) или по имени/фамилии
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(u =>
                u.EmailHash != null && u.EmailHash.Contains(term) ||
                u.FirstName.ToLower().Contains(term) ||
                u.LastName.ToLower().Contains(term));
        }

        // Фильтр по роли
        if (!string.IsNullOrWhiteSpace(role) && Enum.TryParse<UserRole>(role, ignoreCase: true, out var parsedRole))
        {
            query = query.Where(u => u.Roles.Contains(parsedRole));
        }

        var totalCount = await query.CountAsync();
        var users = await query
            .OrderBy(u => u.LastName)
            .ThenBy(u => u.FirstName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new GoldPC.SharedKernel.Models.PagedResult<UserDto>
        {
            Items = users.Select(MapToUserDto).ToList(),
            TotalCount = totalCount,
            PageNumber = page,
            PageSize = pageSize
        });
    }

    /// <summary>Получить пользователя по ID (для CreatedAtAction redirect)</summary>
    [HttpGet("users/{id:guid}")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> GetUser(Guid id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            return NotFound(new { error = "Пользователь не найден" });

        return Ok(MapToUserDto(user));
    }

    /// <summary>Сбросить пароль пользователя (администратором)</summary>
    [HttpPost("users/{id:guid}/reset-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> ResetUserPassword(Guid id, [FromBody] AdminResetPasswordRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = await _context.Users
            .Include(u => u.RefreshTokens)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
            return NotFound(new { error = "Пользователь не найден" });

        // Хешируем и устанавливаем новый пароль
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword, workFactor: 12);
        user.UpdatedAt = DateTime.UtcNow;

        // Отзываем все активные refresh-токены (защита от угона сессии)
        foreach (var rt in user.RefreshTokens.Where(rt => rt.RevokedAt == null))
        {
            rt.RevokedAt = DateTime.UtcNow;
            rt.RevokedByIp = HttpContext.Connection.RemoteIpAddress?.ToString();
            rt.RevokedReason = "Password reset by admin";
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Admin reset password for user {UserId}", id);
        return Ok(new { success = true });
    }

    /// <summary>Деактивировать пользователя</summary>
    [HttpPost("users/{id:guid}/deactivate")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeactivateUser(Guid id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            return NotFound(new { error = "Пользователь не найден" });

        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Admin deactivated user {UserId}", id);
        return Ok(new { success = true });
    }

    /// <summary>Активировать пользователя</summary>
    [HttpPost("users/{id:guid}/activate")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> ActivateUser(Guid id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            return NotFound(new { error = "Пользователь не найден" });

        user.IsActive = true;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Admin activated user {UserId}", id);
        return Ok(new { success = true });
    }

    /// <summary>Обновить настройку TwoFactorRequired для AuthService.</summary>
    [HttpPost("settings/two-factor")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult SetTwoFactorRequired([FromBody] TwoFactorSettingRequest request)
    {
        _twoFactorSettings.SetTwoFactorRequired(request.Enabled);
        _logger.LogInformation("TwoFactorRequired setting updated to {Enabled} by admin", request.Enabled);
        return Ok(new { success = true, enabled = request.Enabled });
    }

    /// <summary>Удалить пользователя (физическое удаление из БД)</summary>
    [HttpDelete("users/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteUser(Guid id)
    {
        var user = await _context.Users
            .Include(u => u.RefreshTokens)
            .Include(u => u.WishlistItems)
            .Include(u => u.Addresses) // Навигационное свойство User.Addresses → UserAddresses
            .Include(u => u.PasswordResetTokens)
            .Include(u => u.EmailVerificationTokens)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
            return NotFound(new { error = "Пользователь не найден" });

        var emailHash = user.EmailHash;

        // Удаляем связанные сущности
        _context.RefreshTokens.RemoveRange(user.RefreshTokens);
        _context.WishlistItems.RemoveRange(user.WishlistItems);
        _context.UserAddresses.RemoveRange(user.Addresses);
        _context.PasswordResetTokens.RemoveRange(user.PasswordResetTokens);
        _context.EmailVerificationTokens.RemoveRange(user.EmailVerificationTokens);

        var loginHistories = await _context.LoginHistories
            .Where(h => h.UserId == id)
            .ToListAsync();
        _context.LoginHistories.RemoveRange(loginHistories);

        var notificationPrefs = await _context.NotificationPreferences
            .Where(p => p.UserId == id)
            .ToListAsync();
        _context.NotificationPreferences.RemoveRange(notificationPrefs);

        var twoFactors = await _context.UserTwoFactors
            .Where(t => t.UserId == id)
            .ToListAsync();
        _context.UserTwoFactors.RemoveRange(twoFactors);

        // Удаляем пользователя
        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Admin deleted user {UserId}", id);
        return Ok(new { success = true });
    }

    private UserDto MapToUserDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Email = _encryption.Decrypt(user.Email),
            Role = user.Role,
            Roles = user.Roles,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Phone = _encryption.Decrypt(user.Phone),
            IsActive = user.IsActive,
            IsEmailVerified = user.IsEmailVerified,
            BirthDate = user.BirthDate,
            Company = user.Company
        };
    }
}
#pragma warning restore CA1031, CS1591, SA1600
