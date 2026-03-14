namespace GoldPC.SharedKernel.Entities;

/// <summary>
/// Базовая сущность с общими свойствами для всех сущностей системы
/// </summary>
public abstract class BaseEntity
{
    /// <summary>
    /// Уникальный идентификатор сущности
    /// </summary>
    public Guid Id { get; set; }
    
    /// <summary>
    /// Дата и время создания записи (UTC)
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Дата и время последнего обновления записи (UTC)
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}