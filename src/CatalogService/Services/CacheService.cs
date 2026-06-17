using Microsoft.Extensions.Caching.Distributed;

namespace CatalogService.Services;

/// <summary>
/// Декоратор кэша: основной — Redis (IDistributedCache), fallback — in-memory.
/// При ошибке Redis автоматически переключается на MemoryCacheService.
/// При восстановлении Redis синхронизирует данные при следующем чтении.
/// </summary>
public sealed class CacheService : ICacheService
{
    private readonly IDistributedCache _distributedCache;
    private readonly MemoryCacheService _memoryCache;
    private readonly ILogger<CacheService> _logger;

    /// <summary>
    /// Флаг: используется ли сейчас in-memory fallback.
    /// </summary>
    private volatile bool _usingMemoryFallback;

    public CacheService(
        IDistributedCache distributedCache,
        MemoryCacheService memoryCache,
        ILogger<CacheService> logger)
    {
        _distributedCache = distributedCache;
        _memoryCache = memoryCache;
        _logger = logger;
    }

    public async Task<string?> GetAsync(string key, CancellationToken cancellationToken = default)
    {
        // Если переключены на fallback — читаем только из memory
        if (_usingMemoryFallback)
        {
            return await _memoryCache.GetAsync(key, cancellationToken);
        }

        try
        {
            var value = await _distributedCache.GetStringAsync(key, cancellationToken);

            // При восстановлении Redis: если есть значение в Redis, обновляем memory
            if (value != null)
            {
                await _memoryCache.SetAsync(key, value, cancellationToken: cancellationToken);
            }

            return value;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis недоступен при чтении ключа '{Key}', переключение на in-memory кэш", key);
            _usingMemoryFallback = true;

            // Fallback на in-memory кэш
            return await _memoryCache.GetAsync(key, cancellationToken);
        }
    }

    public async Task SetAsync(string key, string value, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
    {
        // Всегда пишем в memory (для fallback)
        await _memoryCache.SetAsync(key, value, expiration, cancellationToken);

        if (_usingMemoryFallback)
        {
            return;
        }

        try
        {
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = expiration
            };
            await _distributedCache.SetStringAsync(key, value, options, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis недоступен при записи ключа '{Key}', данные сохранены в in-memory кэш", key);
            _usingMemoryFallback = true;
        }
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        // Всегда удаляем из memory
        await _memoryCache.RemoveAsync(key, cancellationToken);

        if (_usingMemoryFallback)
        {
            return;
        }

        try
        {
            await _distributedCache.RemoveAsync(key, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis недоступен при удалении ключа '{Key}'", key);
            _usingMemoryFallback = true;
        }
    }
}