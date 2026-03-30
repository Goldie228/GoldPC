namespace GoldPC.SharedKernel.Enums;

/// <summary>
/// Статусы заявки на услугу в системе GoldPC
/// </summary>
public enum ServiceRequestStatus
{
    /// <summary>
    /// Подана (Submitted) - заявка создана клиентом
    /// </summary>
    Submitted = 0,

    /// <summary>
    /// В работе (InProgress) - мастер выполняет работу
    /// </summary>
    InProgress = 1,

    /// <summary>
    /// Ожидание запчастей (PartsPending) - требуются комплектующие
    /// </summary>
    PartsPending = 2,

    /// <summary>
    /// Готова к выдаче (ReadyForPickup) - работа завершена, ожидает клиента
    /// </summary>
    ReadyForPickup = 3,

    /// <summary>
    /// Завершена (Completed) - клиент получил оборудование, оплата произведена
    /// </summary>
    Completed = 4,

    /// <summary>
    /// Отменена (Cancelled)
    /// </summary>
    Cancelled = 5
}
