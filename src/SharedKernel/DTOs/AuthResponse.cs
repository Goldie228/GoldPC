#pragma warning disable CS1591, SA1600
// Copyright (c) GoldPC. All rights reserved.

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO для ответа аутентификации.
/// </summary>
public class AuthResponse
{
    public string AccessToken { get; set; } = string.Empty;

    public string RefreshToken { get; set; } = string.Empty;

    /// <summary>
    /// Получает или задаёт время жизни токена в секундах (по умолчанию 15 минут).
    /// </summary>
    public int ExpiresIn { get; set; } = 900;

    public UserDto User { get; set; } = null!;

    /// <summary>
    /// Получает или задаёт значение, указывающее, требуется ли двухфакторная аутентификация для завершения входа.
    /// </summary>
    public bool RequiresTwoFactor { get; set; }

    /// <summary>
    /// Получает или задаёт токен проверки двухфакторной аутентификации.
    /// Отправляется на /api/v1/auth/login/verify-2fa вместе с TOTP-кодом.
    /// </summary>
    public string? TwoFactorToken { get; set; }
}
#pragma warning restore CS1591, SA1600
