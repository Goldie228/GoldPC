namespace GoldPC.Shared.DTOs;

/// <summary>
/// Тип изменения контракта
/// </summary>
public enum ContractChangeType
{
    /// <summary>
    /// Критические изменения, нарушающие обратную совместимость
    /// </summary>
    Breaking,
    
    /// <summary>
    /// Новые эндпоинты или поля (обратная совместимость сохранена)
    /// </summary>
    NonBreaking,
    
    /// <summary>
    /// Исправления ошибок, документации
    /// </summary>
    Patch
}

/// <summary>
/// DTO события изменения контракта
/// Используется для уведомления зависимых сервисов об изменении API контрактов
/// </summary>
public class ContractChangeEvent
{
    /// <summary>
    /// Уникальный идентификатор события
    /// </summary>
    public Guid EventId { get; set; } = Guid.NewGuid();
    
    /// <summary>
    /// Имя контракта (например, "orders-api", "catalog-api")
    /// </summary>
    public required string ContractName { get; set; }
    
    /// <summary>
    /// Предыдущая версия контракта
    /// </summary>
    public string? PreviousVersion { get; set; }
    
    /// <summary>
    /// Новая версия контракта
    /// </summary>
    public required string NewVersion { get; set; }
    
    /// <summary>
    /// Тип изменения (Breaking, NonBreaking, Patch)
    /// </summary>
    public ContractChangeType ChangeType { get; set; }
    
    /// <summary>
    /// Список критических изменений (для Breaking типа)
    /// </summary>
    public List<string> BreakingChanges { get; set; } = new();
    
    /// <summary>
    /// Затронутые эндпоинты
    /// </summary>
    public List<string> AffectedEndpoints { get; set; } = new();
    
    /// <summary>
    /// Руководство по миграции
    /// </summary>
    public string? MigrationGuide { get; set; }
    
    /// <summary>
    /// Время создания события
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Инициатор изменения
    /// </summary>
    public string? ChangedBy { get; set; }
    
    /// <summary>
    /// Дополнительные метаданные
    /// </summary>
    public Dictionary<string, string> Metadata { get; set; } = new();
}

/// <summary>
/// DTO уведомления для агента
/// </summary>
public class AgentNotification
{
    /// <summary>
    /// Тип уведомления
    /// </summary>
    public required string Type { get; set; }
    
    /// <summary>
    /// Сообщение уведомления
    /// </summary>
    public required string Message { get; set; }
    
    /// <summary>
    /// Требуемое действие
    /// </summary>
    public string? Action { get; set; }
    
    /// <summary>
    /// Дедлайн для выполнения действия
    /// </summary>
    public DateTime? Deadline { get; set; }
    
    /// <summary>
    /// Связанное событие изменения контракта
    /// </summary>
    public ContractChangeEvent? ContractEvent { get; set; }
}