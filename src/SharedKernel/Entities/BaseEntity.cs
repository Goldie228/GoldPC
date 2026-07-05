namespace GoldPC.SharedKernel.Entities;

/// <summary>
/// Базовая сущность с общими свойствами для всех сущностей системы
/// </summary>
public abstract class BaseEntity
{
    /// <summary>
    /// Получает или задаёт уникальный идентификатор сущности
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Получает или задаёт дата и время создания записи (UTC)
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Получает или задаёт дата и время последнего обновления записи (UTC)
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}
