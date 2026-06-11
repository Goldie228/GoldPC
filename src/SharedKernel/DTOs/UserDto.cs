#pragma warning disable CS1591, SA1600
// Copyright (c) GoldPC. All rights reserved.

using GoldPC.SharedKernel.Enums;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO пользователя для обмена между сервисами.
/// Сериализация enum как строк настраивается глобально в Program.cs.
/// </summary>
public class UserDto
{
     public Guid Id { get; set; }

     public string Email { get; set; } = string.Empty;

     /// <summary>
     /// Gets or sets the default role (deprecated, use Roles for multiple roles).
     /// </summary>
     public UserRole Role { get; set; }

     /// <summary>
     /// Gets or sets the user's assigned roles.
     /// </summary>
     public List<UserRole> Roles { get; set; } = new List<UserRole>();

     public string FirstName { get; set; } = string.Empty;

     public string LastName { get; set; } = string.Empty;

     public string Phone { get; set; } = string.Empty;

     public bool IsActive { get; set; }

     public bool IsEmailVerified { get; set; }

     public DateTime? BirthDate { get; set; }

     public string? Company { get; set; }
}
#pragma warning restore CS1591, SA1600
