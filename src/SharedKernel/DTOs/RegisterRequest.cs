#pragma warning disable CS1591, SA1600
// Copyright (c) GoldPC. All rights reserved.

using System.ComponentModel.DataAnnotations;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO для регистрации пользователя.
/// </summary>
public class RegisterRequest
{
    [Required(ErrorMessage = "Email обязателен")]
    [EmailAddress(ErrorMessage = "Некорректный формат email")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Пароль обязателен")]
    [MinLength(8, ErrorMessage = "Пароль должен содержать минимум 8 символов")]
    [MaxLength(128, ErrorMessage = "Пароль не должен превышать 128 символов")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Имя обязательно")]
    [MinLength(2, ErrorMessage = "Имя должно содержать минимум 2 символа")]
    [MaxLength(50, ErrorMessage = "Имя не должно превышать 50 символов")]
    public string FirstName { get; set; } = string.Empty;


    [MaxLength(100, ErrorMessage = "Фамилия не может превышать 100 символов")]
    public string? LastName { get; set; }

    [Required(ErrorMessage = "Телефон обязателен")]
    [RegularExpression(@"^\+375\d{9}$", ErrorMessage = "Телефон должен быть в формате +375XXXXXXXXX")]
    public string Phone { get; set; } = string.Empty;
}
#pragma warning restore CS1591, SA1600
