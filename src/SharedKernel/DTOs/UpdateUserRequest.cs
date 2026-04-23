#pragma warning disable CS1591, SA1600
// Copyright (c) GoldPC. All rights reserved.

using System.ComponentModel.DataAnnotations;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO для обновления профиля пользователя.
/// </summary>
public class UpdateUserRequest
{
    [Required(ErrorMessage = "Имя обязательно")]
    [MinLength(2, ErrorMessage = "Имя должно содержать минимум 2 символа")]
    [MaxLength(100, ErrorMessage = "Имя не может превышать 100 символов")]
    public string? FirstName { get; set; }

    [Required(ErrorMessage = "Фамилия обязательна")]
    [MinLength(2, ErrorMessage = "Фамилия должна содержать минимум 2 символа")]
    [MaxLength(100, ErrorMessage = "Фамилия не может превышать 100 символов")]
    public string? LastName { get; set; }

    [Required(ErrorMessage = "Телефон обязателен")]
    [RegularExpression(@"^\+375\s?\(?\d{2}\)?\s?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$", ErrorMessage = "Телефон должен быть в формате Беларуси: +375 (XX) XXX-XX-XX")]
    public string? Phone { get; set; }
}
#pragma warning restore CS1591, SA1600
