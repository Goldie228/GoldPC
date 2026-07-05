using GoldPC.Shared.Authorization;

#pragma warning disable CA1716 // Namespace conflicts with reserved word 'Shared'
namespace GoldPC.Shared.Entities;
#pragma warning restore CA1716

/// <summary>
/// Представляет системное уведомление для пользователей
/// </summary>
public class Notification
{
    /// <summary>Получает или задаёт уникальный идентификатор уведомления.</summary>
    public Guid Id { get; set; }

    /// <summary>Получает или задаёт идентификатор пользователя, которому принадлежит уведомление.</summary>
    public Guid UserId { get; set; }

    /// <summary>Получает или задаёт заголовок уведомления.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Получает или задаёт текст уведомления.</summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>Получает или задаёт тип уведомления.</summary>
    public NotificationType Type { get; set; }

    /// <summary>Получает или задаёт уровень приоритета уведомления.</summary>
    public NotificationPriority Priority { get; set; }

    /// <summary>Получает или задаёт значение, указывающее, было ли уведомление прочитано.</summary>
    public bool IsRead { get; set; }

    /// <summary>Получает или задаёт дату и время создания уведомления.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>Получает или задаёт дату и время прочтения уведомления.</summary>
    public DateTime? ReadAt { get; set; }

    /// <summary>Получает или задаёт необязательный URL, связанный с уведомлением.</summary>
    public string? RelatedUrl { get; set; }

    /// <summary>Получает или задаёт необязательные JSON-метаданные для уведомления.</summary>
    public string? Metadata { get; set; }
}

/// <summary>
/// Тип уведомления
/// </summary>
public enum NotificationType
{
    /// <summary>Уведомление об изменении статуса заказа.</summary>
    OrderStatusChanged,

    /// <summary>Уведомление об обновлении заявки на ремонт.</summary>
    RepairTicketUpdated,

    /// <summary>Предупреждение о низком уровне запасов.</summary>
    LowStockAlert,

    /// <summary>Уведомление о входе пользователя.</summary>
    LoginNotification,

    /// <summary>Уведомление о новом сообщении поддержки.</summary>
    NewSupportMessage,

    /// <summary>Общесистемное объявление.</summary>
    SystemAnnouncement,

    /// <summary>Уведомление о назначении задачи.</summary>
    TaskAssigned,

    /// <summary>Предупреждение об изменениях в инвентаре.</summary>
    InventoryAlert,

    /// <summary>Уведомление об обновлении товара.</summary>
    ProductUpdate,

    /// <summary>Уведомление об обновлении профиля пользователя.</summary>
    UserUpdate,

    /// <summary>Уведомление об изменениях настроек.</summary>
    SettingsUpdate,
}

/// <summary>
/// Уровень приоритета уведомления
/// </summary>
public enum NotificationPriority
{
    /// <summary>Низкий приоритет уведомления.</summary>
    Low,

    /// <summary>Средний приоритет уведомления.</summary>
    Medium,

    /// <summary>Высокий приоритет уведомления.</summary>
    High,

    /// <summary>Критический приоритет уведомления.</summary>
    Critical,
}
