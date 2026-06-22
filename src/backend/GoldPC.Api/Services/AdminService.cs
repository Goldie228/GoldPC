using System.Text.Json;
using GoldPC.Api.Controllers;
using GoldPC.Shared.Authorization;
using Microsoft.AspNetCore.Hosting;

namespace GoldPC.Api.Services;

/// <summary>Сервис административной панели с делегированием аутентификации в AuthService</summary>
public class AdminService : IAdminService
{
    private readonly ILogger<AdminService> _logger;
    private readonly IAuthServiceClient _authClient;
    private readonly string _dataDir;
    private readonly string _usersFilePath;
    private readonly string _attributesFilePath;
    private readonly string _settingsFilePath;
    private readonly string _auditLogFilePath;
    private readonly object _lock = new();
    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly List<UserDto> _users = new();
    private readonly List<DictionaryItemDto> _attributes = new();
    private readonly List<AuditLogDto> _auditLogs = new();
    private SiteSettingsDto _settings = new();

    public AdminService(ILogger<AdminService> logger, IWebHostEnvironment env, IAuthServiceClient authClient)
    {
        _logger = logger;
        _authClient = authClient;
        _dataDir = Path.Combine(env.ContentRootPath, "App_Data", "admin");
        _usersFilePath = Path.Combine(_dataDir, "users.json");
        _attributesFilePath = Path.Combine(_dataDir, "attributes.json");
        _settingsFilePath = Path.Combine(_dataDir, "settings.json");
        _auditLogFilePath = Path.Combine(_dataDir, "audit-logs.json");
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
        LoadAuditLogs();
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
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Failed to deserialize users from {Path}, using seed data", _usersFilePath);
            }
            catch (IOException ex)
            {
                _logger.LogWarning(ex, "Failed to read users file {Path}, using seed data", _usersFilePath);
            }
#pragma warning disable CA1031 // Intentional general catch for fail-open file loading
            catch (Exception ex)
#pragma warning restore CA1031
            {
                _logger.LogWarning(ex, "Unexpected error loading users from {Path}, using seed data", _usersFilePath);
            }
        }

        // Файл не существует или повреждён — используем seed-данные
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
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Failed to deserialize attributes from {Path}, using seed data", _attributesFilePath);
            }
            catch (IOException ex)
            {
                _logger.LogWarning(ex, "Failed to read attributes file {Path}, using seed data", _attributesFilePath);
            }
#pragma warning disable CA1031 // Intentional general catch for fail-open file loading
            catch (Exception ex)
#pragma warning restore CA1031
            {
                _logger.LogWarning(ex, "Unexpected error loading attributes from {Path}, using seed data", _attributesFilePath);
            }
        }

        // Файл не существует или повреждён — используем seed-данные
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
                    lock (_lock) { Interlocked.Exchange(ref _settings, settings); }
                    _logger.LogInformation("Loaded settings from {Path}", _settingsFilePath);
                    return;
                }
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Failed to deserialize settings from {Path}, using defaults", _settingsFilePath);
            }
            catch (IOException ex)
            {
                _logger.LogWarning(ex, "Failed to read settings file {Path}, using defaults", _settingsFilePath);
            }
#pragma warning disable CA1031 // Intentional general catch for fail-open file loading
            catch (Exception ex)
#pragma warning restore CA1031
            {
                _logger.LogWarning(ex, "Unexpected error loading settings from {Path}, using defaults", _settingsFilePath);
            }
        }

        // Файл не существует или повреждён — используем значения по умолчанию
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

    private void LoadAuditLogs()
    {
        if (File.Exists(_auditLogFilePath))
        {
            try
            {
                var json = File.ReadAllText(_auditLogFilePath);
                var logs = JsonSerializer.Deserialize<List<AuditLogDto>>(json, _jsonOptions);
                if (logs != null && logs.Count > 0)
                {
                    lock (_lock)
                    {
                        _auditLogs.Clear();
                        _auditLogs.AddRange(logs);
                    }
                    _logger.LogInformation("Loaded {Count} audit logs from {Path}", _auditLogs.Count, _auditLogFilePath);
                    return;
                }
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Failed to deserialize audit logs from {Path}, using seed data", _auditLogFilePath);
            }
            catch (IOException ex)
            {
                _logger.LogWarning(ex, "Failed to read audit logs file {Path}, using seed data", _auditLogFilePath);
            }
#pragma warning disable CA1031 // Intentional general catch for fail-open file loading
            catch (Exception ex)
#pragma warning restore CA1031
            {
                _logger.LogWarning(ex, "Unexpected error loading audit logs from {Path}, using seed data", _auditLogFilePath);
            }
        }

        // Файл не существует или повреждён — используем seed-данные
        lock (_lock)
        {
            _auditLogs.AddRange(GenerateAuditLogs());
        }
        SaveAuditLogs();
    }

    private void SaveAuditLogs()
    {
        lock (_lock)
        {
            var json = JsonSerializer.Serialize(_auditLogs, _jsonOptions);
            File.WriteAllText(_auditLogFilePath, json);
        }
    }

    // ====================================================================
    // Пользователи
    // ====================================================================

    /// <inheritdoc/>
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

    /// <inheritdoc/>
    public Task<UserDto?> GetUserByIdAsync(Guid id)
    {
        var user = _users.Find(u => u.Id == id);
        return Task.FromResult(user);
    }

    /// <inheritdoc/>
    public Task<int> GetTotalUsersCountAsync()
    {
        return Task.FromResult(_users.Count);
    }

    /// <inheritdoc/>
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

        _ = _authClient.UpdateUserAsync(id, updated.FirstName, updated.LastName, updated.Phone);

        return Task.FromResult<UserDto?>(updated);
    }

    /// <inheritdoc/>
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

        _ = _authClient.UpdateUserRoleAsync(id, role);

        return Task.FromResult<UserDto?>(updated);
    }

    /// <inheritdoc/>
    public async Task<UserDto?> DeactivateUserAsync(Guid id)
    {
        var authSuccess = await _authClient.DeactivateUserAsync(id);
        if (!authSuccess)
        {
            _logger.LogWarning("AuthService DeactivateUser failed for user {UserId}, local deactivation skipped", id);
            throw new InvalidOperationException("Не удалось деактивировать пользователя в сервисе аутентификации");
        }

        return await SetUserActiveAsync(id, false);
    }

    /// <inheritdoc/>
    public async Task<UserDto?> ActivateUserAsync(Guid id)
    {
        var authSuccess = await _authClient.ActivateUserAsync(id);
        if (!authSuccess)
        {
            _logger.LogWarning("AuthService ActivateUser failed for user {UserId}, local activation skipped", id);
            throw new InvalidOperationException("Не удалось активировать пользователя в сервисе аутентификации");
        }

        return await SetUserActiveAsync(id, true);
    }

    /// <inheritdoc/>
    public async Task<bool> DeleteUserAsync(Guid id)
    {
        var authSuccess = await _authClient.DeleteUserAsync(id);
        if (!authSuccess)
        {
            _logger.LogWarning("AuthService DeleteUser failed for user {UserId}, local deletion skipped", id);
            return false;
        }

        lock (_lock)
        {
            var index = _users.FindIndex(u => u.Id == id);
            if (index == -1) return false;

            var existing = _users[index];
            _users[index] = existing with
            {
                IsActive = false,
                UpdatedAt = DateTime.UtcNow
            };
        }

        SaveUsers();
        _logger.LogInformation("User {UserId} deactivated (delete) by admin via AuthService", id);
        return true;
    }

    // ====================================================================
    // Создание пользователя
    // ====================================================================

    /// <inheritdoc/>
    public async Task<UserDto> CreateUserAsync(CreateUserDto create)
    {
        // Проверка на дубликат email
        if (_users.Any(u => u.Email.Equals(create.Email, StringComparison.OrdinalIgnoreCase)))
            throw new InvalidOperationException("Пользователь с таким email уже существует");

        // Создаём пользователя в AuthService (хранение пароля, генерация хеша)
        Guid userId;
        try
        {
            userId = await _authClient.CreateUserAsync(
                create.FirstName, create.LastName, create.Email, create.Password,
                string.IsNullOrWhiteSpace(create.Role) ? "Client" : create.Role);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Failed to create user {Email} in AuthService: {Message}", create.Email, ex.Message);
            throw new InvalidOperationException("Не удалось создать пользователя в сервисе аутентификации", ex);
        }

        var user = new UserDto
        {
            Id = userId,
            Email = create.Email,
            Role = string.IsNullOrWhiteSpace(create.Role) ? "Client" : create.Role,
            FirstName = create.FirstName,
            LastName = create.LastName,
            Phone = create.Phone,
            IsActive = true,
            IsEmailVerified = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        lock (_lock)
        {
            _users.Add(user);
        }

        SaveUsers();
        _logger.LogInformation("User {UserId} ({Email}) created by admin via AuthService", user.Id, user.Email);
        return user;
    }

    /// <inheritdoc/>
    public async Task<bool> ResetUserPasswordAsync(Guid id, ResetPasswordDto reset)
    {
        var user = _users.Find(u => u.Id == id);
        if (user == null)
            return false;

        var success = await _authClient.ResetUserPasswordAsync(id, reset.NewPassword);
        if (success)
        {
            _logger.LogInformation("Password reset for user {UserId} by admin via AuthService", id);
        }
        else
        {
            _logger.LogWarning("AuthService password reset failed for user {UserId}", id);
        }

        return success;
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
    // Справочники (только атрибуты — категории/производители через CatalogService)
    // ====================================================================

    /// <inheritdoc/>
    public Task<List<DictionaryItemDto>> GetDictionaryAsync(string type)
    {
        var items = type.ToLower() switch
        {
            "attributes" => _attributes,
            _ => new List<DictionaryItemDto>()
        };

        return Task.FromResult(items.ToList());
    }

    /// <inheritdoc/>
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

    /// <inheritdoc/>
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

    /// <inheritdoc/>
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
    // Настройки
    // ====================================================================

    /// <inheritdoc/>
    public Task<SiteSettingsDto> GetSettingsAsync()
    {
        return Task.FromResult(_settings);
    }

    /// <inheritdoc/>
    public async Task<SiteSettingsDto> UpdateSettingsAsync(UpdateSiteSettingsDto update)
    {
        lock (_lock)
        {
            var updated = _settings with
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
            Interlocked.Exchange(ref _settings, updated);
        }

        SaveSettings();

        // Синхронизируем TwoFactorRequired с AuthService
        if (update.TwoFactorRequired.HasValue)
        {
            await _authClient.SetTwoFactorRequiredAsync(update.TwoFactorRequired.Value);
        }

        _logger.LogInformation("Site settings updated by admin");
        return _settings;
    }

    /// <inheritdoc/>
    public async Task<SiteSettingsDto> ResetSettingsAsync()
    {
        lock (_lock)
        {
            Interlocked.Exchange(ref _settings, new SiteSettingsDto());
        }

        SaveSettings();

        // При сбросе TwoFactorRequired становится false (default)
        await _authClient.SetTwoFactorRequiredAsync(false);

        _logger.LogInformation("Site settings reset to defaults by admin");
        return _settings;
    }

    // ====================================================================
    // Аудит-логи
    // ====================================================================

    /// <inheritdoc/>
    public Task<PagedResult<AuditLogDto>> GetAuditLogsAsync(int page, int pageSize, string? actionType, string? severity, DateTime? startDate, DateTime? endDate)
    {
        var query = _auditLogs.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(actionType))
            query = query.Where(l => l.ActionType.Equals(actionType, StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrWhiteSpace(severity))
            query = query.Where(l => l.Severity.Equals(severity, StringComparison.OrdinalIgnoreCase));

        if (startDate.HasValue)
            query = query.Where(l => l.CreatedAt >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(l => l.CreatedAt <= endDate.Value);

        var result = ToPagedResult(query.OrderByDescending(l => l.CreatedAt), page, pageSize);
        return Task.FromResult(result);
    }

    /// <inheritdoc/>
    public Task AddAuditLogAsync(string actionType, string userId, string userName, string userEmail, string description, string severity = "INFO", string? additionalData = null)
    {
        var log = new AuditLogDto
        {
            Id = Guid.NewGuid().ToString(),
            ActionType = actionType,
            UserId = userId,
            UserName = userName,
            UserEmail = userEmail,
            IpAddress = "",
            Description = description,
            AdditionalData = additionalData,
            CreatedAt = DateTime.UtcNow,
            Severity = severity
        };

        lock (_lock)
        {
            _auditLogs.Add(log);
        }

        SaveAuditLogs();
        return Task.CompletedTask;
    }

    // ====================================================================
    // Статистика дашборда (графики, спарклайны, активность)
    // ====================================================================

    /// <inheritdoc/>
    public Task<ChartResponseDto> GetChartAsync(string period)
    {
        var now = DateTime.UtcNow;
        var rng = new Random(42); // детерминированный seed для стабильности
        var totalOrders = _auditLogs.Count(l => l.ActionType.Contains("ORDER", StringComparison.OrdinalIgnoreCase)) * 5 + 120;
        var baseRevenue = totalOrders * 185m;

        var (ordersPoints, revenuePoints) = period.ToLower() switch
        {
            "today" => GenerateHourlyChart(totalOrders, baseRevenue, rng),
            "week" => GenerateWeeklyChart(totalOrders, baseRevenue, rng),
            "month" => GenerateMonthlyChart(totalOrders, baseRevenue, rng),
            "year" => GenerateYearlyChart(totalOrders, baseRevenue, rng),
            _ => GenerateMonthlyChart(totalOrders, baseRevenue, rng)
        };

        return Task.FromResult(new ChartResponseDto
        {
            Orders = ordersPoints,
            Revenue = revenuePoints
        });
    }

    /// <inheritdoc/>
    public Task<SparklinesResponseDto> GetSparklinesAsync(string period)
    {
        var rng = new Random(42);
        var userCount = _users.Count;
        var totalOrders = _auditLogs.Count(l => l.ActionType.Contains("ORDER", StringComparison.OrdinalIgnoreCase)) * 5 + 120;

        return Task.FromResult(new SparklinesResponseDto
        {
            Users = GenerateSparkline(userCount, period, rng),
            Orders = GenerateSparkline(totalOrders, period, rng),
            Revenue = GenerateSparkline(totalOrders * 185, period, rng)
        });
    }

    /// <inheritdoc/>
    public Task<ActivityResponseDto> GetActivityAsync()
    {
        var activities = new List<ActivityItemDto>();

        // Последние аудит-логи как основа ленты активности
        var recentLogs = _auditLogs
            .OrderByDescending(l => l.CreatedAt)
            .Take(10)
            .ToList();

        foreach (var log in recentLogs)
        {
            var activity = MapAuditActionToActivity(log.ActionType);
            var timeAgo = FormatTimeAgo(log.CreatedAt);

            activities.Add(new ActivityItemDto
            {
                Id = log.Id,
                Type = activity.Type,
                Text = log.Description,
                Time = timeAgo,
                Icon = activity.Icon,
                Color = activity.Color
            });
        }

        // Если мало логов — добавляем генерируемые события
        if (activities.Count < 5)
        {
            activities.AddRange(GenerateFallbackActivities());
        }

        return Task.FromResult(new ActivityResponseDto { Items = activities });
    }

    // ====================================================================
    // Вспомогательные методы для графиков
    // ====================================================================

    private static (List<ChartPointDto> Orders, List<ChartPointDto> Revenue) GenerateHourlyChart(
        int totalOrders, decimal baseRevenue, Random rng)
    {
        var hours = new[] { "00", "04", "08", "12", "16", "20" };
        var ordersPoints = new List<ChartPointDto>();
        var revenuePoints = new List<ChartPointDto>();

        // Распределяем заказы по часам с реалистичным паттерном (пик днём)
        var weights = new[] { 0.5, 0.7, 1.5, 2.0, 1.8, 0.8 };
        var totalWeight = weights.Sum();

        for (var i = 0; i < hours.Length; i++)
        {
            var orderCount = Math.Max(1, (int)(totalOrders * 0.1 * weights[i] / totalWeight + rng.Next(-2, 3)));
            var avgRevenuePerOrder = baseRevenue / totalOrders;
            var revenue = orderCount * avgRevenuePerOrder * (0.9m + (decimal)rng.NextDouble() * 0.2m);

            ordersPoints.Add(new ChartPointDto { Label = hours[i], Value = orderCount });
            revenuePoints.Add(new ChartPointDto { Label = hours[i], Value = Math.Round(revenue, 2) });
        }

        return (ordersPoints, revenuePoints);
    }

    private static (List<ChartPointDto> Orders, List<ChartPointDto> Revenue) GenerateWeeklyChart(
        int totalOrders, decimal baseRevenue, Random rng)
    {
        var dayNames = new[] { "Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс" };
        var ordersPoints = new List<ChartPointDto>();
        var revenuePoints = new List<ChartPointDto>();

        // Выходные — пик заказов
        var weights = new[] { 1.0, 1.1, 1.2, 1.3, 1.5, 1.8, 0.9 };
        var totalWeight = weights.Sum();
        var weeklyTotal = totalOrders * 0.12;

        for (var i = 0; i < dayNames.Length; i++)
        {
            var orderCount = Math.Max(1, (int)(weeklyTotal * weights[i] / totalWeight + rng.Next(-3, 4)));
            var avgRevenuePerOrder = baseRevenue / totalOrders;
            var revenue = orderCount * avgRevenuePerOrder * (0.85m + (decimal)rng.NextDouble() * 0.3m);

            ordersPoints.Add(new ChartPointDto { Label = dayNames[i], Value = orderCount });
            revenuePoints.Add(new ChartPointDto { Label = dayNames[i], Value = Math.Round(revenue, 2) });
        }

        return (ordersPoints, revenuePoints);
    }

    private static (List<ChartPointDto> Orders, List<ChartPointDto> Revenue) GenerateMonthlyChart(
        int totalOrders, decimal baseRevenue, Random rng)
    {
        var points = new[] { 1, 5, 10, 15, 20, 25, 30 };
        var ordersPoints = new List<ChartPointDto>();
        var revenuePoints = new List<ChartPointDto>();

        var monthlyTotal = totalOrders * 0.5;
        var trend = 1.0;
        var avgRevenuePerOrder = baseRevenue / totalOrders;

        for (var i = 0; i < points.Length; i++)
        {
            trend += rng.NextDouble() * 0.1 - 0.03;
            var orderCount = Math.Max(1, (int)(monthlyTotal / points.Length * trend + rng.Next(-5, 6)));
            var revenue = orderCount * avgRevenuePerOrder * (0.8m + (decimal)rng.NextDouble() * 0.4m);

            ordersPoints.Add(new ChartPointDto { Label = points[i].ToString(), Value = orderCount });
            revenuePoints.Add(new ChartPointDto { Label = points[i].ToString(), Value = Math.Round(revenue, 2) });
        }

        return (ordersPoints, revenuePoints);
    }

    private static (List<ChartPointDto> Orders, List<ChartPointDto> Revenue) GenerateYearlyChart(
        int totalOrders, decimal baseRevenue, Random rng)
    {
        var months = new[] { "Янв", "Мар", "Май", "Июл", "Сен", "Ноя" };
        var ordersPoints = new List<ChartPointDto>();
        var revenuePoints = new List<ChartPointDto>();

        var yearlyTotal = totalOrders;
        var seasonalWeights = new[] { 0.7, 0.8, 0.9, 1.0, 0.85, 0.95 };
        var avgRevenuePerOrder = baseRevenue / totalOrders;

        for (var i = 0; i < months.Length; i++)
        {
            var orderCount = Math.Max(1, (int)(yearlyTotal / months.Length * seasonalWeights[i] + rng.Next(-10, 11)));
            var revenue = orderCount * avgRevenuePerOrder * (0.75m + (decimal)rng.NextDouble() * 0.5m);

            ordersPoints.Add(new ChartPointDto { Label = months[i], Value = orderCount });
            revenuePoints.Add(new ChartPointDto { Label = months[i], Value = Math.Round(revenue, 2) });
        }

        return (ordersPoints, revenuePoints);
    }

    // ====================================================================
    // Вспомогательные методы для спарклайнов
    // ====================================================================

    private static List<decimal> GenerateSparkline(decimal baseValue, string period, Random rng)
    {
        var count = period.ToLower() switch
        {
            "today" => 10,
            "week" => 7,
            "month" => 12,
            "year" => 12,
            _ => 12
        };

        var points = new List<decimal>();
        var current = baseValue * 0.7m;

        for (var i = 0; i < count; i++)
        {
            var multiplier = baseValue * 0.05m;
            var delta = multiplier * (decimal)(rng.NextDouble() * 2 - 0.5);
            current = Math.Max(0, current + delta);
            points.Add(Math.Round(current, 0));
        }

        return points;
    }

    // ====================================================================
    // Вспомогательные методы для ленты активности
    // ====================================================================

    private static (string Type, string Icon, string Color) MapAuditActionToActivity(string actionType)
    {
        return actionType.ToUpperInvariant() switch
        {
            "USER_LOGIN" => ("registration", "UserPlus", "text-info-blue"),
            "USER_CREATED" => ("registration", "UserPlus", "text-info-blue"),
            "USER_ACTIVATED" => ("registration", "UserPlus", "text-info-blue"),
            "USER_UPDATED" => ("order", "Users", "text-gold"),
            "USER_DELETED" => ("order", "Users", "text-price-rise"),
            "USER_ROLE_CHANGED" => ("order", "Users", "text-gold"),
            "PRODUCT_CREATED" => ("product", "Package", "text-gold"),
            "PRODUCT_UPDATED" => ("product", "TrendingUp", "text-gold"),
            "PRODUCT_DELETED" => ("product", "Package", "text-price-rise"),
            "ORDER_STATUS_CHANGED" => ("order", "ShoppingCart", "text-gold"),
            "SETTINGS_UPDATED" => ("service", "Zap", "text-accent-turquoise"),
            "MAINTENANCE_MODE_ENABLED" or "MAINTENANCE_MODE_DISABLED" => ("service", "Zap", "text-accent-turquoise"),
            "SECURITY_EVENT" => ("service", "AlertTriangle", "text-price-rise"),
            _ => ("order", "Activity", "text-gold")
        };
    }

    private static string FormatTimeAgo(DateTime dateTime)
    {
        var diff = DateTime.UtcNow - dateTime;

        return diff.TotalMinutes switch
        {
            < 1 => "только что",
            < 60 => $"{(int)diff.TotalMinutes} мин назад",
            < 1440 => $"{(int)diff.TotalHours} ч назад",
            < 10080 => $"{(int)diff.TotalDays} дн назад",
            _ => dateTime.ToString("dd.MM.yyyy")
        };
    }

    private static List<ActivityItemDto> GenerateFallbackActivities()
    {
        var now = DateTime.UtcNow;
        return new List<ActivityItemDto>
        {
            new() { Id = "seed-1", Type = "order", Text = "Новый заказ #1847 на сумму 2 450 BYN", Time = "5 мин назад", Icon = "ShoppingCart", Color = "text-gold" },
            new() { Id = "seed-2", Type = "registration", Text = "Зарегистрирован новый пользователь client@goldpc.by", Time = "12 мин назад", Icon = "UserPlus", Color = "text-info-blue" },
            new() { Id = "seed-3", Type = "review", Text = "Новый отзыв на ASUS ROG Strix G16 — ★★★★★", Time = "28 мин назад", Icon = "Star", Color = "text-price-drop" },
            new() { Id = "seed-4", Type = "order", Text = "Заказ #1845 доставлен клиенту", Time = "1 час назад", Icon = "Package", Color = "text-price-drop" },
            new() { Id = "seed-5", Type = "product", Text = "Обновлена цена на MSI GeForce RTX 4070", Time = "2 часа назад", Icon = "TrendingUp", Color = "text-gold" },
        };
    }

    // ====================================================================
    // Вспомогательные методы
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
    // Seed-данные: Пользователи
    // ====================================================================
    private static List<UserDto> GenerateUsers()
    {
        var users = new List<UserDto>
        {
            new() { Id = Guid.Parse("a0000001-0000-0000-0000-000000000001"), Email = "admin@goldpc.by", Role = Roles.Admin, FirstName = "Админ", LastName = "Системы", Phone = "+375291111111", IsActive = true, IsEmailVerified = true, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new() { Id = Guid.Parse("a0000001-0000-0000-0000-000000000002"), Email = "manager@goldpc.by", Role = Roles.Manager, FirstName = "Менеджер", LastName = "Тестовый", Phone = "+375292222222", IsActive = true, IsEmailVerified = true, CreatedAt = new DateTime(2024, 2, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 2, 1, 0, 0, 0, DateTimeKind.Utc) },
            new() { Id = Guid.Parse("a0000001-0000-0000-0000-000000000003"), Email = "master@goldpc.by", Role = Roles.Master, FirstName = "Мастер", LastName = "Тестовый", Phone = "+375293333333", IsActive = true, IsEmailVerified = true, CreatedAt = new DateTime(2024, 3, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 3, 1, 0, 0, 0, DateTimeKind.Utc) },
            new() { Id = Guid.Parse("a0000001-0000-0000-0000-000000000004"), Email = "accountant@goldpc.by", Role = "Accountant", FirstName = "Бухгалтер", LastName = "Тестовый", Phone = "+375294444444", IsActive = true, IsEmailVerified = true, CreatedAt = new DateTime(2024, 4, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 4, 1, 0, 0, 0, DateTimeKind.Utc) },
            new() { Id = Guid.Parse("a0000001-0000-0000-0000-000000000005"), Email = "client@goldpc.by", Role = "Client", FirstName = "Клиент", LastName = "Тестовый", Phone = "+375295555555", IsActive = true, IsEmailVerified = true, CreatedAt = new DateTime(2024, 5, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 5, 1, 0, 0, 0, DateTimeKind.Utc) },
            new() { Id = Guid.Parse("a0000001-0000-0000-0000-000000000006"), Email = "ivan@example.com", Role = "Client", FirstName = "Иван", LastName = "Петров", IsActive = true, IsEmailVerified = true, CreatedAt = new DateTime(2024, 6, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 6, 1, 0, 0, 0, DateTimeKind.Utc) },
            new() { Id = Guid.Parse("a0000001-0000-0000-0000-000000000007"), Email = "elena@example.com", Role = "Client", FirstName = "Елена", LastName = "Смирнова", IsActive = true, IsEmailVerified = true, CreatedAt = new DateTime(2024, 7, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 7, 1, 0, 0, 0, DateTimeKind.Utc) },
            new() { Id = Guid.Parse("a0000001-0000-0000-0000-000000000008"), Email = "dmitry@example.com", Role = "Client", FirstName = "Дмитрий", LastName = "Козлов", IsActive = false, IsEmailVerified = true, CreatedAt = new DateTime(2024, 8, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 8, 15, 0, 0, 0, DateTimeKind.Utc) },
            new() { Id = Guid.Parse("a0000001-0000-0000-0000-000000000009"), Email = "anna@example.com", Role = Roles.Manager, FirstName = "Анна", LastName = "Соколова", IsActive = true, IsEmailVerified = true, CreatedAt = new DateTime(2024, 9, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 9, 1, 0, 0, 0, DateTimeKind.Utc) },
            new() { Id = Guid.Parse("a0000001-0000-0000-0000-000000000010"), Email = "mikhail@example.com", Role = Roles.Master, FirstName = "Михаил", LastName = "Новиков", IsActive = true, IsEmailVerified = true, CreatedAt = new DateTime(2024, 10, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 10, 1, 0, 0, 0, DateTimeKind.Utc) }
        };

        return users;
    }

    // ====================================================================
    // Seed-данные: Атрибуты
    // ====================================================================
    private static List<DictionaryItemDto> GenerateAttributes()
    {
        var data = new (string Name, string Slug, bool IsActive)[]
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
            Name = d.Name,
            Slug = d.Slug,
            IsActive = d.IsActive
        }).ToList();
    }

    // ====================================================================
    // Seed-данные: Аудит-логи
    // ====================================================================
    private static List<AuditLogDto> GenerateAuditLogs()
    {
        var now = DateTime.UtcNow;
        return new List<AuditLogDto>
        {
            new()
            {
                Id = Guid.NewGuid().ToString(),
                ActionType = "USER_LOGIN",
                UserId = "a0000001-0000-0000-0000-000000000001",
                UserName = "Админ Системы",
                UserEmail = "admin@goldpc.by",
                Description = "Вход в систему",
                CreatedAt = now.AddDays(-1),
                Severity = "INFO"
            },
            new()
            {
                Id = Guid.NewGuid().ToString(),
                ActionType = "USER_CREATED",
                UserId = "a0000001-0000-0000-0000-000000000001",
                UserName = "Админ Системы",
                UserEmail = "admin@goldpc.by",
                Description = "Создан пользователь client@goldpc.by",
                CreatedAt = now.AddDays(-2),
                Severity = "INFO"
            },
            new()
            {
                Id = Guid.NewGuid().ToString(),
                ActionType = "USER_UPDATED",
                UserId = "a0000001-0000-0000-0000-000000000001",
                UserName = "Админ Системы",
                UserEmail = "admin@goldpc.by",
                Description = "Обновлён пользователь ivan@example.com",
                CreatedAt = now.AddDays(-3),
                Severity = "INFO"
            },
            new()
            {
                Id = Guid.NewGuid().ToString(),
                ActionType = "SETTINGS_UPDATED",
                UserId = "a0000001-0000-0000-0000-000000000001",
                UserName = "Админ Системы",
                UserEmail = "admin@goldpc.by",
                Description = "Обновлены настройки сайта",
                CreatedAt = now.AddDays(-5),
                Severity = "WARNING"
            },
            new()
            {
                Id = Guid.NewGuid().ToString(),
                ActionType = "USER_DELETED",
                UserId = "a0000001-0000-0000-0000-000000000001",
                UserName = "Админ Системы",
                UserEmail = "admin@goldpc.by",
                Description = "Деактивирован пользователь dmitry@example.com",
                CreatedAt = now.AddDays(-7),
                Severity = "WARNING"
            },
            new()
            {
                Id = Guid.NewGuid().ToString(),
                ActionType = "PRODUCT_CREATED",
                UserId = "a0000001-0000-0000-0000-000000000002",
                UserName = "Менеджер Тестовый",
                UserEmail = "manager@goldpc.by",
                Description = "Создан товар: Видеокарта NVIDIA RTX 4070",
                CreatedAt = now.AddDays(-10),
                Severity = "INFO"
            },
            new()
            {
                Id = Guid.NewGuid().ToString(),
                ActionType = "PRODUCT_UPDATED",
                UserId = "a0000001-0000-0000-0000-000000000002",
                UserName = "Менеджер Тестовый",
                UserEmail = "manager@goldpc.by",
                Description = "Обновлён товар: Процессор Intel Core i7-14700K",
                CreatedAt = now.AddDays(-14),
                Severity = "INFO"
            },
            new()
            {
                Id = Guid.NewGuid().ToString(),
                ActionType = "USER_ROLE_CHANGED",
                UserId = "a0000001-0000-0000-0000-000000000001",
                UserName = "Админ Системы",
                UserEmail = "admin@goldpc.by",
                Description = "Изменена роль пользователя anna@example.com на Manager",
                CreatedAt = now.AddDays(-20),
                Severity = "WARNING"
            }
        };
    }
}
