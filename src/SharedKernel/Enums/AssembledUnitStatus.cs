namespace GoldPC.SharedKernel.Enums;

/// <summary>
/// Статус собранного ПК на складе
/// </summary>
public enum AssembledUnitStatus
{
    /// <summary>
    /// На складе - ПК собран и хранится на складе
    /// </summary>
    Stored = 0,

    /// <summary>
    /// Доставлен - ПК передан клиенту
    /// </summary>
    Delivered = 1
}
