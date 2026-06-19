#pragma warning disable CS1591
// Copyright (c) GoldPC. All rights reserved.

using System.Security.Cryptography;
using GoldPC.AuthService.Data;
using GoldPC.AuthService.Entities;
using GoldPC.AuthService.Infrastructure;
using GoldPC.Shared.Services;
using GoldPC.Shared.Services.Implementations;
using GoldPC.SharedKernel.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GoldPC.AuthService.Services;

/// <summary>
/// Сервис управления паролями: смена, восстановление, валидация токенов.
/// </summary>
public class PasswordService
{
    private readonly AuthDbContext _context;
    private readonly ITokenCache _tokenCache;
    private readonly IEncryptionService _encryption;
    private readonly IConfiguration _configuration;
    private readonly SmtpEmailService _emailService;
    private readonly ILogger<PasswordService> _logger;
    private const int PasswordResetTokenExpirationHours = 1;

    public PasswordService(
        AuthDbContext context,
        ITokenCache tokenCache,
        IEncryptionService encryption,
        IConfiguration configuration,
        SmtpEmailService emailService,
        ILogger<PasswordService> logger)
    {
        _context = context;
        _tokenCache = tokenCache;
        _encryption = encryption;
        _configuration = configuration;
        _emailService = emailService;
        _logger = logger;
    }

    /// <summary>
    /// Смена пароля (после проверки текущего).
    /// </summary>
    public async Task<(bool Success, string? Error)> ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        var user = await _context.Users.FindAsync(userId);
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

    /// <summary>
    /// Отправляет письмо для восстановления пароля. Всегда возвращает успех, чтобы не раскрывать факт существования email.
    /// </summary>
    public async Task<(bool Success, string? Error)> ForgotPasswordAsync(string email, string requestScheme, string requestHost)
    {
        try
        {
            var emailHash = _encryption.ComputeHash(email.ToLower());
            var user = await _context.Users.FirstOrDefaultAsync(u => u.EmailHash == emailHash);
            user ??= await _context.Users.FirstOrDefaultAsync(u => u.Email == email.ToLower());

            if (user == null || !user.IsActive)
            {
                _logger.LogInformation("Password reset requested for non-existent or inactive email hash");
                return (true, null);
            }

            var tokenBytes = RandomNumberGenerator.GetBytes(64);
            var plainToken = Convert.ToHexString(tokenBytes).ToLowerInvariant();
            var tokenHash = TOTPService.ComputeSha256Hash(plainToken);

            var previousTokens = await _context.PasswordResetTokens
                .Where(t => t.UserId == user.Id && t.UsedAt == null && t.ExpiresAt > DateTime.UtcNow)
                .ToListAsync();

            foreach (var prev in previousTokens)
            {
                prev.ExpiresAt = DateTime.UtcNow;
            }

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

            await _tokenCache.StoreTokenAsync(
                tokenHash,
                user.Id,
                TimeSpan.FromHours(PasswordResetTokenExpirationHours));

            var frontendUrl = _configuration["Frontend:BaseUrl"];
            var resetLink = !string.IsNullOrEmpty(frontendUrl)
                ? $"{frontendUrl.TrimEnd('/')}/reset-password/{plainToken}"
                : $"{requestScheme}://{requestHost}/reset-password/{plainToken}";

            var emailBody = _emailService.RenderTemplate("PasswordReset", new
            {
                UserName = user.FirstName,
                ResetLink = resetLink,
                ExpirationHours = PasswordResetTokenExpirationHours,
                Year = DateTime.UtcNow.Year
            });

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

    /// <summary>
    /// Сбрасывает пароль по токену из письма.
    /// </summary>
    public async Task<(bool Success, string? Error)> ResetPasswordAsync(string token, string newPassword, string ipAddress)
    {
        try
        {
            var tokenHash = TOTPService.ComputeSha256Hash(token);

            var userId = await _tokenCache.ValidateTokenAsync(tokenHash);
            if (userId is null)
            {
                _logger.LogWarning("Password reset token not found in Redis (expired or invalid)");
                return (false, "Ссылка для восстановления пароля истекла или уже была использована.");
            }

            var resetToken = await _context.PasswordResetTokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.TokenHash == tokenHash);

            if (resetToken is null)
            {
                _logger.LogWarning("Token in Redis but not in DB — cleaning up. UserId: {UserId}", userId);
                await _tokenCache.InvalidateTokenAsync(tokenHash);
                return (false, "Ссылка для восстановления пароля истекла или уже была использована.");
            }

            if (!resetToken.IsValid)
            {
                _logger.LogWarning("Token expired/used in DB, removing from Redis. UserId: {UserId}", resetToken.UserId);
                await _tokenCache.InvalidateTokenAsync(tokenHash);
                return (false, "Ссылка для восстановления пароля истекла или уже была использована.");
            }

            var user = resetToken.User;

            if (!user.IsActive)
            {
                return (false, "Учётная запись деактивирована.");
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword, workFactor: 12);
            user.UpdatedAt = DateTime.UtcNow;

            var activeRefreshTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == user.Id && rt.RevokedAt == null)
                .ToListAsync();

            foreach (var rt in activeRefreshTokens)
            {
                rt.RevokedAt = DateTime.UtcNow;
                rt.RevokedByIp = ipAddress;
                rt.RevokedReason = "Password reset";
            }

            resetToken.UsedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await _tokenCache.InvalidateTokenAsync(tokenHash);

            _logger.LogInformation("Password reset completed for user {UserId}", user.Id);
            return (true, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in ResetPasswordAsync");
            return (false, "Произошла ошибка при восстановлении пароля. Попробуйте позже.");
        }
    }

    /// <summary>
    /// Валидирует токен восстановления пароля.
    /// </summary>
    public async Task<(bool IsValid, string? Error)> ValidateResetTokenAsync(string token)
    {
        var tokenHash = TOTPService.ComputeSha256Hash(token);

        var userId = await _tokenCache.ValidateTokenAsync(tokenHash);
        if (userId is null)
        {
            return (false, "Ссылка для восстановления пароля истекла или уже была использована.");
        }

        var resetToken = await _context.PasswordResetTokens
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash);

        if (resetToken is null || !resetToken.IsValid)
        {
            await _tokenCache.InvalidateTokenAsync(tokenHash);
            return (false, "Ссылка для восстановления пароля истекла или уже была использована.");
        }

        return (true, null);
    }
}
#pragma warning restore CS1591
