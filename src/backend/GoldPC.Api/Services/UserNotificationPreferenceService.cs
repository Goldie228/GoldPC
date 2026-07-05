using System.Collections.Concurrent;
using System.Text.Json;
using GoldPC.Shared.Entities;
using Microsoft.AspNetCore.Hosting;

namespace GoldPC.Api.Services;

/// <summary>
/// Предпочтения уведомлений пользователя, сохраняемые в JSON-файлах.
/// Шаблон: App_Data/notifications/preferences_{userId}.json
/// По умолчанию: все типы уведомлений включены.
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
    /// Получает предпочтения уведомлений пользователя. Возвращает значения по умолчанию (все true), если файл не существует.
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
                    _logger.LogDebug("Загружены предпочтения уведомлений для пользователя {UserId}", userId);
                    return prefs;
                }
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Не удалось десериализовать предпочтения уведомлений для пользователя {UserId}, используются значения по умолчанию", userId);
            }
            catch (IOException ex)
            {
                _logger.LogWarning(ex, "Не удалось прочитать файл предпочтений уведомлений для пользователя {UserId}, используются значения по умолчанию", userId);
            }
#pragma warning disable CA1031 // Намеренный общий перехват для fail-open загрузки файла
            catch (Exception ex)
#pragma warning restore CA1031
            {
                _logger.LogWarning(ex, "Неожиданная ошибка при загрузке предпочтений уведомлений для пользователя {UserId}, используются значения по умолчанию", userId);
            }
        }

        prefs = new UserNotificationPrefs();
        _cache[userId] = prefs;
        return prefs;
    }

    /// <summary>
    /// Сохраняет предпочтения уведомлений пользователя в JSON файл и обновляет кеш.
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public async Task<UserNotificationPrefs> SavePreferencesAsync(Guid userId, UserNotificationPrefs prefs)
    {
        var filePath = GetFilePath(userId);
        var json = JsonSerializer.Serialize(prefs, _jsonOptions);
        await File.WriteAllTextAsync(filePath, json);
        _cache[userId] = prefs;
        _logger.LogInformation("Сохранены предпочтения уведомлений для пользователя {UserId}", userId);
        return prefs;
    }

    /// <summary>
    /// Проверяет, подписан ли пользователь на конкретный тип уведомления.
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public async Task<bool> IsOptedInAsync(Guid userId, string notificationType)
    {
        if (!AllTypes.Contains(notificationType, StringComparer.OrdinalIgnoreCase))
            return true; // неизвестные типы по умолчанию включены

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
/// DTO предпочтений уведомлений пользователя.
/// Сопоставляется с JSON-ключами фронтенда: orderStatusChanged, lowStockAlert, etc.
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
/// DTO частичного обновления предпочтений уведомлений пользователя.
/// Все поля nullable — будут обновлены только указанные поля.
/// </summary>
public record UserNotificationPrefsUpdate
{
    public bool? OrderStatusChanged { get; init; }
    public bool? LowStockAlert { get; init; }
    public bool? LoginNotification { get; init; }
    public bool? SystemAnnouncement { get; init; }
    public bool? NewSupportMessage { get; init; }
}
