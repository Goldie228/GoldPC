namespace CatalogService.Services;

/// <summary>
/// Интерфейс сервиса кэширования с поддержкой graceful degradation.
/// При недоступности Redis автоматически переключается на in-memory кэш.
/// </summary>
public interface ICacheService
{
    /// <summary>
    /// Получить значение из кэша по ключу.
    /// </summary>
    Task<string?> GetAsync(string key, CancellationToken cancellationToken = default);

    /// <summary>
    /// Сохранить значение в кэш с указанием времени жизни.
    /// </summary>
    Task SetAsync(string key, string value, TimeSpan? expiration = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Удалить значение из кэша по ключу.
    /// </summary>
    Task RemoveAsync(string key, CancellationToken cancellationToken = default);
}