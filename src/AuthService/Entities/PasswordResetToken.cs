namespace GoldPC.AuthService.Entities;

/// <summary>
/// Токен для сброса пароля.
/// Хранит безопасный токен (SHA256) для восстановления доступа к учётной записи.
/// </summary>
public class PasswordResetToken
{
    /// <summary>
    /// Внутренний ID записи
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// ID пользователя, запросившего сброс
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Хеш токена (SHA256).
    /// Сам токен не хранится в БД — только его хеш.
    /// </summary>
    public string TokenHash { get; set; } = string.Empty;

    /// <summary>
    /// Когда был создан токен
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Срок действия токена (по умолчанию +1 час от создания)
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// Когда токен был использован (null = не использован)
    /// </summary>
    public DateTime? UsedAt { get; set; }

    /// <summary>
    /// IP адрес, с которого был использован токен
    /// </summary>
    public string? UsedByIp { get; set; }

    /// <summary>
    /// Токен ещё действителен?
    /// Не истёк, не использован
    /// </summary>
    public bool IsValid => UsedAt == null && ExpiresAt > DateTime.UtcNow;

    /// <summary>
    /// Навигационное свойство
    /// </summary>
    public User User { get; set; } = null!;
}
