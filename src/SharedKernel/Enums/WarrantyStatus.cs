namespace GoldPC.SharedKernel.Enums;

/// <summary>
/// Статусы гарантийного талона и заявок в системе GoldPC
/// </summary>
public enum WarrantyStatus
{
    /// <summary>
    /// Действует - гарантия активна
    /// </summary>
    Active = 0,
    
    /// <summary>
    /// Истекла - срок гарантии закончился
    /// </summary>
    Expired = 1,
    
    /// <summary>
    /// Аннулирована - гарантия отменена
    /// </summary>
    Annulled = 2,
    
    /// <summary>
    /// Новая заявка - ожидаёт обработки
    /// </summary>
    New = 3,
    
    /// <summary>
    /// В обработке - заявка рассматривается
    /// </summary>
    InProgress = 4,
    
    /// <summary>
    /// Решена - заявка закрыта
    /// </summary>
    Resolved = 5,
    
    /// <summary>
    /// Отклонена - заявка отклонена
    /// </summary>
    Rejected = 6
}
