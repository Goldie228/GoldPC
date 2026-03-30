namespace GoldPC.SharedKernel.Entities;

/// <summary>
/// Базовая сущность с общими свойствами для всех сущностей системы
/// </summary>
public abstract class BaseEntity
{
    /// <summary>
    /// Gets or sets уникальный идентификатор сущности
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Gets or sets дата и время создания записи (UTC)
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Gets or sets дата и время последнего обновления записи (UTC)
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}
