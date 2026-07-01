using GoldPC.SharedKernel.Entities;
using GoldPC.SharedKernel.Enums;

namespace GoldPC.ServicesService.Entities;

/// <summary>
/// Собранный ПК на складе
/// </summary>
public class AssembledUnit : BaseEntity
{
    /// <summary>
    /// ID заявки на сборку
    /// </summary>
    public Guid ServiceRequestId { get; set; }

    /// <summary>
    /// ID конфигурации ПК (ссылка на PCBuilderService)
    /// </summary>
    public Guid PCConfigurationId { get; set; }

    /// <summary>
    /// Серийный номер собранного ПК
    /// </summary>
    public string SerialNumber { get; set; } = string.Empty;

    /// <summary>
    /// Статус (на складе / доставлен)
    /// </summary>
    public AssembledUnitStatus Status { get; set; } = AssembledUnitStatus.Stored;

    /// <summary>
    /// Дата сборки
    /// </summary>
    public DateTime AssembledAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Дата доставки клиенту
    /// </summary>
    public DateTime? DeliveredAt { get; set; }

    /// <summary>
    /// Навигационное свойство к заявке
    /// </summary>
    public ServiceRequest ServiceRequest { get; set; } = null!;
}
