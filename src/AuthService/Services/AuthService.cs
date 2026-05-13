using System.Security.Cryptography;
using System.Text;
using GoldPC.AuthService.Data;
using GoldPC.AuthService.Entities;
using GoldPC.AuthService.Infrastructure;
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
    private const int MaxFailedAttempts = 5;
    private const int LockoutMinutes = 15;
    private const int RefreshTokenExpirationDays = 7;
    private const int PasswordResetTokenExpirationHours = 1;
    private const int EmailVerificationTokenExpirationHours = 24;

    public AuthService(
        AuthDbContext context,
        IJwtService jwtService,
        IConfiguration configuration,
        ILogger<AuthService> logger,
        SmtpEmailService emailService,
        ITokenCache tokenCache)
    {
        _context = context;
        _jwtService = jwtService;
        _configuration = configuration;
        _logger = logger;
        _emailService = emailService;
        _tokenCache = tokenCache;
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
            LastName = request.LastName != null ? StringSanitizer.SanitizeText(request.LastName) : string.Empty,
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

    /// <inheritdoc />
    public async Task<(bool Success, string? Error)> ForgotPasswordAsync(string email, string requestScheme, string requestHost)
    {
        // Всегда возвращаем успех, чтобы не раскрывать факт существования email
        try
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
            if (user == null)
            {
                _logger.LogInformation("Password reset requested for non-existent email: {Email}", email);
                return (true, null);
            }

            if (!user.IsActive)
            {
                _logger.LogInformation("Password reset requested for inactive user: {Email}", email);
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
            var (sent, sendError) = await _emailService.SendEmailAsync(
                user.Email,
                "Восстановление пароля — GoldPC",
                emailBody,
                isHtml: true
            );

            if (!sent)
            {
                _logger.LogError("Failed to send password reset email to {Email}: {Error}", user.Email, sendError);
                return (false, "Не удалось отправить письмо для восстановления пароля. Попробуйте позже.");
            }

            _logger.LogInformation("Password reset email sent to {Email}", user.Email);
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

            _logger.LogInformation("Password successfully reset for user {Email}", user.Email);
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
                _logger.LogInformation("Verification email requested for already verified user: {Email}", user.Email);
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

            _logger.LogInformation("Email verified for user {Email}", user.Email);
            return (true, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in VerifyEmailAsync");
            return (false, "Произошла ошибка при подтверждении email. Попробуйте позже.");
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
            var (sent, sendError) = await _emailService.SendEmailAsync(
                user.Email,
                "Подтверждение email — GoldPC",
                emailBody,
                isHtml: true
            );

            if (!sent)
            {
                _logger.LogError("Failed to send verification email to {Email}: {Error}", user.Email, sendError);
                return (false, "Не удалось отправить письмо для подтверждения email. Попробуйте позже.");
            }

            _logger.LogInformation("Verification email sent to {Email}", user.Email);
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
            Roles = user.Roles,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Phone = user.Phone,
            IsActive = user.IsActive,
            IsEmailVerified = user.IsEmailVerified
        };
    }
}