#pragma warning disable CS1591, SA1600
// Copyright (c) GoldPC. All rights reserved.

// CA1724: Имя класса AuthService конфликтует с именем пространства имён GoldPC.AuthService.
// Это осознанный выбор — сервис аутентификации размещён в одноимённом пространстве имён.
#pragma warning disable CA1724

using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
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
/// Сервис аутентификации
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
        IEncryptionService encryption)
    {
        _context = context;
        _jwtService = jwtService;
        _configuration = configuration;
        _logger = logger;
        _emailService = emailService;
        _tokenCache = tokenCache;
        _twoFactorSettings = twoFactorSettings;
        _encryption = encryption;
    }

    /// <inheritdoc />
    public async Task<(AuthResponse? Response, string? Error)> RegisterAsync(RegisterRequest request)
    {
        // Проверяем уникальность по EmailHash (хеш email в открытом виде)
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
            // Ищем пользователя по EmailHash (хеш email в открытом виде)
            var emailHash = _encryption.ComputeHash(request.Email.ToLower());
            var user = await _context.Users
                .Include(u => u.RefreshTokens)
                .FirstOrDefaultAsync(u => u.EmailHash == emailHash);

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

                // Записываем неудачную попытку входа
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

            // === Force2FA: если включено, проверяем привилегированные роли ===
            var isPrivilegedRole = user.Roles.Any(r => r is UserRole.Admin or UserRole.Manager);
            if (isPrivilegedRole && _twoFactorSettings.IsTwoFactorRequired)
            {
                var twoFactorRecord = await _context.UserTwoFactors
                    .FirstOrDefaultAsync(t => t.UserId == user.Id && t.IsEnabled);

                if (twoFactorRecord == null)
                {
                    // 2FA не настроена — отклоняем вход
                    _logger.LogWarning("Force2FA: user {Email} ({Role}) has no 2FA configured", _encryption.Decrypt(user.Email), user.Role);
                    return (null, "Для входа требуется двухфакторная аутентификация. Настройте 2FA в личном кабинете.");
                }

                // 2FA настроена — выдаём challenge-токен, не выдавая полноценный JWT
                var tokenBytes = RandomNumberGenerator.GetBytes(32);
                var plainToken = Convert.ToHexString(tokenBytes).ToLowerInvariant();
                var tokenHash = ComputeSha256Hash(plainToken);

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

            // Записываем историю входа
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
        var emailHash = _encryption.ComputeHash(email.ToLower());
        var user = await _context.Users.FirstOrDefaultAsync(u => u.EmailHash == emailHash);
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
            user.Phone = _encryption.Encrypt(StringSanitizer.SanitizeText(request.Phone));
        if (request.BirthDate != null)
            user.BirthDate = request.BirthDate;
        if (request.Company != null)
            user.Company = request.Company;

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

    /// <inheritdoc />
    public async Task<(bool Success, string? Error)> ForgotPasswordAsync(string email, string requestScheme, string requestHost)
    {
        // Всегда возвращаем успех, чтобы не раскрывать факт существования email
        try
        {
            var emailHash = _encryption.ComputeHash(email.ToLower());
            var user = await _context.Users.FirstOrDefaultAsync(u => u.EmailHash == emailHash);
            if (user == null)
            {
                _logger.LogInformation("Password reset requested for non-existent email hash");
                return (true, null);
            }

            if (!user.IsActive)
            {
                _logger.LogInformation("Password reset requested for inactive user");
                return (true, null);
            }

            // Генерируем безопасный случайный токен
            var tokenBytes = RandomNumberGenerator.GetBytes(64);
            var plainToken = Convert.ToHexString(tokenBytes).ToLowerInvariant();
            var tokenHash = ComputeSha256Hash(plainToken);

            // Деактивируем все предыдущие неиспользованные токены для этого пользователя
            var previousTokens = await _context.PasswordResetTokens
                .Where(t => t.UserId == user.Id && t.UsedAt == null && t.ExpiresAt > DateTime.UtcNow)
                .ToListAsync();

            foreach (var prev in previousTokens)
            {
                prev.ExpiresAt = DateTime.UtcNow; // немедленно истекают
            }

            // Создаём новый токен
            var resetToken = new PasswordResetToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                TokenHash = tokenHash,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(PasswordResetTokenExpirationHours)
            };

            _context.PasswordResetTokens.Add(resetToken);
            await _context.SaveChangesAsync();

            // Сохраняем токен в Redis c TTL = PasswordResetTokenExpirationHours.
            // При перезапуске Redis ключи сгорят → старые ссылки станут недействительны.
            // При истечении TTL Redis автоматически удалит ключ — никаких фоновых задач.
            await _tokenCache.StoreTokenAsync(
                tokenHash,
                user.Id,
                TimeSpan.FromHours(PasswordResetTokenExpirationHours));

            // Формируем ссылку для сброса.
            // Используем Frontend:BaseUrl из конфигурации (напр. http://localhost:5173),
            // чтобы ссылка вела на фронтенд, а не на API-сервер.
            var frontendUrl = _configuration["Frontend:BaseUrl"];
            var resetLink = !string.IsNullOrEmpty(frontendUrl)
                ? $"{frontendUrl.TrimEnd('/')}/reset-password/{plainToken}"
                : $"{requestScheme}://{requestHost}/reset-password/{plainToken}";

            // Рендерим HTML-письмо
            var emailBody = _emailService.RenderTemplate("PasswordReset", new
            {
                UserName = user.FirstName,
                ResetLink = resetLink,
                ExpirationHours = PasswordResetTokenExpirationHours,
                Year = DateTime.UtcNow.Year
            });

            // Отправляем письмо
            var decryptedEmail = _encryption.Decrypt(user.Email);
            var (sent, sendError) = await _emailService.SendEmailAsync(
                decryptedEmail,
                "Восстановление пароля — GoldPC",
                emailBody,
                isHtml: true);

            if (!sent)
            {
                _logger.LogError("Failed to send password reset email: {Error}", sendError);
                return (false, "Не удалось отправить письмо для восстановления пароля. Попробуйте позже.");
            }

            _logger.LogInformation("Password reset email sent to user {UserId}", user.Id);
            return (true, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in ForgotPasswordAsync for {Email}: {Message}", email, ex.Message);
            return (false, "Произошла ошибка при обработке запроса. Попробуйте позже.");
        }
    }

    /// <inheritdoc />
    public async Task<(bool Success, string? Error)> ResetPasswordAsync(string token, string newPassword, string ipAddress)
    {
        try
        {
            var tokenHash = ComputeSha256Hash(token);

            // 1. Быстрая проверка в Redis: если ключа нет — токен истёк/недействителен.
            //    Redis сам удаляет ключи по TTL, поэтому это надёжный индикатор.
            var userId = await _tokenCache.ValidateTokenAsync(tokenHash);
            if (userId is null)
            {
                _logger.LogWarning("Password reset token not found in Redis (expired or invalid)");
                return (false, "Ссылка для восстановления пароля истекла или уже была использована.");
            }

            // 2. Находим токен в БД для полной валидации и аудита.
            var resetToken = await _context.PasswordResetTokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.TokenHash == tokenHash);

            if (resetToken is null)
            {
                // Токен есть в Redis, но нет в БД — рассинхронизация (напр. БД пересоздана).
                // Чистим Redis и возвращаем ошибку.
                _logger.LogWarning("Token in Redis but not in DB — cleaning up. UserId: {UserId}", userId);
                await _tokenCache.InvalidateTokenAsync(tokenHash);
                return (false, "Ссылка для восстановления пароля истекла или уже была использована.");
            }

            if (!resetToken.IsValid)
            {
                // Токен есть в БД, но истёк по ExpiresAt или уже использован — чистим Redis.
                _logger.LogWarning("Token expired/used in DB, removing from Redis. UserId: {UserId}", resetToken.UserId);
                await _tokenCache.InvalidateTokenAsync(tokenHash);
                return (false, "Ссылка для восстановления пароля истекла или уже была использована.");
            }

            var user = resetToken.User;

            if (!user.IsActive)
            {
                return (false, "Учётная запись деактивирована.");
            }

            // 3. Обновляем пароль
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword, workFactor: 12);
            user.UpdatedAt = DateTime.UtcNow;

            // Инвалидируем все refresh токены пользователя (защита от угона сессии)
            var activeRefreshTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == user.Id && rt.RevokedAt == null)
                .ToListAsync();

            foreach (var rt in activeRefreshTokens)
            {
                rt.RevokedAt = DateTime.UtcNow;
                rt.RevokedByIp = ipAddress;
                rt.RevokedReason = "Password reset";
            }

            // Помечаем токен сброса как использованный
            resetToken.UsedAt = DateTime.UtcNow;
            resetToken.UsedByIp = ipAddress;

            // Сбрасываем счётчик неудачных попыток входа
            user.FailedLoginAttempts = 0;
            user.LockedUntil = null;

            await _context.SaveChangesAsync();

            // 4. Удаляем токен из Redis — он больше недействителен
            await _tokenCache.InvalidateTokenAsync(tokenHash);

            _logger.LogInformation("Password successfully reset for user {UserId}", user.Id);
            return (true, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in ResetPasswordAsync");
            return (false, "Произошла ошибка при сбросе пароля. Попробуйте позже.");
        }
    }

    /// <inheritdoc />
    public async Task<(bool Valid, string? Error)> ValidateResetTokenAsync(string token)
    {
        try
        {
            var tokenHash = ComputeSha256Hash(token);

            // Проверяем Redis — если ключа нет, токен истёк/недействителен.
            // Не трогаем БД, чтобы избежать лишних блокировок и не отмечать токен как использованный.
            var userId = await _tokenCache.ValidateTokenAsync(tokenHash);

            if (userId is null)
                return (false, "Ссылка для восстановления пароля истекла или уже была использована.");

            return (true, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in ValidateResetTokenAsync");
            return (false, "Не удалось проверить ссылку. Попробуйте позже.");
        }
    }

    /// <inheritdoc />
    public async Task<(bool Success, string? Error)> SendVerificationEmailAsync(Guid userId, string requestScheme, string requestHost)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return (false, "Пользователь не найден");
            }

            if (user.IsEmailVerified)
            {
                _logger.LogInformation("Verification email requested for already verified user: {UserId}", userId);
                return (true, null); // Не ошибка — просто ничего не делаем
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
            var tokenHash = ComputeSha256Hash(token);

            // Находим токен в БД
            var verificationToken = await _context.EmailVerificationTokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.TokenHash == tokenHash);

            if (verificationToken is null)
            {
                _logger.LogWarning("Email verification token not found in DB");
                return (false, "Ссылка для подтверждения email недействительна или уже была использована.");
            }

            if (!verificationToken.IsValid)
            {
                _logger.LogWarning("Email verification token expired/used for user {UserId}", verificationToken.UserId);
                return (false, "Ссылка для подтверждения email истекла или уже была использована. Запросите новую ссылку.");
            }

            var user = verificationToken.User;

            if (!user.IsActive)
            {
                return (false, "Учётная запись деактивирована.");
            }

            // Помечаем email как подтверждённый
            user.IsEmailVerified = true;
            user.UpdatedAt = DateTime.UtcNow;

            // Помечаем токен как использованный
            verificationToken.UsedAt = DateTime.UtcNow;
            verificationToken.UsedByIp = ipAddress;

            // Инвалидируем все остальные неиспользованные токены верификации для этого пользователя
            var otherTokens = await _context.EmailVerificationTokens
                .Where(t => t.UserId == user.Id && t.Id != verificationToken.Id && t.UsedAt == null && t.ExpiresAt > DateTime.UtcNow)
                .ToListAsync();

            foreach (var t in otherTokens)
            {
                t.UsedAt = DateTime.UtcNow; // Помечаем как использованные
            }

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

    /// <inheritdoc />
    public async Task<(List<LoginHistoryItem>? Items, int TotalCount, string? Error)> GetLoginHistoryAsync(Guid userId, int page = 1, int pageSize = 20)
    {
        try
        {
            var userExists = await _context.Users.AnyAsync(u => u.Id == userId);
            if (!userExists)
            {
                return (null, 0, "Пользователь не найден");
            }

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
            {
                return (null, "Пользователь не найден");
            }

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
            {
                return (null, "Пользователь не найден");
            }

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

    /// <inheritdoc />
    public async Task<(TwoFactorStatusResponse? Response, string? Error)> EnableTwoFactorAsync(Guid userId)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return (null, "Пользователь не найден");
            }

            var twoFactor = await _context.UserTwoFactors
                .FirstOrDefaultAsync(t => t.UserId == userId);

            if (twoFactor != null && twoFactor.IsEnabled)
            {
                return (null, "Двухфакторная аутентификация уже включена");
            }

            // Генерируем TOTP-секрет (Base32, 20 байт = 160 бит)
            var secretBytes = RandomNumberGenerator.GetBytes(20);
            var totpSecret = Base32Encode(secretBytes);

            // Генерируем recovery-коды (10 штук по 8 символов)
            var recoveryCodes = GenerateRecoveryCodes(10);
            var recoveryCodesJson = JsonSerializer.Serialize(recoveryCodes);
            var recoveryCodesHash = ComputeSha256Hash(recoveryCodesJson);

            // Формируем otpauth:// URI для QR-кода
            var issuer = "GoldPC";
            var decryptedEmail = _encryption.Decrypt(user.Email);
            var label = Uri.EscapeDataString($"{issuer}:{decryptedEmail}");
            var qrCodeUrl = $"otpauth://totp/{label}?secret={totpSecret}&issuer={issuer}&digits={TOTPDigits}&period={TOTPStepSeconds}";

            if (twoFactor == null)
            {
                twoFactor = new UserTwoFactor
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.UserTwoFactors.Add(twoFactor);
            }

            twoFactor.TOTPSecret = totpSecret;
            twoFactor.IsEnabled = false; // Пока не подтверждён кодом
            twoFactor.RecoveryCodes = recoveryCodesHash;
            twoFactor.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return (new TwoFactorStatusResponse
            {
                IsEnabled = false,
                RecoveryCodes = recoveryCodes,
                QRCodeUrl = qrCodeUrl
            }, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при включении двухфакторной аутентификации для пользователя {UserId}", userId);
            return (null, "Произошла ошибка при включении двухфакторной аутентификации.");
        }
    }

    /// <inheritdoc />
    public async Task<(TwoFactorStatusResponse? Response, string? Error)> VerifyTwoFactorAsync(Guid userId, TwoFactorVerifyRequest request)
    {
        try
        {
            var twoFactor = await _context.UserTwoFactors
                .FirstOrDefaultAsync(t => t.UserId == userId);

            if (twoFactor == null || string.IsNullOrEmpty(twoFactor.TOTPSecret))
            {
                return (null, "Двухфакторная аутентификация не была инициирована. Сначала вызовите EnableTwoFactorAsync.");
            }

            if (twoFactor.IsEnabled)
            {
                return (null, "Двухфакторная аутентификация уже включена");
            }

            var isValid = VerifyTOTP(twoFactor.TOTPSecret, request.TOTPCode);
            if (!isValid)
            {
                return (null, "Неверный TOTP-код");
            }

            twoFactor.IsEnabled = true;
            twoFactor.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return (new TwoFactorStatusResponse
            {
                IsEnabled = true,
                RecoveryCodes = new List<string>(), // Recovery codes были показаны при Enable
                QRCodeUrl = null
            }, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при подтверждении двухфакторной аутентификации для пользователя {UserId}", userId);
            return (null, "Произошла ошибка при подтверждении двухфакторной аутентификации.");
        }
    }

    /// <inheritdoc />
    public async Task<(bool Success, string? Error)> DisableTwoFactorAsync(Guid userId, TwoFactorDisableRequest request)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return (false, "Пользователь не найден");
            }

            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return (false, "Неверный пароль");
            }

            var twoFactor = await _context.UserTwoFactors
                .FirstOrDefaultAsync(t => t.UserId == userId);

            if (twoFactor == null || !twoFactor.IsEnabled)
            {
                return (false, "Двухфакторная аутентификация не включена");
            }

            twoFactor.IsEnabled = false;
            twoFactor.TOTPSecret = null;
            twoFactor.RecoveryCodes = null;
            twoFactor.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return (true, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при отключении двухфакторной аутентификации для пользователя {UserId}", userId);
            return (false, "Произошла ошибка при отключении двухфакторной аутентификации.");
        }
    }

    /// <inheritdoc />
    public async Task<(AuthResponse? Response, string? Error)> VerifyTwoFactorLoginAsync(
        string twoFactorToken, string totpCode, string ipAddress, string userAgent)
    {
        try
        {
            var tokenHash = ComputeSha256Hash(twoFactorToken);
            var userId = await _tokenCache.ValidateTokenAsync(tokenHash);

            if (userId is null)
            {
                _logger.LogWarning("Force2FA: challenge token expired or invalid");
                return (null, "Время для подтверждения двухфакторной аутентификации истекло. Повторите вход.");
            }

            var user = await _context.Users
                .Include(u => u.RefreshTokens)
                .FirstOrDefaultAsync(u => u.Id == userId.Value);

            if (user is null || !user.IsActive)
            {
                await _tokenCache.InvalidateTokenAsync(tokenHash);
                return (null, "Пользователь не найден или деактивирован.");
            }

            var twoFactor = await _context.UserTwoFactors
                .FirstOrDefaultAsync(t => t.UserId == userId.Value && t.IsEnabled);

            if (twoFactor is null || string.IsNullOrEmpty(twoFactor.TOTPSecret))
            {
                await _tokenCache.InvalidateTokenAsync(tokenHash);
                return (null, "Двухфакторная аутентификация не настроена. Настройте 2FA в личном кабинете.");
            }

            if (!VerifyTOTP(twoFactor.TOTPSecret, totpCode))
            {
                _logger.LogWarning("Force2FA: invalid TOTP code for user {UserId}", userId.Value);
                return (null, "Неверный код двухфакторной аутентификации.");
            }

            // Успех — инвалидируем challenge-токен
            await _tokenCache.InvalidateTokenAsync(tokenHash);

            // Сбрасываем счётчик неудачных попыток
            user.FailedLoginAttempts = 0;
            user.LockedUntil = null;
            user.UpdatedAt = DateTime.UtcNow;

            var accessToken = _jwtService.GenerateAccessToken(user);
            var refreshToken = await CreateRefreshTokenAsync(user.Id, ipAddress);

            // Записываем историю входа с отметкой об успешной 2FA
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

    /// <summary>
    /// Создаёт токен подтверждения email и отправляет письмо.
    /// </summary>
    private async Task<(bool Success, string? Error)> CreateAndSendVerificationEmailAsync(User user, string requestScheme, string requestHost)
    {
        try
        {
            if (user.IsEmailVerified)
            {
                return (true, null);
            }

            // Генерируем безопасный случайный токен
            var tokenBytes = RandomNumberGenerator.GetBytes(64);
            var plainToken = Convert.ToHexString(tokenBytes).ToLowerInvariant();
            var tokenHash = ComputeSha256Hash(plainToken);

            // Деактивируем все предыдущие неиспользованные токены
            var previousTokens = await _context.EmailVerificationTokens
                .Where(t => t.UserId == user.Id && t.UsedAt == null && t.ExpiresAt > DateTime.UtcNow)
                .ToListAsync();

            foreach (var prev in previousTokens)
            {
                prev.ExpiresAt = DateTime.UtcNow; // немедленно истекают
            }

            // Создаём новый токен
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

            // Формируем ссылку для подтверждения
            var frontendUrl = _configuration["Frontend:BaseUrl"];
            var verificationLink = !string.IsNullOrEmpty(frontendUrl)
                ? $"{frontendUrl.TrimEnd('/')}/verify-email/{plainToken}"
                : $"{requestScheme}://{requestHost}/verify-email/{plainToken}";

            // Рендерим HTML-письмо
            var emailBody = _emailService.RenderTemplate("EmailVerification", new
            {
                UserName = user.FirstName,
                VerificationLink = verificationLink,
                Year = DateTime.UtcNow.Year
            });

            // Отправляем письмо
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

    private static string ComputeSha256Hash(string rawData)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawData));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    /// <summary>
    /// Генерирует N случайных recovery-кодов заданной длины.
    /// </summary>
    private static List<string> GenerateRecoveryCodes(int count, int length = 8)
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var codes = new List<string>(count);
        for (var i = 0; i < count; i++)
        {
            var code = new char[length];
            for (var j = 0; j < length; j++)
            {
                code[j] = chars[RandomNumberGenerator.GetInt32(chars.Length)];
            }
            codes.Add(new string(code));
        }
        return codes;
    }

    /// <summary>
    /// Кодирует байты в Base32 (RFC 4648).
    /// </summary>
    private static string Base32Encode(byte[] data)
    {
        const string base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        var result = new StringBuilder();
        var buffer = 0;
        var bitsLeft = 0;

        foreach (var b in data)
        {
            buffer = (buffer << 8) | b;
            bitsLeft += 8;
            while (bitsLeft >= 5)
            {
                bitsLeft -= 5;
                result.Append(base32Chars[(buffer >> bitsLeft) & 0x1F]);
            }
        }

        if (bitsLeft > 0)
        {
            result.Append(base32Chars[(buffer << (5 - bitsLeft)) & 0x1F]);
        }

        return result.ToString();
    }

    /// <summary>
    /// Проверяет TOTP-код на основе HMAC-SHA1 (30-секундный шаг, 6 цифр).
    /// Поддерживает текущее и предыдущее окно (±1 шаг) для допуска рассинхронизации.
    /// </summary>
    private static bool VerifyTOTP(string base32Secret, string totpCode)
    {
        var key = Base32Decode(base32Secret);
        var currentStep = GetCurrentStep();

        // Проверяем текущее и ±1 окно для допуска рассинхронизации часов
        for (var drift = -1; drift <= 1; drift++)
        {
            var step = currentStep + drift;
            if (step < 0) continue;

            var computedCode = ComputeTOTP(key, step);
            if (computedCode == totpCode)
            {
                return true;
            }
        }

        return false;
    }

    /// <summary>
    /// Декодирует Base32-строку в байты.
    /// </summary>
    private static byte[] Base32Decode(string base32)
    {
        const string base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        base32 = base32.TrimEnd('=').ToUpperInvariant();

        var byteCount = base32.Length * 5 / 8;
        var result = new byte[byteCount];

        var buffer = 0;
        var bitsLeft = 0;
        var index = 0;

        foreach (var c in base32)
        {
            var value = base32Chars.IndexOf(c);
            if (value < 0) continue;

            buffer = (buffer << 5) | value;
            bitsLeft += 5;

            if (bitsLeft >= 8)
            {
                bitsLeft -= 8;
                result[index++] = (byte)((buffer >> bitsLeft) & 0xFF);
            }
        }

        return result;
    }

    /// <summary>
    /// Вычисляет текущий TOTP-шаг (Unix-time / шаг в секундах).
    /// </summary>
    private static long GetCurrentStep()
    {
        var unixTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        return unixTime / TOTPStepSeconds;
    }

    /// <summary>
    /// Вычисляет TOTP-код для заданного шага с использованием HMAC-SHA1.
    /// </summary>
    private static string ComputeTOTP(byte[] key, long step)
    {
        var stepBytes = BitConverter.GetBytes(step);
        if (BitConverter.IsLittleEndian)
        {
            Array.Reverse(stepBytes);
        }

        using var hmac = new HMACSHA1(key);
        var hash = hmac.ComputeHash(stepBytes);

        // Dynamic truncation (RFC 4226)
        var offset = hash[^1] & 0x0F;
        var binaryCode = ((hash[offset] & 0x7F) << 24)
                          | ((hash[offset + 1] & 0xFF) << 16)
                          | ((hash[offset + 2] & 0xFF) << 8)
                          | (hash[offset + 3] & 0xFF);

        var otp = binaryCode % (int)Math.Pow(10, TOTPDigits);
        return otp.ToString().PadLeft(TOTPDigits, '0');
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

    /// <inheritdoc />
    public async Task<(string? AvatarUrl, string? Error)> UploadAvatarAsync(Guid userId, IFormFile file)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return (null, "Пользователь не найден");

        // Валидация типа файла
        var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };
        if (!allowedTypes.Contains(file.ContentType.ToLower()))
            return (null, "Допустимы только JPG, PNG, WebP");

        // Валидация размера (5MB)
        if (file.Length > 5 * 1024 * 1024)
            return (null, "Размер файла не должен превышать 5 МБ");

        // Удаляем старый аватар если есть
        if (!string.IsNullOrEmpty(user.AvatarUrl))
        {
            DeleteAvatarFile(user.AvatarUrl);
        }

        // Сохраняем новый аватар
        var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "avatars");
        Directory.CreateDirectory(uploadsDir);

        var ext = Path.GetExtension(file.FileName).ToLower();
        var fileName = $"{userId}{ext}";
        var filePath = Path.Combine(uploadsDir, fileName);

        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var avatarUrl = $"/uploads/avatars/{fileName}";
        user.AvatarUrl = avatarUrl;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Avatar uploaded for user {UserId}", userId);
        return (avatarUrl, null);
    }

    /// <inheritdoc />
    public async Task<(bool Success, string? Error)> DeleteAvatarAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return (false, "Пользователь не найден");

        if (string.IsNullOrEmpty(user.AvatarUrl))
            return (false, "Аватар не установлен");

        DeleteAvatarFile(user.AvatarUrl);
        user.AvatarUrl = null;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Avatar deleted for user {UserId}", userId);
        return (true, null);
    }

    private void DeleteAvatarFile(string avatarUrl)
    {
        var relativePath = avatarUrl.TrimStart('/');
        var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", relativePath);
        if (File.Exists(fullPath))
        {
            try { File.Delete(fullPath); }
            catch (IOException ex) { _logger.LogWarning(ex, "Failed to delete avatar file {Path}", fullPath); }
        }
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