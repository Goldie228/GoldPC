#pragma warning disable CS1591, SA1600
// Copyright (c) GoldPC. All rights reserved.

// CA1724: Имя класса AuthService конфликтует с именем пространства имён GoldPC.AuthService.
// Это осознанный выбор — сервис аутентификации размещён в одноимённом пространстве имён.
#pragma warning disable CA1724

using System.Security.Cryptography;
using System.Text;
using GoldPC.AuthService.Data;
using GoldPC.AuthService.Entities;
using GoldPC.AuthService.Infrastructure;
using GoldPC.Shared.Services;
using GoldPC.Shared.Services.Implementations;
using GoldPC.SharedKernel.DTOs;
using GoldPC.SharedKernel.Enums;
using GoldPC.SharedKernel.Utilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GoldPC.AuthService.Services;

/// <summary>
/// Сервис аутентификации — фасад, делегирующий подзадачи специализированным сервисам.
/// Основная ответственность: регистрация, вход, JWT, refresh-токены, email-верификация.
/// </summary>
public class AuthService : IAuthService
{
    private readonly AuthDbContext _context;
    private readonly IJwtService _jwtService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;
    private readonly SmtpEmailService _emailService;
    private readonly ITokenCache _tokenCache;
    private readonly TwoFactorSettingsService _twoFactorSettings;
    private readonly IEncryptionService _encryption;
    private readonly TOTPService _totpService;
    private readonly PasswordService _passwordService;
    private readonly AvatarService _avatarService;

    private const int MaxFailedAttempts = 5;
    private const int LockoutMinutes = 15;
    private const int RefreshTokenExpirationDays = 30;
    private const int PasswordResetTokenExpirationHours = 1;
    private const int EmailVerificationTokenExpirationHours = 24;
    private const int TOTPStepSeconds = 30;
    private const int TOTPDigits = 6;
    private const int TwoFactorLoginTokenExpirationMinutes = 5;

    public AuthService(
        AuthDbContext context,
        IJwtService jwtService,
        IConfiguration configuration,
        ILogger<AuthService> logger,
        SmtpEmailService emailService,
        ITokenCache tokenCache,
        TwoFactorSettingsService twoFactorSettings,
        IEncryptionService encryption,
        TOTPService totpService,
        PasswordService passwordService,
        AvatarService avatarService)
    {
        _context = context;
        _jwtService = jwtService;
        _configuration = configuration;
        _logger = logger;
        _emailService = emailService;
        _tokenCache = tokenCache;
        _twoFactorSettings = twoFactorSettings;
        _encryption = encryption;
        _totpService = totpService;
        _passwordService = passwordService;
        _avatarService = avatarService;
    }

    /// <inheritdoc />
    public async Task<(AuthResponse? Response, string? Error)> RegisterAsync(RegisterRequest request)
    {
        var emailHash = _encryption.ComputeHash(request.Email.ToLower());
        if (await _context.Users.AnyAsync(u => u.EmailHash == emailHash))
        {
            return (null, "Пользователь с таким email уже существует");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = _encryption.Encrypt(request.Email.ToLower()),
            EmailHash = emailHash,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 12),
            FirstName = StringSanitizer.SanitizeText(request.FirstName),
            LastName = request.LastName != null ? StringSanitizer.SanitizeText(request.LastName) : string.Empty,
            Phone = _encryption.Encrypt(StringSanitizer.SanitizeText(request.Phone)),
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
    public async Task<(AuthResponse? Response, string? Error)> LoginAsync(LoginRequest request, string ipAddress, string userAgent)
    {
        try
        {
            var emailHash = _encryption.ComputeHash(request.Email.ToLower());
            var user = await _context.Users
                .Include(u => u.RefreshTokens)
                .FirstOrDefaultAsync(u => u.EmailHash == emailHash);

            user ??= await _context.Users
                .Include(u => u.RefreshTokens)
                .FirstOrDefaultAsync(u => u.Email == request.Email.ToLower());

            if (user == null)
                return (null, "Неверные учётные данные");

            if (user.LockedUntil.HasValue && user.LockedUntil.Value > DateTime.UtcNow)
            {
                var remainingMinutes = (int)(user.LockedUntil.Value - DateTime.UtcNow).TotalMinutes;
                return (null, $"Учётная запись заблокирована. Попробуйте через {remainingMinutes} минут");
            }

            if (!user.IsActive)
                return (null, "Учётная запись деактивирована");

            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                user.FailedLoginAttempts++;

                var failedLoginHistory = new LoginHistory
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    IpAddress = ipAddress,
                    UserAgent = userAgent,
                    Timestamp = DateTime.UtcNow,
                    Success = false,
                    FailureReason = "Неверный пароль"
                };
                _context.LoginHistories.Add(failedLoginHistory);

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

            var isPrivilegedRole = user.Roles.Any(r => r is UserRole.Admin or UserRole.Manager);
            if (isPrivilegedRole && _twoFactorSettings.IsTwoFactorRequired)
            {
                var twoFactorRecord = await _context.UserTwoFactors
                    .FirstOrDefaultAsync(t => t.UserId == user.Id && t.IsEnabled);

                if (twoFactorRecord == null)
                {
                    _logger.LogWarning("Force2FA: user {Email} ({Role}) has no 2FA configured", _encryption.Decrypt(user.Email), user.Role);
                    return (null, "Для входа требуется двухфакторная аутентификация. Настройте 2FA в личном кабинете.");
                }

                var tokenBytes = RandomNumberGenerator.GetBytes(32);
                var plainToken = Convert.ToHexString(tokenBytes).ToLowerInvariant();
                var tokenHash = TOTPService.ComputeSha256Hash(plainToken);

                await _tokenCache.StoreTokenAsync(
                    tokenHash,
                    user.Id,
                    TimeSpan.FromMinutes(TwoFactorLoginTokenExpirationMinutes));

                _logger.LogInformation("Force2FA: 2FA challenge issued for user {Email}", _encryption.Decrypt(user.Email));

                return (new AuthResponse
                {
                    RequiresTwoFactor = true,
                    TwoFactorToken = plainToken,
                    ExpiresIn = TwoFactorLoginTokenExpirationMinutes * 60,
                    User = MapToUserDto(user)
                }, null);
            }

            var accessToken = _jwtService.GenerateAccessToken(user);
            var refreshToken = await CreateRefreshTokenAsync(user.Id, ipAddress);

            var loginHistory = new LoginHistory
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                IpAddress = ipAddress,
                UserAgent = userAgent,
                Timestamp = DateTime.UtcNow,
                Success = true
            };
            _context.LoginHistories.Add(loginHistory);
            await _context.SaveChangesAsync();

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
            return (null, "Недействительный refresh токен");

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
        var emailHash = _encryption.ComputeHash(email.ToLower());
        var user = await _context.Users.FirstOrDefaultAsync(u => u.EmailHash == emailHash);
        user ??= await _context.Users.FirstOrDefaultAsync(u => u.Email == email.ToLower());
        return user != null ? MapToUserDto(user) : null;
    }

    /// <inheritdoc />
    public async Task<(UserDto? User, string? Error)> UpdateUserAsync(Guid id, UpdateUserRequest request)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            return (null, "Пользователь не найден");

        if (request.FirstName != null)
            user.FirstName = StringSanitizer.SanitizeText(request.FirstName);
        if (request.LastName != null)
            user.LastName = StringSanitizer.SanitizeText(request.LastName);
        if (request.Phone != null)
            user.Phone = _encryption.Encrypt(StringSanitizer.SanitizeText(request.Phone));
        if (request.BirthDate != null)
            user.BirthDate = request.BirthDate;
        if (request.Company != null)
            user.Company = request.Company;

        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return (MapToUserDto(user), null);
    }

    // ─── Делегирование: пароли ───

    /// <inheritdoc />
    public Task<(bool Success, string? Error)> ChangePasswordAsync(Guid id, ChangePasswordRequest request)
        => _passwordService.ChangePasswordAsync(id, request);

    /// <inheritdoc />
    public Task<(bool Success, string? Error)> ForgotPasswordAsync(string email, string requestScheme, string requestHost)
        => _passwordService.ForgotPasswordAsync(email, requestScheme, requestHost);

    /// <inheritdoc />
    public Task<(bool Success, string? Error)> ResetPasswordAsync(string token, string newPassword, string ipAddress)
        => _passwordService.ResetPasswordAsync(token, newPassword, ipAddress);

    /// <inheritdoc />
    public Task<(bool Valid, string? Error)> ValidateResetTokenAsync(string token)
        => _passwordService.ValidateResetTokenAsync(token);

    // ─── Делегирование: email-верификация ───

    /// <inheritdoc />
    public async Task<(bool Success, string? Error)> SendVerificationEmailAsync(Guid userId, string requestScheme, string requestHost)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return (false, "Пользователь не найден");

            if (user.IsEmailVerified)
            {
                _logger.LogInformation("Verification email requested for already verified user: {UserId}", userId);
                return (true, null);
            }

            return await CreateAndSendVerificationEmailAsync(user, requestScheme, requestHost);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in SendVerificationEmailAsync for user {UserId}", userId);
            return (false, "Произошла ошибка при отправке письма. Попробуйте позже.");
        }
    }

    /// <inheritdoc />
    public async Task<(bool Success, string? Error)> VerifyEmailAsync(string token, string ipAddress)
    {
        try
        {
            var tokenHash = TOTPService.ComputeSha256Hash(token);

            var verificationToken = await _context.EmailVerificationTokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.TokenHash == tokenHash);

            if (verificationToken is null)
                return (false, "Ссылка для подтверждения email недействительна или уже была использована.");

            if (!verificationToken.IsValid)
                return (false, "Ссылка для подтверждения email истекла или уже была использована. Запросите новую ссылку.");

            var user = verificationToken.User;
            if (!user.IsActive)
                return (false, "Учётная запись деактивирована.");

            user.IsEmailVerified = true;
            user.UpdatedAt = DateTime.UtcNow;

            verificationToken.UsedAt = DateTime.UtcNow;
            verificationToken.UsedByIp = ipAddress;

            var otherTokens = await _context.EmailVerificationTokens
                .Where(t => t.UserId == user.Id && t.Id != verificationToken.Id && t.UsedAt == null && t.ExpiresAt > DateTime.UtcNow)
                .ToListAsync();

            foreach (var t in otherTokens)
                t.UsedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            _logger.LogInformation("Email verified for user {UserId}", user.Id);
            return (true, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in VerifyEmailAsync");
            return (false, "Произошла ошибка при подтверждении email. Попробуйте позже.");
        }
    }

    // ─── Делегирование: 2FA / TOTP ───

    /// <inheritdoc />
    public Task<(TwoFactorStatusResponse? Response, string? Error)> EnableTwoFactorAsync(Guid userId)
        => _totpService.EnableTwoFactorAsync(userId);

    /// <inheritdoc />
    public Task<(TwoFactorStatusResponse? Response, string? Error)> VerifyTwoFactorAsync(Guid userId, TwoFactorVerifyRequest request)
        => _totpService.VerifyTwoFactorAsync(userId, request);

    /// <inheritdoc />
    public Task<(bool Success, string? Error)> DisableTwoFactorAsync(Guid userId, TwoFactorDisableRequest request)
        => _totpService.DisableTwoFactorAsync(userId, request);

    /// <inheritdoc />
    public async Task<(AuthResponse? Response, string? Error)> VerifyTwoFactorLoginAsync(
        string twoFactorToken, string totpCode, string ipAddress, string userAgent)
    {
        try
        {
            var userId = await _totpService.VerifyTwoFactorLoginAsync(twoFactorToken, totpCode);
            if (userId.Error != null)
                return (null, userId.Error);

            var user = await _context.Users
                .Include(u => u.RefreshTokens)
                .FirstOrDefaultAsync(u => u.Id == userId.UserId!.Value);

            if (user is null || !user.IsActive)
                return (null, "Пользователь не найден или деактивирован.");

            user.FailedLoginAttempts = 0;
            user.LockedUntil = null;
            user.UpdatedAt = DateTime.UtcNow;

            var accessToken = _jwtService.GenerateAccessToken(user);
            var refreshToken = await CreateRefreshTokenAsync(user.Id, ipAddress);

            var loginHistory = new LoginHistory
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                IpAddress = ipAddress,
                UserAgent = userAgent,
                Timestamp = DateTime.UtcNow,
                Success = true,
                FailureReason = "2FA_VERIFIED"
            };
            _context.LoginHistories.Add(loginHistory);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Force2FA: user {UserId} completed 2FA verification and logged in", user.Id);

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
            _logger.LogError(ex, "Force2FA: critical error during 2FA verification");
            return (null, "Произошла ошибка при проверке двухфакторной аутентификации. Попробуйте позже.");
        }
    }

    // ─── Делегирование: аватары ───

    /// <inheritdoc />
    public Task<(string? AvatarUrl, string? Error)> UploadAvatarAsync(Guid userId, IFormFile file)
        => _avatarService.UploadAvatarAsync(userId, file);

    /// <inheritdoc />
    public Task<(bool Success, string? Error)> DeleteAvatarAsync(Guid userId)
        => _avatarService.DeleteAvatarAsync(userId);

    // ─── История и уведомления ───

    /// <inheritdoc />
    public async Task<(List<LoginHistoryItem>? Items, int TotalCount, string? Error)> GetLoginHistoryAsync(Guid userId, int page = 1, int pageSize = 20)
    {
        try
        {
            var userExists = await _context.Users.AnyAsync(u => u.Id == userId);
            if (!userExists)
                return (null, 0, "Пользователь не найден");

            var query = _context.LoginHistories
                .Where(h => h.UserId == userId)
                .OrderByDescending(h => h.Timestamp);

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(h => new LoginHistoryItem
                {
                    Id = h.Id,
                    IpAddress = h.IpAddress,
                    UserAgent = h.UserAgent,
                    Timestamp = h.Timestamp,
                    Success = h.Success,
                    FailureReason = h.FailureReason
                })
                .ToListAsync();

            return (items, totalCount, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при получении истории входа для пользователя {UserId}", userId);
            return (null, 0, "Произошла ошибка при получении истории входа.");
        }
    }

    /// <inheritdoc />
    public async Task<(NotificationPreferenceResponse? Response, string? Error)> GetNotificationPreferencesAsync(Guid userId)
    {
        try
        {
            var userExists = await _context.Users.AnyAsync(u => u.Id == userId);
            if (!userExists)
                return (null, "Пользователь не найден");

            var pref = await _context.NotificationPreferences
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (pref == null)
            {
                return (new NotificationPreferenceResponse
                {
                    EmailNotifications = false,
                    SmsNotifications = false,
                    TelegramNotifications = false,
                    OrderStatusNotifications = true,
                    MarketingNotifications = false,
                    UpdatedAt = DateTime.UtcNow
                }, null);
            }

            return (new NotificationPreferenceResponse
            {
                EmailNotifications = pref.EmailNotifications,
                SmsNotifications = pref.SmsNotifications,
                TelegramNotifications = pref.TelegramNotifications,
                OrderStatusNotifications = pref.OrderStatusNotifications,
                MarketingNotifications = pref.MarketingNotifications,
                UpdatedAt = pref.UpdatedAt
            }, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при получении предпочтений уведомлений для пользователя {UserId}", userId);
            return (null, "Произошла ошибка при получении предпочтений уведомлений.");
        }
    }

    /// <inheritdoc />
    public async Task<(NotificationPreferenceResponse? Response, string? Error)> UpdateNotificationPreferencesAsync(Guid userId, NotificationPreferenceRequest request)
    {
        try
        {
            var userExists = await _context.Users.AnyAsync(u => u.Id == userId);
            if (!userExists)
                return (null, "Пользователь не найден");

            var pref = await _context.NotificationPreferences
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (pref == null)
            {
                pref = new NotificationPreference
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.NotificationPreferences.Add(pref);
            }

            pref.EmailNotifications = request.EmailNotifications;
            pref.SmsNotifications = request.SmsNotifications;
            pref.TelegramNotifications = request.TelegramNotifications;
            pref.OrderStatusNotifications = request.OrderStatusNotifications;
            pref.MarketingNotifications = request.MarketingNotifications;
            pref.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return (new NotificationPreferenceResponse
            {
                EmailNotifications = pref.EmailNotifications,
                SmsNotifications = pref.SmsNotifications,
                TelegramNotifications = pref.TelegramNotifications,
                OrderStatusNotifications = pref.OrderStatusNotifications,
                MarketingNotifications = pref.MarketingNotifications,
                UpdatedAt = pref.UpdatedAt
            }, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при обновлении предпочтений уведомлений для пользователя {UserId}", userId);
            return (null, "Произошла ошибка при обновлении предпочтений уведомлений.");
        }
    }

    // ─── Приватные методы ───

    private async Task<(bool Success, string? Error)> CreateAndSendVerificationEmailAsync(User user, string requestScheme, string requestHost)
    {
        try
        {
            if (user.IsEmailVerified)
                return (true, null);

            var tokenBytes = RandomNumberGenerator.GetBytes(64);
            var plainToken = Convert.ToHexString(tokenBytes).ToLowerInvariant();
            var tokenHash = TOTPService.ComputeSha256Hash(plainToken);

            var previousTokens = await _context.EmailVerificationTokens
                .Where(t => t.UserId == user.Id && t.UsedAt == null && t.ExpiresAt > DateTime.UtcNow)
                .ToListAsync();

            foreach (var prev in previousTokens)
                prev.ExpiresAt = DateTime.UtcNow;

            var verificationToken = new EmailVerificationToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                TokenHash = tokenHash,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(EmailVerificationTokenExpirationHours)
            };

            _context.EmailVerificationTokens.Add(verificationToken);
            await _context.SaveChangesAsync();

            var frontendUrl = _configuration["Frontend:BaseUrl"];
            var verificationLink = !string.IsNullOrEmpty(frontendUrl)
                ? $"{frontendUrl.TrimEnd('/')}/verify-email/{plainToken}"
                : $"{requestScheme}://{requestHost}/verify-email/{plainToken}";

            var emailBody = _emailService.RenderTemplate("EmailVerification", new
            {
                UserName = user.FirstName,
                VerificationLink = verificationLink,
                Year = DateTime.UtcNow.Year
            });

            var decryptedEmail = _encryption.Decrypt(user.Email);
            var (sent, sendError) = await _emailService.SendEmailAsync(
                decryptedEmail,
                "Подтверждение email — GoldPC",
                emailBody,
                isHtml: true);

            if (!sent)
            {
                _logger.LogError("Failed to send verification email: {Error}", sendError);
                return (false, "Не удалось отправить письмо для подтверждения email. Попробуйте позже.");
            }

            _logger.LogInformation("Verification email sent to user {UserId}", user.Id);
            return (true, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending verification email to user {UserId}", user.Id);
            return (false, "Произошла ошибка при отправке письма. Попробуйте позже.");
        }
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
            AvatarUrl = user.AvatarUrl,
            IsActive = user.IsActive,
            IsEmailVerified = user.IsEmailVerified,
            BirthDate = user.BirthDate,
            Company = user.Company
        };
    }
}
#pragma warning restore CS1591, SA1600
