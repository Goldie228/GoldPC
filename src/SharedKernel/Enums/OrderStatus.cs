namespace GoldPC.SharedKernel.Enums;

/// <summary>
/// Статусы заказа в системе GoldPC
/// </summary>
public enum OrderStatus
{
    /// <summary>
    /// Новый - заказ создан, ожидает обработки
    /// </summary>
    New = 0,
    
    /// <summary>
    /// В обработке - менеджер работает с заказом
    /// </summary>
    Processing = 1,
    
    /// <summary>
    /// Оплачен - оплата подтверждена
    /// </summary>
    Paid = 2,
    
    /// <summary>
    /// Передан в сборку/ремонт
    /// </summary>
    InProgress = 3,
    
    /// <summary>
    /// Готов - заказ собран/отремонтирован
    /// </summary>
    Ready = 4,
    
    /// <summary>
    /// Выдан - клиент получил заказ
    /// </summary>
    Completed = 5,
    
    /// <summary>
    /// Отменён
    /// </summary>
    Cancelled = 6
}