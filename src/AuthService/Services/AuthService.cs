using GoldPC.AuthService.Data;
using GoldPC.AuthService.Entities;
using GoldPC.SharedKernel.DTOs;
using GoldPC.SharedKernel.Enums;
using GoldPC.SharedKernel.Utilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GoldPC.AuthService.Services;

/// <summary>
/// Сервис аутентификации
/// </summary>
public class AuthService : IAuthService
{
    private readonly AuthDbContext _context;
    private readonly IJwtService _jwtService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;
    private const int MaxFailedAttempts = 5;
    private const int LockoutMinutes = 15;
    private const int RefreshTokenExpirationDays = 7;

    public AuthService(AuthDbContext context, IJwtService jwtService, IConfiguration configuration, ILogger<AuthService> logger)
    {
        _context = context;
        _jwtService = jwtService;
        _configuration = configuration;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<(AuthResponse? Response, string? Error)> RegisterAsync(RegisterRequest request)
    {
        if (await _context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower()))
        {
            return (null, "Пользователь с таким email уже существует");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 12),
            FirstName = StringSanitizer.SanitizeText(request.FirstName),
            Phone = StringSanitizer.SanitizeText(request.Phone),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var accessToken = _jwtService.GenerateAccessToken(user);
        var refreshToken = await CreateRefreshTokenAsync(user.Id, null);

        return (new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken.Token,
            ExpiresIn = 900,
            User = MapToUserDto(user)
        }, null);
    }

    /// <inheritdoc />
    public async Task<(AuthResponse? Response, string? Error)> LoginAsync(LoginRequest request, string ipAddress)
    {
        try
        {
            var user = await _context.Users
                .Include(u => u.RefreshTokens)
                .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());


            if (user == null)
            {
                return (null, "Неверные учётные данные");
            }

            if (user.LockedUntil.HasValue && user.LockedUntil.Value > DateTime.UtcNow)
            {
                var remainingMinutes = (int)(user.LockedUntil.Value - DateTime.UtcNow).TotalMinutes;
                return (null, $"Учётная запись заблокирована. Попробуйте через {remainingMinutes} минут");
            }

            if (!user.IsActive)
            {
                return (null, "Учётная запись деактивирована");
            }

            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                user.FailedLoginAttempts++;

                if (user.FailedLoginAttempts >= MaxFailedAttempts)
                {
                    user.LockedUntil = DateTime.UtcNow.AddMinutes(LockoutMinutes);
                    await _context.SaveChangesAsync();
                    return (null, $"Превышено количество попыток входа. Учётная запись заблокирована на {LockoutMinutes} минут");
                }

                await _context.SaveChangesAsync();
                return (null, "Неверные учётные данные");
            }

            user.FailedLoginAttempts = 0;
            user.LockedUntil = null;
            user.UpdatedAt = DateTime.UtcNow;

            var accessToken = _jwtService.GenerateAccessToken(user);
            var refreshToken = await CreateRefreshTokenAsync(user.Id, ipAddress);

            return (new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken.Token,
                ExpiresIn = 900,
                User = MapToUserDto(user)
            }, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Критическая ошибка при входе пользователя {Email}", request.Email);
            return (null, "Произошла ошибка при входе в систему. Пожалуйста, попробуйте позже.");
        }
    }

    /// <inheritdoc />
    public async Task<(AuthResponse? Response, string? Error)> RefreshTokenAsync(string token, string ipAddress)
    {
        var refreshToken = await _context.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == token);

        if (refreshToken == null || !refreshToken.IsActive)
        {
            return (null, "Недействительный refresh токен");
        }

        refreshToken.RevokedAt = DateTime.UtcNow;
        refreshToken.RevokedByIp = ipAddress;
        refreshToken.RevokedReason = "Replaced by new token";

        var newRefreshToken = await CreateRefreshTokenAsync(refreshToken.UserId, ipAddress);
        var accessToken = _jwtService.GenerateAccessToken(refreshToken.User);

        return (new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = newRefreshToken.Token,
            ExpiresIn = 900,
            User = MapToUserDto(refreshToken.User)
        }, null);
    }

    /// <inheritdoc />
    public async Task LogoutAsync(Guid userId, string token, string ipAddress)
    {
        var refreshToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == token && rt.UserId == userId);

        if (refreshToken != null)
        {
            refreshToken.RevokedAt = DateTime.UtcNow;
            refreshToken.RevokedByIp = ipAddress;
            refreshToken.RevokedReason = "Logged out";
            await _context.SaveChangesAsync();
        }
    }

    /// <inheritdoc />
    public async Task<UserDto?> GetUserByIdAsync(Guid id)
    {
        var user = await _context.Users.FindAsync(id);
        return user != null ? MapToUserDto(user) : null;
    }

    /// <inheritdoc />
    public async Task<UserDto?> GetUserByEmailAsync(string email)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
        return user != null ? MapToUserDto(user) : null;
    }

    /// <inheritdoc />
    public async Task<(UserDto? User, string? Error)> UpdateUserAsync(Guid id, UpdateUserRequest request)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return (null, "Пользователь не найден");
        }

        if (request.FirstName != null)
            user.FirstName = StringSanitizer.SanitizeText(request.FirstName);
        if (request.LastName != null)
            user.LastName = StringSanitizer.SanitizeText(request.LastName);
        if (request.Phone != null)
            user.Phone = StringSanitizer.SanitizeText(request.Phone);

        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return (MapToUserDto(user), null);
    }

    /// <inheritdoc />
    public async Task<(bool Success, string? Error)> ChangePasswordAsync(Guid id, ChangePasswordRequest request)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return (false, "Пользователь не найден");
        }

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
        {
            return (false, "Неверный текущий пароль");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword, workFactor: 12);
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return (true, null);
    }

    private async Task<RefreshToken> CreateRefreshTokenAsync(Guid userId, string? ipAddress)
    {
        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Token = _jwtService.GenerateRefreshToken(),
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(RefreshTokenExpirationDays),
            CreatedByIp = ipAddress
        };

        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();
        return refreshToken;
    }

    private static UserDto MapToUserDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            Role = user.Role,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Phone = user.Phone,
            IsActive = user.IsActive
        };
    }
}