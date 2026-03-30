#pragma warning disable CA1002, CA1716, CA2227, SA1402
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
    /// Gets or sets уникальный идентификатор события
    /// </summary>
    public Guid EventId { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Gets or sets имя контракта (например, "orders-api", "catalog-api")
    /// </summary>
    public required string ContractName { get; set; }

    /// <summary>
    /// Gets or sets предыдущая версия контракта
    /// </summary>
    public string? PreviousVersion { get; set; }

    /// <summary>
    /// Gets or sets новая версия контракта
    /// </summary>
    public required string NewVersion { get; set; }

    /// <summary>
    /// Gets or sets тип изменения (Breaking, NonBreaking, Patch)
    /// </summary>
    public ContractChangeType ChangeType { get; set; }

    /// <summary>
    /// Gets or sets список критических изменений (для Breaking типа)
    /// </summary>
    public List<string> BreakingChanges { get; set; } = new();

    /// <summary>
    /// Gets or sets затронутые эндпоинты
    /// </summary>
    public List<string> AffectedEndpoints { get; set; } = new();

    /// <summary>
    /// Gets or sets руководство по миграции
    /// </summary>
    public string? MigrationGuide { get; set; }

    /// <summary>
    /// Gets or sets время создания события
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Gets or sets инициатор изменения
    /// </summary>
    public string? ChangedBy { get; set; }

    /// <summary>
    /// Gets or sets дополнительные метаданные
    /// </summary>
    public Dictionary<string, string> Metadata { get; set; } = new();
}

/// <summary>
/// DTO уведомления для агента
/// </summary>
public class AgentNotification
{
    /// <summary>
    /// Gets or sets тип уведомления
    /// </summary>
    public required string Type { get; set; }

    /// <summary>
    /// Gets or sets сообщение уведомления
    /// </summary>
    public required string Message { get; set; }

    /// <summary>
    /// Gets or sets требуемое действие
    /// </summary>
    public string? Action { get; set; }

    /// <summary>
    /// Gets or sets дедлайн для выполнения действия
    /// </summary>
    public DateTime? Deadline { get; set; }

    /// <summary>
    /// Gets or sets связанное событие изменения контракта
    /// </summary>
    public ContractChangeEvent? ContractEvent { get; set; }
}
#pragma warning restore CA1002, CA1716, CA2227, SA1402
