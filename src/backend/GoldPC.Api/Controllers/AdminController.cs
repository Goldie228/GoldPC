using GoldPC.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using GoldPC.Shared.Authorization;
using System.Text.Json;
using SK = GoldPC.SharedKernel.DTOs;

namespace GoldPC.Api.Controllers;

// ========================================================================
// DTOs
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
    public string? FirstName { get; init; }
    public string? LastName { get; init; }
    public string? Phone { get; init; }
}

/// <summary>Запрос на смену роли</summary>
public record UpdateRoleRequest
{
    public string Role { get; init; } = string.Empty;
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
    public string Name { get; init; } = string.Empty;
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

// ========================================================================
// Interface IAdminService
// ========================================================================

/// <summary>Сервис административной панели</summary>
public interface IAdminService
{
    // Users
    Task<PagedResult<UserDto>> GetUsersAsync(int page, int pageSize, string? search, string? role, bool? isActive);
    Task<UserDto?> GetUserByIdAsync(Guid id);
    Task<UserDto?> UpdateUserAsync(Guid id, UpdateUserDto update);
    Task<UserDto?> UpdateUserRoleAsync(Guid id, string role);
    Task<UserDto?> DeactivateUserAsync(Guid id);
    Task<UserDto?> ActivateUserAsync(Guid id);
    Task<bool> DeleteUserAsync(Guid id);
    Task<int> GetTotalUsersCountAsync();

    // Dictionaries (only attributes — categories/manufacturers moved to CatalogService)
    Task<List<DictionaryItemDto>> GetDictionaryAsync(string type);
    Task<DictionaryItemDto> CreateDictionaryItemAsync(string type, CreateDictionaryItemRequest request);
    Task<DictionaryItemDto?> UpdateDictionaryItemAsync(string type, string id, UpdateDictionaryItemRequest request);
    Task<bool> DeleteDictionaryItemAsync(string type, string id);

    // Settings
    Task<SiteSettingsDto> GetSettingsAsync();
    Task<SiteSettingsDto> UpdateSettingsAsync(UpdateSiteSettingsDto update);
    Task<SiteSettingsDto> ResetSettingsAsync();
}

// ========================================================================
// Implementation AdminService
// ========================================================================

/// <summary>In-memory реализация сервиса административной панели</summary>
public class AdminService : IAdminService
{
    private readonly ILogger<AdminService> _logger;
    private readonly string _dataDir;
    private readonly string _usersFilePath;
    private readonly string _attributesFilePath;
    private readonly string _settingsFilePath;
    private static readonly object _lock = new();
    private static readonly List<UserDto> _users = new();
    private static readonly List<DictionaryItemDto> _attributes = new();
    private static SiteSettingsDto _settings = new();

    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public AdminService(ILogger<AdminService> logger, IWebHostEnvironment env)
    {
        _logger = logger;
        _dataDir = Path.Combine(env.ContentRootPath, "App_Data", "admin");
        _usersFilePath = Path.Combine(_dataDir, "users.json");
        _attributesFilePath = Path.Combine(_dataDir, "attributes.json");
        _settingsFilePath = Path.Combine(_dataDir, "settings.json");
        EnsureDataLoaded();
    }

    // ====================================================================
    // Persistence
    // ====================================================================

    private void EnsureDataLoaded()
    {
        Directory.CreateDirectory(_dataDir);
        LoadUsers();
        LoadAttributes();
        LoadSettings();
    }

    private void LoadUsers()
    {
        if (File.Exists(_usersFilePath))
        {
            try
            {
                var json = File.ReadAllText(_usersFilePath);
                var users = JsonSerializer.Deserialize<List<UserDto>>(json, _jsonOptions);
                if (users != null && users.Count > 0)
                {
                    lock (_lock)
                    {
                        _users.Clear();
                        _users.AddRange(users);
                    }
                    _logger.LogInformation("Loaded {Count} users from {Path}", _users.Count, _usersFilePath);
                    return;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load users from {Path}, using seed data", _usersFilePath);
            }
        }

        // File doesn't exist or is invalid — use seed data
        lock (_lock)
        {
            _users.AddRange(GenerateUsers());
        }
        SaveUsers();
    }

    private void LoadAttributes()
    {
        if (File.Exists(_attributesFilePath))
        {
            try
            {
                var json = File.ReadAllText(_attributesFilePath);
                var attrs = JsonSerializer.Deserialize<List<DictionaryItemDto>>(json, _jsonOptions);
                if (attrs != null && attrs.Count > 0)
                {
                    lock (_lock)
                    {
                        _attributes.Clear();
                        _attributes.AddRange(attrs);
                    }
                    _logger.LogInformation("Loaded {Count} attributes from {Path}", _attributes.Count, _attributesFilePath);
                    return;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load attributes from {Path}, using seed data", _attributesFilePath);
            }
        }

        // File doesn't exist or is invalid — use seed data
        lock (_lock)
        {
            _attributes.AddRange(GenerateAttributes());
        }
        SaveAttributes();
    }

    private void LoadSettings()
    {
        if (File.Exists(_settingsFilePath))
        {
            try
            {
                var json = File.ReadAllText(_settingsFilePath);
                var settings = JsonSerializer.Deserialize<SiteSettingsDto>(json, _jsonOptions);
                if (settings != null)
                {
                    lock (_lock) { _settings = settings; }
                    _logger.LogInformation("Loaded settings from {Path}", _settingsFilePath);
                    return;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load settings from {Path}, using defaults", _settingsFilePath);
            }
        }

        // File doesn't exist or is invalid — use defaults
        SaveSettings();
    }

    private void SaveUsers()
    {
        lock (_lock)
        {
            var json = JsonSerializer.Serialize(_users, _jsonOptions);
            File.WriteAllText(_usersFilePath, json);
        }
    }

    private void SaveAttributes()
    {
        lock (_lock)
        {
            var json = JsonSerializer.Serialize(_attributes, _jsonOptions);
            File.WriteAllText(_attributesFilePath, json);
        }
    }

    private void SaveSettings()
    {
        lock (_lock)
        {
            var json = JsonSerializer.Serialize(_settings, _jsonOptions);
            File.WriteAllText(_settingsFilePath, json);
        }
    }

    // ====================================================================
    // Users
    // ====================================================================

    public Task<PagedResult<UserDto>> GetUsersAsync(int page, int pageSize, string? search, string? role, bool? isActive)
    {
        var query = _users.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(u =>
                u.Email.ToLower().Contains(s) ||
                u.FirstName.ToLower().Contains(s) ||
                u.LastName.ToLower().Contains(s) ||
                (u.Phone?.Contains(s) ?? false));
        }

        if (!string.IsNullOrWhiteSpace(role))
        {
            query = query.Where(u => u.Role.Equals(role, StringComparison.OrdinalIgnoreCase));
        }

        if (isActive.HasValue)
        {
            query = query.Where(u => u.IsActive == isActive.Value);
        }

        var result = ToPagedResult(query.OrderBy(u => u.Email), page, pageSize);
        return Task.FromResult(result);
    }

    public Task<UserDto?> GetUserByIdAsync(Guid id)
    {
        var user = _users.FirstOrDefault(u => u.Id == id);
        return Task.FromResult(user);
    }

    public Task<int> GetTotalUsersCountAsync()
    {
        return Task.FromResult(_users.Count);
    }

    public Task<UserDto?> UpdateUserAsync(Guid id, UpdateUserDto update)
    {
        UserDto? updated;
        lock (_lock)
        {
            var index = _users.FindIndex(u => u.Id == id);
            if (index == -1) return Task.FromResult<UserDto?>(null);

            var existing = _users[index];
            updated = existing with
            {
                FirstName = update.FirstName ?? existing.FirstName,
                LastName = update.LastName ?? existing.LastName,
                Phone = update.Phone ?? existing.Phone,
                UpdatedAt = DateTime.UtcNow
            };
            _users[index] = updated;
        }

        SaveUsers();
        _logger.LogInformation("User {UserId} updated by admin", id);
        return Task.FromResult<UserDto?>(updated);
    }

    public Task<UserDto?> UpdateUserRoleAsync(Guid id, string role)
    {
        UserDto? updated;
        lock (_lock)
        {
            var index = _users.FindIndex(u => u.Id == id);
            if (index == -1) return Task.FromResult<UserDto?>(null);

            var existing = _users[index];
            updated = existing with
            {
                Role = role,
                UpdatedAt = DateTime.UtcNow
            };
            _users[index] = updated;
        }

        SaveUsers();
        _logger.LogInformation("User {UserId} role changed to {Role} by admin", id, role);
        return Task.FromResult<UserDto?>(updated);
    }

    public Task<UserDto?> DeactivateUserAsync(Guid id)
    {
        return SetUserActiveAsync(id, false);
    }

    public Task<UserDto?> ActivateUserAsync(Guid id)
    {
        return SetUserActiveAsync(id, true);
    }

    public Task<bool> DeleteUserAsync(Guid id)
    {
        lock (_lock)
        {
            var index = _users.FindIndex(u => u.Id == id);
            if (index == -1) return Task.FromResult(false);

            var existing = _users[index];
            _users[index] = existing with
            {
                IsActive = false,
                UpdatedAt = DateTime.UtcNow
            };
        }

        SaveUsers();
        _logger.LogInformation("User {UserId} deactivated (delete) by admin", id);
        return Task.FromResult(true);
    }

    private Task<UserDto?> SetUserActiveAsync(Guid id, bool active)
    {
        UserDto? updated;
        lock (_lock)
        {
            var index = _users.FindIndex(u => u.Id == id);
            if (index == -1) return Task.FromResult<UserDto?>(null);

            var existing = _users[index];
            updated = existing with
            {
                IsActive = active,
                UpdatedAt = DateTime.UtcNow
            };
            _users[index] = updated;
        }

        SaveUsers();
        _logger.LogInformation("User {UserId} active={Active} by admin", id, active);
        return Task.FromResult<UserDto?>(updated);
    }

    // ====================================================================
    // Dictionaries (only attributes — categories/manufacturers via CatalogService)
    // ====================================================================

    public Task<List<DictionaryItemDto>> GetDictionaryAsync(string type)
    {
        var items = type.ToLower() switch
        {
            "attributes" => _attributes,
            _ => new List<DictionaryItemDto>()
        };

        return Task.FromResult(items.ToList());
    }

    public Task<DictionaryItemDto> CreateDictionaryItemAsync(string type, CreateDictionaryItemRequest request)
    {
        DictionaryItemDto item;
        lock (_lock)
        {
            var list = GetDictionaryList(type);
            var prefix = type.ToLower() switch
            {
                "categories" => "cat",
                "manufacturers" => "mfr",
                "attributes" => "attr",
                _ => "dic"
            };
            var id = $"{prefix}-{list.Count + 1:D2}";

            item = new DictionaryItemDto
            {
                Id = id,
                Name = request.Name,
                Slug = request.Slug,
                IsActive = true
            };

            list.Add(item);
        }

        SaveAttributes();
        _logger.LogInformation("Dictionary {Type} item created: {Name}", type, request.Name);
        return Task.FromResult(item);
    }

    public Task<DictionaryItemDto?> UpdateDictionaryItemAsync(string type, string id, UpdateDictionaryItemRequest request)
    {
        DictionaryItemDto? updated;
        lock (_lock)
        {
            var list = GetDictionaryList(type);
            var index = list.FindIndex(d => d.Id == id);
            if (index == -1) return Task.FromResult<DictionaryItemDto?>(null);

            var existing = list[index];
            updated = existing with
            {
                Name = request.Name ?? existing.Name,
                Slug = request.Slug ?? existing.Slug,
                IsActive = request.IsActive ?? existing.IsActive
            };
            list[index] = updated;
        }

        SaveAttributes();
        _logger.LogInformation("Dictionary {Type} item {Id} updated", type, id);
        return Task.FromResult<DictionaryItemDto?>(updated);
    }

    public Task<bool> DeleteDictionaryItemAsync(string type, string id)
    {
        lock (_lock)
        {
            var list = GetDictionaryList(type);
            var index = list.FindIndex(d => d.Id == id);
            if (index == -1) return Task.FromResult(false);

            var existing = list[index];
            list[index] = existing with { IsActive = false };
        }

        SaveAttributes();
        _logger.LogInformation("Dictionary {Type} item {Id} deactivated", type, id);
        return Task.FromResult(true);
    }

    private List<DictionaryItemDto> GetDictionaryList(string type) => type.ToLower() switch
    {
        "attributes" => _attributes,
        _ => throw new ArgumentException($"Unknown dictionary type: {type}")
    };

    // ====================================================================
    // Settings
    // ====================================================================

    public Task<SiteSettingsDto> GetSettingsAsync()
    {
        return Task.FromResult(_settings);
    }

    public Task<SiteSettingsDto> UpdateSettingsAsync(UpdateSiteSettingsDto update)
    {
        lock (_lock)
        {
            _settings = _settings with
            {
                SiteName = update.SiteName ?? _settings.SiteName,
                AdminEmail = update.AdminEmail ?? _settings.AdminEmail,
                StoreAddress = update.StoreAddress ?? _settings.StoreAddress,
                Phone = update.Phone ?? _settings.Phone,
                WorkingHours = update.WorkingHours ?? _settings.WorkingHours,
                FreeDeliveryThreshold = update.FreeDeliveryThreshold ?? _settings.FreeDeliveryThreshold,
                DeliveryCost = update.DeliveryCost ?? _settings.DeliveryCost,
                DeliveryTime = update.DeliveryTime ?? _settings.DeliveryTime,
                TwoFactorRequired = update.TwoFactorRequired ?? _settings.TwoFactorRequired,
                AuditLogging = update.AuditLogging ?? _settings.AuditLogging,
                LoginNotifications = update.LoginNotifications ?? _settings.LoginNotifications,
                OrderEmailNotifications = update.OrderEmailNotifications ?? _settings.OrderEmailNotifications,
                SmsNotifications = update.SmsNotifications ?? _settings.SmsNotifications,
                LowStockNotifications = update.LowStockNotifications ?? _settings.LowStockNotifications,
                MaintenanceMode = update.MaintenanceMode ?? _settings.MaintenanceMode
            };
        }

        SaveSettings();
        _logger.LogInformation("Site settings updated by admin");
        return Task.FromResult(_settings);
    }

    public Task<SiteSettingsDto> ResetSettingsAsync()
    {
        lock (_lock)
        {
            _settings = new SiteSettingsDto();
        }

        SaveSettings();
        _logger.LogInformation("Site settings reset to defaults by admin");
        return Task.FromResult(_settings);
    }

    // ====================================================================
    // Helpers
    // ====================================================================

    private static PagedResult<T> ToPagedResult<T>(IEnumerable<T> query, int page, int pageSize)
    {
        var items = query.ToList();
        var totalItems = items.Count;
        var totalPages = totalItems > 0 ? (int)Math.Ceiling(totalItems / (double)pageSize) : 0;

        var data = items
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return new PagedResult<T>
        {
            Data = data,
            Meta = new PaginationMeta
            {
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = totalPages,
                HasNextPage = page < totalPages,
                HasPrevPage = page > 1
            }
        };
    }

    // ====================================================================
    // Seed Data: Users
    // ====================================================================

    private static List<UserDto> GenerateUsers()
    {
        var users = new List<UserDto>
        {
            new() { Id = Guid.Parse("a0000001-0000-0000-0000-000000000001"), Email = "admin@goldpc.by", Role = Roles.Admin, FirstName = "Админ", LastName = "Системы", Phone = "+375291111111", IsActive = true, IsEmailVerified = true, CreatedAt = new DateTime(2024, 1, 1), UpdatedAt = new DateTime(2024, 1, 1) },
            new() { Id = Guid.Parse("a0000001-0000-0000-0000-000000000002"), Email = "manager@goldpc.by", Role = Roles.Manager, FirstName = "Менеджер", LastName = "Тестовый", Phone = "+375292222222", IsActive = true, IsEmailVerified = true, CreatedAt = new DateTime(2024, 2, 1), UpdatedAt = new DateTime(2024, 2, 1) },
            new() { Id = Guid.Parse("a0000001-0000-0000-0000-000000000003"), Email = "master@goldpc.by", Role = Roles.Master, FirstName = "Мастер", LastName = "Тестовый", Phone = "+375293333333", IsActive = true, IsEmailVerified = true, CreatedAt = new DateTime(2024, 3, 1), UpdatedAt = new DateTime(2024, 3, 1) },
            new() { Id = Guid.Parse("a0000001-0000-0000-0000-000000000004"), Email = "accountant@goldpc.by", Role = "Accountant", FirstName = "Бухгалтер", LastName = "Тестовый", Phone = "+375294444444", IsActive = true, IsEmailVerified = true, CreatedAt = new DateTime(2024, 4, 1), UpdatedAt = new DateTime(2024, 4, 1) },
            new() { Id = Guid.Parse("a0000001-0000-0000-0000-000000000005"), Email = "client@goldpc.by", Role = "Client", FirstName = "Клиент", LastName = "Тестовый", Phone = "+375295555555", IsActive = true, IsEmailVerified = true, CreatedAt = new DateTime(2024, 5, 1), UpdatedAt = new DateTime(2024, 5, 1) },
            new() { Id = Guid.Parse("a0000001-0000-0000-0000-000000000006"), Email = "ivan@example.com", Role = "Client", FirstName = "Иван", LastName = "Петров", IsActive = true, IsEmailVerified = true, CreatedAt = new DateTime(2024, 6, 1), UpdatedAt = new DateTime(2024, 6, 1) },
            new() { Id = Guid.Parse("a0000001-0000-0000-0000-000000000007"), Email = "elena@example.com", Role = "Client", FirstName = "Елена", LastName = "Смирнова", IsActive = true, IsEmailVerified = true, CreatedAt = new DateTime(2024, 7, 1), UpdatedAt = new DateTime(2024, 7, 1) },
            new() { Id = Guid.Parse("a0000001-0000-0000-0000-000000000008"), Email = "dmitry@example.com", Role = "Client", FirstName = "Дмитрий", LastName = "Козлов", IsActive = false, IsEmailVerified = true, CreatedAt = new DateTime(2024, 8, 1), UpdatedAt = new DateTime(2024, 8, 15) },
            new() { Id = Guid.Parse("a0000001-0000-0000-0000-000000000009"), Email = "anna@example.com", Role = Roles.Manager, FirstName = "Анна", LastName = "Соколова", IsActive = true, IsEmailVerified = true, CreatedAt = new DateTime(2024, 9, 1), UpdatedAt = new DateTime(2024, 9, 1) },
            new() { Id = Guid.Parse("a0000001-0000-0000-0000-000000000010"), Email = "mikhail@example.com", Role = Roles.Master, FirstName = "Михаил", LastName = "Новиков", IsActive = true, IsEmailVerified = true, CreatedAt = new DateTime(2024, 10, 1), UpdatedAt = new DateTime(2024, 10, 1) }
        };

        return users;
    }

    // ====================================================================
    // Seed Data: Users
    // ====================================================================

    private static List<DictionaryItemDto> GenerateAttributes()
    {
        var data = new (string name, string slug, bool isActive)[]
        {
            ("Количество ядер", "cores", true),
            ("Частота (МГц)", "frequency", true),
            ("Сокет", "socket", true),
            ("TDP (Вт)", "tdp", true),
            ("Тип памяти", "memory-type", true),
            ("Объём (ГБ)", "capacity", true),
            ("Форм-фактор", "form-factor", true),
            ("Интерфейс", "interface", true),
            ("Цвет", "color", true),
            ("Тип подключения", "connection-type", false),
        };

        return data.Select((d, i) => new DictionaryItemDto
        {
            Id = $"attr-{i + 1:D2}",
            Name = d.name,
            Slug = d.slug,
            IsActive = d.isActive
        }).ToList();
    }
}

// ========================================================================
// AdminController
// ========================================================================

/// <summary>Контроллер административной панели</summary>
[ApiController]
[Route("api/v1/admin")]
// TODO: Add [Authorize] + JWT authentication middleware
// [Authorize(Roles = "Admin,Manager")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly ICatalogServiceClient _catalogClient;
    private readonly ILogger<AdminController> _logger;

    public AdminController(IAdminService adminService, ICatalogServiceClient catalogClient, ILogger<AdminController> logger)
    {
        _adminService = adminService;
        _catalogClient = catalogClient;
        _logger = logger;
    }

    // ====================================================================
    // Users
    // ====================================================================

    /// <summary>Получить список пользователей</summary>
    [HttpGet("users")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(PagedResult<UserDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<UserDto>>> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? role = null,
        [FromQuery] bool? isActive = null)
    {
        var result = await _adminService.GetUsersAsync(page, pageSize, search, role, isActive);
        return Ok(result);
    }

    /// <summary>Получить пользователя по ID</summary>
    [HttpGet("users/{id:guid}")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> GetUserById(Guid id)
    {
        var user = await _adminService.GetUserByIdAsync(id);
        if (user == null) return NotFound(new { error = "Пользователь не найден" });
        return Ok(user);
    }

    /// <summary>Обновить пользователя</summary>
    [HttpPut("users/{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> UpdateUser(Guid id, [FromBody] UpdateUserDto update)
    {
        var user = await _adminService.UpdateUserAsync(id, update);
        if (user == null) return NotFound(new { error = "Пользователь не найден" });
        return Ok(user);
    }

    /// <summary>Изменить роль пользователя</summary>
    [HttpPatch("users/{id:guid}/role")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> UpdateUserRole(Guid id, [FromBody] UpdateRoleRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Role))
            return BadRequest(new { error = "Роль не может быть пустой" });

        var user = await _adminService.UpdateUserRoleAsync(id, request.Role);
        if (user == null) return NotFound(new { error = "Пользователь не найден" });
        return Ok(user);
    }

    /// <summary>Деактивировать пользователя</summary>
    [HttpPost("users/{id:guid}/deactivate")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> DeactivateUser(Guid id)
    {
        var user = await _adminService.DeactivateUserAsync(id);
        if (user == null) return NotFound(new { error = "Пользователь не найден" });
        return Ok(user);
    }

    /// <summary>Активировать пользователя</summary>
    [HttpPost("users/{id:guid}/activate")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> ActivateUser(Guid id)
    {
        var user = await _adminService.ActivateUserAsync(id);
        if (user == null) return NotFound(new { error = "Пользователь не найден" });
        return Ok(user);
    }

    /// <summary>Удалить пользователя (деактивация)</summary>
    [HttpDelete("users/{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var result = await _adminService.DeleteUserAsync(id);
        if (!result) return NotFound(new { error = "Пользователь не найден" });
        return NoContent();
    }

    // ====================================================================
    // Products (via CatalogService)
    // ====================================================================

    /// <summary>Получить список товаров</summary>
    [HttpGet("products")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(SK.PagedResult<SK.ProductListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<SK.PagedResult<SK.ProductListDto>>> GetProducts(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? category = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] string? search = null)
    {
        var result = await _catalogClient.GetProductsAsync(page, pageSize, category, isActive, search);
        return Ok(result);
    }

    /// <summary>Получить товар по ID</summary>
    [HttpGet("products/{id}")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(SK.ProductDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SK.ProductDetailDto>> GetProductById(string id)
    {
        if (!Guid.TryParse(id, out var guid))
            return BadRequest(new { error = "Неверный формат ID товара" });

        var product = await _catalogClient.GetProductByIdAsync(guid);
        if (product == null) return NotFound(new { error = "Товар не найден" });
        return Ok(product);
    }

    /// <summary>Создать товар</summary>
    [HttpPost("products")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(SK.ProductDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SK.ProductDetailDto>> CreateProduct([FromBody] SK.CreateProductDto create)
    {
        if (string.IsNullOrWhiteSpace(create.Name))
            return BadRequest(new { error = "Название товара обязательно" });
        if (string.IsNullOrWhiteSpace(create.Category))
            return BadRequest(new { error = "Категория обязательна" });

        var product = await _catalogClient.CreateProductAsync(create);
        return CreatedAtAction(nameof(GetProductById), new { id = product.Id.ToString() }, product);
    }

    /// <summary>Обновить товар</summary>
    [HttpPut("products/{id}")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(SK.ProductDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SK.ProductDetailDto>> UpdateProduct(string id, [FromBody] SK.UpdateProductDto update)
    {
        if (!Guid.TryParse(id, out var guid))
            return BadRequest(new { error = "Неверный формат ID товара" });

        var product = await _catalogClient.UpdateProductAsync(guid, update);
        if (product == null) return NotFound(new { error = "Товар не найден" });
        return Ok(product);
    }

    /// <summary>Удалить товар (деактивация)</summary>
    [HttpDelete("products/{id}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteProduct(string id)
    {
        if (!Guid.TryParse(id, out var guid))
            return BadRequest(new { error = "Неверный формат ID товара" });

        var result = await _catalogClient.DeleteProductAsync(guid);
        if (!result) return NotFound(new { error = "Товар не найден" });
        return NoContent();
    }

    /// <summary>Получить историю цен товара</summary>
    [HttpGet("products/{id}/price-history")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(List<SK.PriceHistoryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<SK.PriceHistoryDto>>> GetPriceHistory(string id)
    {
        if (!Guid.TryParse(id, out var guid))
            return BadRequest(new { error = "Неверный формат ID товара" });

        var history = await _catalogClient.GetPriceHistoryAsync(guid);
        return Ok(history);
    }

    /// <summary>Сгенерировать название товара по шаблону</summary>
    [HttpPost("products/generate-name")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(SK.GenerateNameResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<SK.GenerateNameResponse>> GenerateProductName([FromBody] SK.GenerateNameRequest request)
    {
        var name = await _catalogClient.GenerateProductNameAsync(
            request.ManufacturerName,
            request.CategorySlug,
            request.Specifications);

        return Ok(new SK.GenerateNameResponse { Name = name });
    }

    /// <summary>Получить мета-данные характеристик для категории (редактор админки)</summary>
    [HttpGet("specifications/by-category/{categoryId}")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(SK.CategorySpecificationsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SK.CategorySpecificationsDto>> GetCategorySpecifications(string categoryId)
    {
        if (!Guid.TryParse(categoryId, out var guid))
            return BadRequest(new { error = "Неверный формат ID категории" });

        var result = await _catalogClient.GetCategorySpecificationsAsync(guid);
        if (result == null)
            return NotFound(new { error = "Категория не найдена", categoryId });

        return Ok(result);
    }

    // ====================================================================
    // Stats
    // ====================================================================

    /// <summary>Получить статистику дашборда</summary>
    [HttpGet("stats")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(StatsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<StatsResponse>> GetStats()
    {
        // Получаем данные из CatalogService
        var totalProducts = await _catalogClient.GetTotalProductsAsync();
        var totalCategories = await _catalogClient.GetTotalCategoriesAsync();
        var totalManufacturers = await _catalogClient.GetTotalManufacturersAsync();

        var totalUsers = await _adminService.GetTotalUsersCountAsync();

        var stats = new DashboardStats
        {
            TotalUsers = totalUsers,
            TotalOrders = 0, // Нет OrderService
            Revenue = 0, // Нет OrderService
            UsersChange = 0,
            OrdersChange = 0,
            RevenueChange = 0
            };

        return Ok(new StatsResponse
        {
            Stats = stats,
            LastUpdated = DateTime.UtcNow.ToString("o")
        });
    }

    // ====================================================================
    // Dictionaries (categories/manufacturers via CatalogService, attributes via AdminService)
    // ====================================================================

    /// <summary>Получить элементы справочника</summary>
    [HttpGet("dictionaries/{type}")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(List<DictionaryItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<List<DictionaryItemDto>>> GetDictionary(string type)
    {
        var validTypes = new[] { "categories", "manufacturers", "attributes" };
        if (!validTypes.Contains(type.ToLower()))
            return BadRequest(new { error = $"Неизвестный тип справочника: {type}. Допустимые: {string.Join(", ", validTypes)}" });

        switch (type.ToLower())
        {
            case "categories":
                return Ok(MapCategoriesToDictionaryItems(await _catalogClient.GetCategoriesAsync()));
            case "manufacturers":
                return Ok(MapManufacturersToDictionaryItems(await _catalogClient.GetManufacturersAsync()));
            case "attributes":
                return Ok(await _adminService.GetDictionaryAsync("attributes"));
            default:
                return Ok(new List<DictionaryItemDto>());
        }
    }

    /// <summary>Создать элемент справочника</summary>
    [HttpPost("dictionaries/{type}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(DictionaryItemDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<DictionaryItemDto>> CreateDictionaryItem(string type, [FromBody] CreateDictionaryItemRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Slug))
            return BadRequest(new { error = "Name и Slug обязательны" });

        switch (type.ToLower())
        {
            case "categories":
                var catDto = new SK.CreateCategoryDto { Name = request.Name, Slug = request.Slug };
                var catResult = await _catalogClient.CreateCategoryAsync(catDto);
                return CreatedAtAction(nameof(GetDictionary), new { type }, MapCategoryToDictionaryItem(catResult));
            case "manufacturers":
                var mfrDto = new SK.CreateManufacturerDto { Name = request.Name };
                var mfrResult = await _catalogClient.CreateManufacturerAsync(mfrDto);
                return CreatedAtAction(nameof(GetDictionary), new { type }, MapManufacturerToDictionaryItem(mfrResult));
            case "attributes":
                var attrResult = await _adminService.CreateDictionaryItemAsync(type, request);
                return CreatedAtAction(nameof(GetDictionary), new { type }, attrResult);
            default:
                return BadRequest(new { error = $"Неизвестный тип справочника: {type}" });
        }
    }

    /// <summary>Обновить элемент справочника</summary>
    [HttpPut("dictionaries/{type}/{id}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(DictionaryItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DictionaryItemDto>> UpdateDictionaryItem(string type, string id, [FromBody] UpdateDictionaryItemRequest request)
    {
        switch (type.ToLower())
        {
            case "categories":
                if (!Guid.TryParse(id, out var catGuid))
                    return BadRequest(new { error = "Неверный формат ID" });
                var catDto = new SK.UpdateCategoryDto { Name = request.Name, Slug = request.Slug };
                var catResult = await _catalogClient.UpdateCategoryAsync(catGuid, catDto);
                if (catResult == null) return NotFound(new { error = "Категория не найдена" });
                return Ok(MapCategoryToDictionaryItem(catResult));
            case "manufacturers":
                if (!Guid.TryParse(id, out var mfrGuid))
                    return BadRequest(new { error = "Неверный формат ID" });
                var mfrDto = new SK.UpdateManufacturerDto { Name = request.Name };
                var mfrResult = await _catalogClient.UpdateManufacturerAsync(mfrGuid, mfrDto);
                if (mfrResult == null) return NotFound(new { error = "Производитель не найден" });
                return Ok(MapManufacturerToDictionaryItem(mfrResult));
            case "attributes":
                var attrResult = await _adminService.UpdateDictionaryItemAsync(type, id, request);
                if (attrResult == null) return NotFound(new { error = "Элемент справочника не найден" });
                return Ok(attrResult);
            default:
                return BadRequest(new { error = $"Неизвестный тип справочника: {type}" });
        }
    }

    /// <summary>Удалить элемент справочника (деактивация)</summary>
    [HttpDelete("dictionaries/{type}/{id}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDictionaryItem(string type, string id)
    {
        switch (type.ToLower())
        {
            case "categories":
                if (!Guid.TryParse(id, out var catGuid))
                    return BadRequest(new { error = "Неверный формат ID" });
                var catResult = await _catalogClient.DeleteCategoryAsync(catGuid);
                if (!catResult) return NotFound(new { error = "Категория не найдена" });
                return NoContent();
            case "manufacturers":
                if (!Guid.TryParse(id, out var mfrGuid))
                    return BadRequest(new { error = "Неверный формат ID" });
                var mfrResult = await _catalogClient.DeleteManufacturerAsync(mfrGuid);
                if (!mfrResult) return NotFound(new { error = "Производитель не найден" });
                return NoContent();
            case "attributes":
                var attrResult = await _adminService.DeleteDictionaryItemAsync(type, id);
                if (!attrResult) return NotFound(new { error = "Элемент справочника не найден" });
                return NoContent();
            default:
                return BadRequest(new { error = $"Неизвестный тип справочника: {type}" });
        }
    }

    // ====================================================================
    // Settings
    // ====================================================================

    /// <summary>Получить настройки сайта</summary>
    [HttpGet("settings")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(SiteSettingsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SiteSettingsDto>> GetSettings()
    {
        var settings = await _adminService.GetSettingsAsync();
        return Ok(settings);
    }

    /// <summary>Обновить настройки сайта</summary>
    [HttpPut("settings")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(SiteSettingsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SiteSettingsDto>> UpdateSettings([FromBody] UpdateSiteSettingsDto update)
    {
        var settings = await _adminService.UpdateSettingsAsync(update);
        return Ok(settings);
    }

    /// <summary>Сбросить настройки сайта к значениям по умолчанию</summary>
    [HttpPost("settings/reset")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(SiteSettingsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SiteSettingsDto>> ResetSettings()
    {
        var settings = await _adminService.ResetSettingsAsync();
        return Ok(settings);
    }

    // ====================================================================
    // Mapping helpers: SharedKernel DTOs → DictionaryItemDto
    // ====================================================================

    private static List<DictionaryItemDto> MapCategoriesToDictionaryItems(List<SK.CategoryDto> categories)
    {
        return categories.Select(c => new DictionaryItemDto
        {
            Id = c.Id.ToString(),
            Name = c.Name,
            Slug = c.Slug,
            IsActive = true,
            ProductCount = c.ProductCount
        }).ToList();
    }

    private static DictionaryItemDto MapCategoryToDictionaryItem(SK.CategoryDto c) => new()
    {
        Id = c.Id.ToString(),
        Name = c.Name,
        Slug = c.Slug,
        IsActive = true,
        ProductCount = c.ProductCount
    };

    private static List<DictionaryItemDto> MapManufacturersToDictionaryItems(List<SK.ManufacturerDto> manufacturers)
    {
        return manufacturers.Select(m => new DictionaryItemDto
        {
            Id = m.Id.ToString(),
            Name = m.Name,
            Slug = m.Name.ToLower().Replace(" ", "-").Replace("!", ""),
            IsActive = true,
            ProductCount = 0,
            Country = m.Country
        }).ToList();
    }

    private static DictionaryItemDto MapManufacturerToDictionaryItem(SK.ManufacturerDto m) => new()
    {
        Id = m.Id.ToString(),
        Name = m.Name,
        Slug = m.Name.ToLower().Replace(" ", "-").Replace("!", ""),
        IsActive = true,
        ProductCount = 0,
        Country = m.Country
    };
}
