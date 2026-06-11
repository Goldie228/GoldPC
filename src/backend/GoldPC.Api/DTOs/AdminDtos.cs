using System.ComponentModel.DataAnnotations;

namespace GoldPC.Api.Controllers;

// ========================================================================
// DTOs административной панели
// ========================================================================

/// <summary>DTO пользователя для админ-панели</summary>
public record UserDto
{
    public Guid Id { get; init; }
    public string Email { get; init; } = string.Empty;
    public string Role { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string? Phone { get; init; }
    public bool IsActive { get; init; } = true;
    public bool IsEmailVerified { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

/// <summary>DTO для обновления пользователя</summary>
public record UpdateUserDto
{
    [StringLength(100)]
    public string? FirstName { get; init; }

    [StringLength(100)]
    public string? LastName { get; init; }

    [Phone(ErrorMessage = "Некорректный формат телефона")]
    public string? Phone { get; init; }
}

/// <summary>Запрос на смену роли</summary>
public record UpdateRoleRequest
{
    [Required(ErrorMessage = "Роль не может быть пустой")]
    public string Role { get; init; } = string.Empty;
}

/// <summary>Запрос на создание пользователя</summary>
public record CreateUserDto
{
    [Required(ErrorMessage = "Имя обязательно")]
    [StringLength(100, MinimumLength = 1)]
    public string FirstName { get; init; } = string.Empty;

    [Required(ErrorMessage = "Фамилия обязательна")]
    [StringLength(100, MinimumLength = 1)]
    public string LastName { get; init; } = string.Empty;

    [Required(ErrorMessage = "Email обязателен")]
    [EmailAddress(ErrorMessage = "Некорректный формат email")]
    [StringLength(255)]
    public string Email { get; init; } = string.Empty;

    [Phone(ErrorMessage = "Некорректный формат телефона")]
    public string? Phone { get; init; }

    [Required(ErrorMessage = "Роль обязательна")]
    public string Role { get; init; } = "Client";

    [Required(ErrorMessage = "Пароль обязателен")]
    [MinLength(8, ErrorMessage = "Пароль должен содержать минимум 8 символов")]
    public string Password { get; init; } = string.Empty;
}

/// <summary>Запрос на сброс пароля администратором</summary>
public record ResetPasswordDto
{
    [Required(ErrorMessage = "Новый пароль обязателен")]
    [MinLength(8, ErrorMessage = "Пароль должен содержать минимум 8 символов")]
    public string NewPassword { get; init; } = string.Empty;
}

/// <summary>DTO записи аудит-лога</summary>
public record AuditLogDto
{
    public string Id { get; init; } = string.Empty;
    public string ActionType { get; init; } = string.Empty;
    public string UserId { get; init; } = string.Empty;
    public string UserName { get; init; } = string.Empty;
    public string UserEmail { get; init; } = string.Empty;
    public string IpAddress { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string? AdditionalData { get; init; }
    public DateTime CreatedAt { get; init; }
    public string Severity { get; init; } = "INFO";
}

// Product DTOs now come from GoldPC.SharedKernel.DTOs (aliased as SK):
// SK.ProductListDto — for list responses
// SK.ProductDetailDto — for detail responses
// SK.CreateProductDto — for creation requests
// SK.UpdateProductDto — for update requests

/// <summary>Статистика дашборда</summary>
public record DashboardStats
{
    public int TotalUsers { get; init; }
    public int TotalProducts { get; init; }
    public int TotalOrders { get; init; }
    public decimal Revenue { get; init; }
    public decimal UsersChange { get; init; }
    public decimal OrdersChange { get; init; }
    public decimal RevenueChange { get; init; }
}

/// <summary>Ответ со статистикой</summary>
public record StatsResponse
{
    public DashboardStats Stats { get; init; } = new();
    public string LastUpdated { get; init; } = string.Empty;
}

/// <summary>DTO элемента справочника</summary>
public record DictionaryItemDto
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string Slug { get; init; } = string.Empty;
    public bool IsActive { get; init; } = true;
    public int? ProductCount { get; init; }
    public string? Country { get; init; }
}

/// <summary>Запрос на создание элемента справочника</summary>
public record CreateDictionaryItemRequest
{
    [Required(ErrorMessage = "Name обязателен")]
    [StringLength(200)]
    public string Name { get; init; } = string.Empty;

    [Required(ErrorMessage = "Slug обязателен")]
    [StringLength(200)]
    public string Slug { get; init; } = string.Empty;
}

/// <summary>Запрос на обновление элемента справочника</summary>
public record UpdateDictionaryItemRequest
{
    public string? Name { get; init; }
    public string? Slug { get; init; }
    public bool? IsActive { get; init; }
}

/// <summary>DTO настроек сайта</summary>
public record SiteSettingsDto
{
    public string SiteName { get; init; } = "Gold PC";
    public string AdminEmail { get; init; } = "admin@goldpc.by";
    public string StoreAddress { get; init; } = "г. Минск, ул. Тимирязева, 67";
    public string Phone { get; init; } = "+375 (29) 111-11-11";
    public string WorkingHours { get; init; } = "Пн-Пт: 09:00-20:00, Сб-Вс: 10:00-18:00";
    public decimal FreeDeliveryThreshold { get; init; } = 300;
    public decimal DeliveryCost { get; init; } = 15;
    public string DeliveryTime { get; init; } = "1-3";
    public bool TwoFactorRequired { get; init; }
    public bool AuditLogging { get; init; } = true;
    public bool LoginNotifications { get; init; } = true;
    public bool OrderEmailNotifications { get; init; } = true;
    public bool SmsNotifications { get; init; }
    public bool LowStockNotifications { get; init; } = true;
    public bool MaintenanceMode { get; init; }
}

/// <summary>DTO для частичного обновления настроек</summary>
public record UpdateSiteSettingsDto
{
    public string? SiteName { get; init; }
    public string? AdminEmail { get; init; }
    public string? StoreAddress { get; init; }
    public string? Phone { get; init; }
    public string? WorkingHours { get; init; }
    public decimal? FreeDeliveryThreshold { get; init; }
    public decimal? DeliveryCost { get; init; }
    public string? DeliveryTime { get; init; }
    public bool? TwoFactorRequired { get; init; }
    public bool? AuditLogging { get; init; }
    public bool? LoginNotifications { get; init; }
    public bool? OrderEmailNotifications { get; init; }
    public bool? SmsNotifications { get; init; }
    public bool? LowStockNotifications { get; init; }
    public bool? MaintenanceMode { get; init; }
}

/// <summary>Публичные настройки сайта (безопасны для внешнего потребления)</summary>
public record PublicSiteSettingsDto
{
    public string SiteName { get; init; } = "Gold PC";
    public string StoreAddress { get; init; } = "";
    public string Phone { get; init; } = "";
    public string WorkingHours { get; init; } = "";
    public decimal FreeDeliveryThreshold { get; init; } = 300;
    public decimal DeliveryCost { get; init; } = 15;
    public string DeliveryTime { get; init; } = "1-3";
}
