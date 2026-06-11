using System.Collections.Concurrent;
using System.Text.Json;
using GoldPC.Shared.Entities;
using Microsoft.AspNetCore.Hosting;

namespace GoldPC.Api.Services;

/// <summary>
/// Per-user notification preferences persisted as JSON files.
/// Pattern: App_Data/notifications/preferences_{userId}.json
/// Default: all notification types enabled.
/// </summary>
public class UserNotificationPreferenceService
{
    private readonly string _dataDir;
    private readonly ILogger<UserNotificationPreferenceService> _logger;
    private static readonly ConcurrentDictionary<Guid, UserNotificationPrefs> _cache = new();

    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private static readonly string[] AllTypes =
    [
        "orderStatusChanged",
        "lowStockAlert",
        "loginNotification",
        "systemAnnouncement",
        "newSupportMessage"
    ];

    public UserNotificationPreferenceService(IWebHostEnvironment env, ILogger<UserNotificationPreferenceService> logger)
    {
        _dataDir = Path.Combine(env.ContentRootPath, "App_Data", "notifications");
        _logger = logger;
        Directory.CreateDirectory(_dataDir);
    }

    /// <summary>
    /// Get user's notification preferences. Returns defaults (all true) if no file exists.
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public async Task<UserNotificationPrefs> GetPreferencesAsync(Guid userId)
    {
        if (_cache.TryGetValue(userId, out var cached))
            return cached;

        var filePath = GetFilePath(userId);
        UserNotificationPrefs prefs;

        if (File.Exists(filePath))
        {
            try
            {
                var json = await File.ReadAllTextAsync(filePath);
                var loaded = JsonSerializer.Deserialize<UserNotificationPrefs>(json, _jsonOptions);
                if (loaded != null)
                {
                    prefs = loaded;
                    _cache[userId] = prefs;
                    _logger.LogDebug("Loaded notification preferences for user {UserId}", userId);
                    return prefs;
                }
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Failed to deserialize notification preferences for user {UserId}, using defaults", userId);
            }
            catch (IOException ex)
            {
                _logger.LogWarning(ex, "Failed to read notification preferences file for user {UserId}, using defaults", userId);
            }
#pragma warning disable CA1031 // Intentional general catch for fail-open file loading
            catch (Exception ex)
#pragma warning restore CA1031
            {
                _logger.LogWarning(ex, "Unexpected error loading notification preferences for user {UserId}, using defaults", userId);
            }
        }

        prefs = new UserNotificationPrefs();
        _cache[userId] = prefs;
        return prefs;
    }

    /// <summary>
    /// Save user's notification preferences to JSON file and update cache.
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public async Task<UserNotificationPrefs> SavePreferencesAsync(Guid userId, UserNotificationPrefs prefs)
    {
        var filePath = GetFilePath(userId);
        var json = JsonSerializer.Serialize(prefs, _jsonOptions);
        await File.WriteAllTextAsync(filePath, json);
        _cache[userId] = prefs;
        _logger.LogInformation("Saved notification preferences for user {UserId}", userId);
        return prefs;
    }

    /// <summary>
    /// Check if a user has opted in for a specific notification type.
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public async Task<bool> IsOptedInAsync(Guid userId, string notificationType)
    {
        if (!AllTypes.Contains(notificationType, StringComparer.OrdinalIgnoreCase))
            return true; // unknown types default to enabled

        var prefs = await GetPreferencesAsync(userId);
        return notificationType.ToLowerInvariant() switch
        {
            "orderstatuschanged" => prefs.OrderStatusChanged,
            "lowstockalert" => prefs.LowStockAlert,
            "loginnotification" => prefs.LoginNotification,
            "systemannouncement" => prefs.SystemAnnouncement,
            "newsupportmessage" => prefs.NewSupportMessage,
            _ => true
        };
    }

    private string GetFilePath(Guid userId)
        => Path.Combine(_dataDir, $"preferences_{userId}.json");
}

/// <summary>
/// User notification preferences DTO.
/// Maps to frontend JSON keys: orderStatusChanged, lowStockAlert, etc.
/// </summary>
public record UserNotificationPrefs
{
    public bool OrderStatusChanged { get; init; } = true;
    public bool LowStockAlert { get; init; } = true;
    public bool LoginNotification { get; init; } = true;
    public bool SystemAnnouncement { get; init; } = true;
    public bool NewSupportMessage { get; init; } = true;
}

/// <summary>
/// Partial update DTO for user notification preferences.
/// All fields are nullable — only provided fields will be updated.
/// </summary>
public record UserNotificationPrefsUpdate
{
    public bool? OrderStatusChanged { get; init; }
    public bool? LowStockAlert { get; init; }
    public bool? LoginNotification { get; init; }
    public bool? SystemAnnouncement { get; init; }
    public bool? NewSupportMessage { get; init; }
}
