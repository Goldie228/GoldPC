namespace GoldPC.AuthService.Entities;

/// <summary>
/// Refresh токен для обновления access токена
/// </summary>
public class RefreshToken
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// ID пользователя
    /// </summary>
    public Guid UserId { get; set; }
    
    /// <summary>
    /// Токен
    /// </summary>
    public string Token { get; set; } = string.Empty;
    
    /// <summary>
    /// Дата создания
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Дата истечения (7 дней)
    /// </summary>
    public DateTime ExpiresAt { get; set; }
    
    /// <summary>
    /// Дата отзыва
    /// </summary>
    public DateTime? RevokedAt { get; set; }
    
    /// <summary>
    /// IP адрес создания
    /// </summary>
    public string? CreatedByIp { get; set; }
    
    /// <summary>
    /// IP адрес отзыва
    /// </summary>
    public string? RevokedByIp { get; set; }
    
    /// <summary>
    /// Причина отзыва
    /// </summary>
    public string? RevokedReason { get; set; }
    
    /// <summary>
    /// Токен активен
    /// </summary>
    public bool IsActive => RevokedAt == null && ExpiresAt > DateTime.UtcNow;
    
    /// <summary>
    /// Пользователь
    /// </summary>
    public User User { get; set; } = null!;
}