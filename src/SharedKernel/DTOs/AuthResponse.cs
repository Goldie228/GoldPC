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
    /// Время жизни токена в секундах (по умолчанию 15 минут).
    /// </summary>
    public int ExpiresIn { get; set; } = 900;

    public UserDto User { get; set; } = null!;
}