namespace GoldPC.SharedKernel.Enums;

/// <summary>
/// Тип позиции в заказе
/// </summary>
public enum OrderItemType
{
    /// <summary>
    /// Обычный товар из каталога
    /// </summary>
    Product = 0,

    /// <summary>
    /// Бандл сборки ПК (комплектующие + услуга сборки)
    /// </summary>
    PCBundle = 1,

    /// <summary>
    /// Услуга (ремонт, диагностика и т.д.)
    /// </summary>
    Service = 2
}
