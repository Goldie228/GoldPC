namespace GoldPC.AuthService.Infrastructure;

/// <summary>
/// Кэш для токенов сброса пароля с автоматическим TTL.
/// Реализация поверх Redis гарантирует, что токен "сгорит" через заданное время,
/// даже если не был явно использован или отозван.
/// </summary>
public interface ITokenCache
{
    /// <summary>Сохранить токен с указанным сроком жизни.</summary>
    Task StoreTokenAsync(string tokenHash, Guid userId, TimeSpan expiration);

    /// <summary>
    /// Проверить токен. Возвращает userId, если токен валиден,
    /// или null, если токен отсутствует (истёк по TTL / не найден).
    /// </summary>
    Task<Guid?> ValidateTokenAsync(string tokenHash);

    /// <summary>Удалить токен (после успешного использования).</summary>
    Task InvalidateTokenAsync(string tokenHash);
}
