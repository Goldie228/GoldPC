#pragma warning disable CS1591, SA1600
// Copyright (c) GoldPC. All rights reserved.

using System.ComponentModel.DataAnnotations;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// Запрос на создание адреса пользователя
/// </summary>
public class CreateUserAddressRequest
{
    [Required(ErrorMessage = "Название адреса обязательно")]
    [MaxLength(100, ErrorMessage = "Название не должно превышать 100 символов")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Город обязателен")]
    [MaxLength(100, ErrorMessage = "Город не должен превышать 100 символов")]
    public string City { get; set; } = string.Empty;

    [Required(ErrorMessage = "Адрес обязателен")]
    [MaxLength(500, ErrorMessage = "Адрес не должен превышать 500 символов")]
    public string Address { get; set; } = string.Empty;

    [MaxLength(50, ErrorMessage = "Квартира/офис не должны превышать 50 символов")]
    public string? Apartment { get; set; }

    [MaxLength(20, ErrorMessage = "Почтовый индекс не должен превышать 20 символов")]
    public string? PostalCode { get; set; }

    public bool IsDefault { get; set; }
}
#pragma warning restore CS1591, SA1600
