#pragma warning disable CS1591, SA1600
// Copyright (c) GoldPC. All rights reserved.

using GoldPC.SharedKernel.Enums;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO пользователя для обмена между сервисами.
/// </summary>
public class UserDto
{
    public Guid Id { get; set; }

    public string Email { get; set; } = string.Empty;

    public UserRole Role { get; set; }

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public bool IsActive { get; set; }
}
#pragma warning restore CS1591, SA1600
