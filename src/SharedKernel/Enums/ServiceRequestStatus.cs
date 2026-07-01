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
    Cancelled = 5,

    /// <summary>
    /// Назначена мастеру (Assigned) - мастер назначен, ожидает начала работы
    /// </summary>
    Assigned = 6,

    /// <summary>
    /// Ожидание комплектующих (AwaitingParts) - мастер запросил комплектующие со склада
    /// </summary>
    AwaitingParts = 7,

    /// <summary>
    /// Комплектующие готовы (PartsReady) - все комплектующие получены мастером
    /// </summary>
    PartsReady = 8,

    /// <summary>
    /// Собран (Assembled) - ПК собран мастером, готов к передаче на склад/в доставку
    /// </summary>
    Assembled = 9,

    /// <summary>
    /// Готов к доставке (ReadyForDelivery) - ПК сдан на склад, передан курьеру
    /// </summary>
    ReadyForDelivery = 10,

    /// <summary>
    /// В доставке (InDelivery) - курьер забрал, в пути к клиенту
    /// </summary>
    InDelivery = 11,

    /// <summary>
    /// Доставлен (Delivered) - клиент получил ПК
    /// </summary>
    Delivered = 12
}
