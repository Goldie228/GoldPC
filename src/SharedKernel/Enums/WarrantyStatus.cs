namespace GoldPC.SharedKernel.Enums;

/// <summary>
/// Статусы гарантийного талона в системе GoldPC
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
    Annulled = 2
}