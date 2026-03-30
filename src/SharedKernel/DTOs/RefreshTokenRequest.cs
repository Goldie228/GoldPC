#pragma warning disable CS1591, SA1600
// Copyright (c) GoldPC. All rights reserved.

using System.ComponentModel.DataAnnotations;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO для обновления токена.
/// </summary>
public class RefreshTokenRequest
{
    [Required(ErrorMessage = "Refresh token обязателен")]
    public string RefreshToken { get; set; } = string.Empty;
}
#pragma warning restore CS1591, SA1600
