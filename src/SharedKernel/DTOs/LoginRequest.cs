#pragma warning disable CS1591, SA1600
// Copyright (c) GoldPC. All rights reserved.

using System.ComponentModel.DataAnnotations;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO для входа в систему.
/// </summary>
public class LoginRequest
{
    [Required(ErrorMessage = "Email обязателен")]
    [EmailAddress(ErrorMessage = "Некорректный формат email")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Пароль обязателен")]
    public string Password { get; set; } = string.Empty;
}
#pragma warning restore CS1591, SA1600
