#pragma warning disable CS1591
// Copyright (c) GoldPC. All rights reserved.

using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using GoldPC.AuthService.Data;
using GoldPC.AuthService.Entities;
using GoldPC.AuthService.Infrastructure;
using GoldPC.Shared.Services;
using GoldPC.SharedKernel.DTOs;
using GoldPC.SharedKernel.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GoldPC.AuthService.Services;

/// <summary>
/// Сервис TOTP-аутентификации (2FA): включение, отключение, верификация, крипто-утилиты.
/// </summary>
public class TOTPService
{
    private readonly AuthDbContext _context;
    private readonly IEncryptionService _encryption;
    private readonly ITokenCache _tokenCache;
    private readonly ILogger<TOTPService> _logger;
    private const int TOTPStepSeconds = 30;
    private const int TOTPDigits = 6;

    public TOTPService(
        AuthDbContext context,
        IEncryptionService encryption,
        ITokenCache tokenCache,
        ILogger<TOTPService> logger)
    {
        _context = context;
        _encryption = encryption;
        _tokenCache = tokenCache;
        _logger = logger;
    }

    /// <summary>
    /// Включает 2FA: генерирует TOTP-секрет, recovery-коды и QR-ссылку.
    /// </summary>
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

            var secretBytes = RandomNumberGenerator.GetBytes(20);
            var totpSecret = Base32Encode(secretBytes);

            var recoveryCodes = GenerateRecoveryCodes(10);
            var recoveryCodesJson = JsonSerializer.Serialize(recoveryCodes);
            var recoveryCodesHash = ComputeSha256Hash(recoveryCodesJson);

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
            twoFactor.IsEnabled = false;
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
            _logger.LogError(ex, "Ошибка при включении 2FA для пользователя {UserId}", userId);
            return (null, "Произошла ошибка при включении двухфакторной аутентификации.");
        }
    }

    /// <summary>
    /// Подтверждает 2FA: проверяет TOTP-код и активирует.
    /// </summary>
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
                RecoveryCodes = new List<string>(),
                QRCodeUrl = null
            }, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при подтверждении 2FA для пользователя {UserId}", userId);
            return (null, "Произошла ошибка при подтверждении двухфакторной аутентификации.");
        }
    }

    /// <summary>
    /// Отключает 2FA после проверки пароля.
    /// </summary>
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
            _logger.LogError(ex, "Ошибка при отключении 2FA для пользователя {UserId}", userId);
            return (false, "Произошла ошибка при отключении двухфакторной аутентификации.");
        }
    }

    /// <summary>
    /// Проверяет TOTP-код для завершения входа с 2FA.
    /// </summary>
    public async Task<(Guid? UserId, string? Error)> VerifyTwoFactorLoginAsync(string twoFactorToken, string totpCode)
    {
        try
        {
            var tokenHash = ComputeSha256Hash(twoFactorToken);
            var userId = await _tokenCache.ValidateTokenAsync(tokenHash);

            if (userId is null)
            {
                return (null, "Время для подтверждения двухфакторной аутентификации истекло. Повторите вход.");
            }

            var twoFactor = await _context.UserTwoFactors
                .FirstOrDefaultAsync(t => t.UserId == userId.Value && t.IsEnabled);

            if (twoFactor is null || string.IsNullOrEmpty(twoFactor.TOTPSecret))
            {
                await _tokenCache.InvalidateTokenAsync(tokenHash);
                return (null, "Двухфакторная аутентификация не настроена.");
            }

            if (!VerifyTOTP(twoFactor.TOTPSecret, totpCode))
            {
                return (null, "Неверный TOTP-код.");
            }

            await _tokenCache.InvalidateTokenAsync(tokenHash);
            return (userId.Value, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при верификации 2FA-входа");
            return (null, "Произошла ошибка при подтверждении двухфакторной аутентификации.");
        }
    }

    /// <summary>
    /// Проверяет, включена ли 2FA у пользователя.
    /// </summary>
    public async Task<bool> IsTwoFactorEnabledAsync(Guid userId)
    {
        var twoFactor = await _context.UserTwoFactors
            .FirstOrDefaultAsync(t => t.UserId == userId && t.IsEnabled);
        return twoFactor != null;
    }

    /// <summary>
    /// Хеширует строку через SHA-256 (для токенов и recovery-кодов).
    /// </summary>
    public static string ComputeSha256Hash(string rawData)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawData));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

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

    private static bool VerifyTOTP(string base32Secret, string totpCode)
    {
        var key = Base32Decode(base32Secret);
        var currentStep = GetCurrentStep();

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

    private static long GetCurrentStep()
    {
        var unixTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        return unixTime / TOTPStepSeconds;
    }

    private static string ComputeTOTP(byte[] key, long step)
    {
        var stepBytes = BitConverter.GetBytes(step);
        if (BitConverter.IsLittleEndian)
        {
            Array.Reverse(stepBytes);
        }

        using var hmac = new HMACSHA1(key);
        var hash = hmac.ComputeHash(stepBytes);

        var offset = hash[^1] & 0x0F;
        var binaryCode = ((hash[offset] & 0x7F) << 24)
                          | ((hash[offset + 1] & 0xFF) << 16)
                          | ((hash[offset + 2] & 0xFF) << 8)
                          | (hash[offset + 3] & 0xFF);

        var otp = binaryCode % (int)Math.Pow(10, TOTPDigits);
        return otp.ToString().PadLeft(TOTPDigits, '0');
    }
}
#pragma warning restore CS1591
