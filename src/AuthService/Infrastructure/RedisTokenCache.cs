using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace GoldPC.AuthService.Infrastructure;

/// <summary>
/// Реализация ITokenCache поверх Redis через IDistributedCache.
/// Ключи имеют префикс "reset:" и автоматический TTL,
/// поэтому Redis сам удалит истёкшие токены без фоновых задач.
/// </summary>
public sealed class RedisTokenCache : ITokenCache
{
    private readonly IDistributedCache _cache;
    private readonly ILogger<RedisTokenCache> _logger;

    private const string KeyPrefix = "reset:";

    public RedisTokenCache(IDistributedCache cache, ILogger<RedisTokenCache> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public async Task StoreTokenAsync(string tokenHash, Guid userId, TimeSpan expiration)
    {
        var key = KeyPrefix + tokenHash;
        await _cache.SetStringAsync(key, userId.ToString(), new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expiration
        });
    }

    public async Task<Guid?> ValidateTokenAsync(string tokenHash)
    {
        var key = KeyPrefix + tokenHash;
        var value = await _cache.GetStringAsync(key);

        if (value is null)
        {
            _logger.LogWarning("Token not found in Redis (expired or never existed): {Prefix}", 
                tokenHash[..Math.Min(tokenHash.Length, 12)]);
            return null;
        }

        if (Guid.TryParse(value, out var userId))
            return userId;

        _logger.LogError("Invalid value in Redis for token {Prefix}", 
            tokenHash[..Math.Min(tokenHash.Length, 12)]);
        return null;
    }

    public async Task InvalidateTokenAsync(string tokenHash)
    {
        var key = KeyPrefix + tokenHash;
        await _cache.RemoveAsync(key);
    }
}
