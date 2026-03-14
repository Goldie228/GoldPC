namespace GoldPC.SharedKernel.Enums;

/// <summary>
/// Статусы заявки на услугу в системе GoldPC
/// </summary>
public enum ServiceRequestStatus
{
    /// <summary>
    /// Принята - заявка создана
    /// </summary>
    New = 0,
    
    /// <summary>
    /// В работе - мастер выполняет работу
    /// </summary>
    InProgress = 1,
    
    /// <summary>
    /// Выполнена - работа завершена
    /// </summary>
    Completed = 2,
    
    /// <summary>
    /// Выдана - клиент получил оборудование
    /// </summary>
    Closed = 3,
    
    /// <summary>
    /// Отменена
    /// </summary>
    Cancelled = 4
}