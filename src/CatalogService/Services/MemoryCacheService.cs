using System.Collections.Concurrent;

namespace CatalogService.Services;

/// <summary>
/// In-memory кэш на основе ConcurrentDictionary с поддержкой TTL.
/// Используется как fallback при недоступности Redis.
/// </summary>
public sealed class MemoryCacheService : ICacheService
{
    private readonly ConcurrentDictionary<string, CacheEntry> _cache = new();
    private readonly ILogger<MemoryCacheService> _logger;

    public MemoryCacheService(ILogger<MemoryCacheService> logger)
    {
        _logger = logger;
    }

    public Task<string?> GetAsync(string key, CancellationToken cancellationToken = default)
    {
        if (_cache.TryGetValue(key, out var entry))
        {
            if (entry.ExpiresAt > DateTime.UtcNow)
            {
                _logger.LogDebug("MemoryCache: чтение ключа '{Key}'", key);
                return Task.FromResult<string?>(entry.Value);
            }

            // Кэш истёк — удаляем
            _cache.TryRemove(key, out _);
            _logger.LogDebug("MemoryCache: ключ '{Key}' истёк, удалён", key);
        }

        return Task.FromResult<string?>(null);
    }

    public Task SetAsync(string key, string value, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
    {
        var expiresAt = DateTime.UtcNow + (expiration ?? TimeSpan.FromMinutes(5));
        var entry = new CacheEntry(value, expiresAt);
        _cache[key] = entry;

        _logger.LogDebug("MemoryCache: сохранён ключ '{Key}', истекает {ExpiresAt}", key, expiresAt);
        return Task.CompletedTask;
    }

    public Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        _cache.TryRemove(key, out _);
        _logger.LogDebug("MemoryCache: удалён ключ '{Key}'", key);
        return Task.CompletedTask;
    }

    /// <summary>
    /// Запись кэша с временем истечения.
    /// </summary>
    private sealed record CacheEntry(string Value, DateTime ExpiresAt);
}