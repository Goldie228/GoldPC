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
    /// Gets or sets время жизни токена в секундах (по умолчанию 15 минут).
    /// </summary>
    public int ExpiresIn { get; set; } = 900;

    public UserDto User { get; set; } = null!;

    /// <summary>
    /// Gets or sets a value indicating whether two-factor authentication is required to complete login.
    /// </summary>
    public bool RequiresTwoFactor { get; set; }

    /// <summary>
    /// Gets or sets the two-factor authentication verification token.
    /// Sent to /api/v1/auth/login/verify-2fa along with the TOTP code.
    /// </summary>
    public string? TwoFactorToken { get; set; }
}
#pragma warning restore CS1591, SA1600
